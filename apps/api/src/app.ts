import cors from 'cors';
import { type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  ACTIVITIES,
  HttpError,
  businessRegistrationSchema,
  createServiceApp,
  errorHandler,
  loginSchema,
  otpSchema,
  type Citizen,
} from '@pvg/shared';
import { config } from './config.js';
import { busAudit, busRegistry, busRequest, busReset } from './bus-client.js';
import { citizenOf, consumeChallenge, createChallenge, issueToken, requireAuth, resetChallenges, verifyCredentials } from './auth.js';
import { SERVICES } from './services-catalogue.js';
import { getTransaction, reset as resetWorkflow, startRegistration, statusView } from './workflow.js';
import { renderSummaryPdf } from './pdf.js';

type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const first = r.error.issues[0];
    const where = first?.path.length ? `${first.path.join('.')}: ` : '';
    throw new HttpError(400, 'VALIDATION_ERROR', `Datos inválidos — ${where}${first?.message ?? 'revise el formulario'}`);
  }
  return r.data;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `+506 ****-${last4 || '****'}`;
}

async function fetchCitizen(citizenId: string, purpose: string, reference: string) {
  const res = await busRequest<Citizen>({
    service: 'registro',
    action: 'getCitizen',
    data: { id: citizenId },
    subjectId: citizenId,
    consent: { granted: true, reference },
    purpose,
  });
  if (!res.ok) {
    const status = res.error.status === 404 ? 404 : 502;
    throw new HttpError(status, res.error.code, res.error.message);
  }
  return {
    citizen: res.data,
    provenance: { source: 'registro' as const, exchangeId: res.exchangeId, fetchedAt: res.timestamp },
  };
}

const registerBodySchema = businessRegistrationSchema
  .omit({ citizenId: true })
  .extend({
    citizenId: z.string().optional(),
    municipality: z.string().trim().max(60).optional().default(''),
    consent: z.boolean().optional(),
  });

export function createApp(): Express {
  const app = createServiceApp({ name: 'api' });
  app.use(cors({ origin: config.corsOrigin, credentials: false }));

  // ---------------------------------------------------------------- auth
  app.post(
    '/api/login',
    wrap((req, res) => {
      const { id, password } = parse(loginSchema, req.body);
      if (!verifyCredentials(id, password)) {
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'Cédula o contraseña incorrecta');
      }
      const challenge = createChallenge(id);
      res.json({
        challengeId: challenge.id,
        otp: { channel: 'sms', maskedPhone: maskPhone(PHONES[id] ?? ''), demoCode: challenge.code },
      });
    }),
  );

  app.post(
    '/api/login/otp',
    wrap(async (req, res) => {
      const { challengeId, code } = parse(otpSchema, req.body);
      const check = consumeChallenge(challengeId, code);
      if (!check.ok) {
        if (check.reason === 'CHALLENGE_EXPIRED') throw new HttpError(410, 'CHALLENGE_EXPIRED', 'El código venció; inicie sesión de nuevo');
        throw new HttpError(401, 'INVALID_OTP', 'Código de verificación incorrecto');
      }
      const { citizen, provenance } = await fetchCitizen(check.citizenId, 'Cargar perfil al iniciar sesión', `login:${challengeId}`);
      res.json({ token: issueToken(check.citizenId), citizen, provenance });
    }),
  );

  app.post('/api/logout', requireAuth, (_req, res) => {
    res.status(204).end();
  });

  // ---------------------------------------------------------------- profile & catalogue
  app.get(
    '/api/profile',
    requireAuth,
    wrap(async (req, res) => {
      const id = citizenOf(req);
      res.json(await fetchCitizen(id, 'Mostrar perfil', `profile:${id}`));
    }),
  );

  app.get('/api/services', requireAuth, (_req, res) => {
    res.json(SERVICES);
  });

  app.get('/api/activities', requireAuth, (_req, res) => {
    res.json(ACTIVITIES);
  });

  app.get('/api/benefits', requireAuth, (_req, res) => {
    res.json({ ...config.benefits });
  });

  // ---------------------------------------------------------------- business registration workflow
  app.post(
    '/api/business/register',
    requireAuth,
    wrap((req, res) => {
      const body = parse(registerBodySchema, req.body);
      if (body.consent !== true) {
        throw new HttpError(400, 'CONSENT_REQUIRED', 'Debe autorizar el intercambio de sus datos entre instituciones para continuar');
      }
      const { consent: _consent, citizenId: _ignored, ...request } = body;
      const txnId = startRegistration(citizenOf(req), { ...request, municipality: request.municipality ?? '', citizenId: citizenOf(req) });
      res.status(202).json({ txnId });
    }),
  );

  const ownedTxn = (req: Request) => {
    const txn = getTransaction(String(req.params.txnId), citizenOf(req));
    if (!txn) throw new HttpError(404, 'TXN_NOT_FOUND', 'No se encontró la transacción');
    return txn;
  };

  app.get('/api/business/status/:txnId', requireAuth, (req, res, next) => {
    try {
      res.json(statusView(ownedTxn(req)));
    } catch (e) {
      next(e);
    }
  });

  const completedTxn = (req: Request) => {
    const txn = ownedTxn(req);
    if (txn.status === 'running') throw new HttpError(409, 'NOT_COMPLETED', 'El trámite todavía está en proceso');
    if (txn.status === 'failed' || !txn.result) {
      const errors = txn.steps.filter((s) => s.status === 'error').map((s) => `${s.label}: ${s.error ?? 'error'}`);
      throw new HttpError(422, 'FAILED', `El trámite falló. ${errors.join(' · ') || 'Sin detalle'}`);
    }
    return txn;
  };

  app.get('/api/business/result/:txnId', requireAuth, (req, res, next) => {
    try {
      res.json(completedTxn(req));
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/business/result/:txnId/pdf', requireAuth, (req, res, next) => {
    try {
      const txn = completedTxn(req);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PuraVidaGov-${txn.txnId}.pdf"`);
      const doc = renderSummaryPdf(txn);
      doc.pipe(res);
      doc.end();
    } catch (e) {
      next(e);
    }
  });

  // ---------------------------------------------------------------- bus proxies
  app.get(
    '/api/audit',
    requireAuth,
    wrap(async (req, res) => {
      const limit = Number(req.query.limit ?? 100);
      res.json(await busAudit(citizenOf(req), Number.isFinite(limit) && limit > 0 ? limit : 100));
    }),
  );

  app.get(
    '/api/registry',
    requireAuth,
    wrap(async (_req, res) => {
      res.json(await busRegistry());
    }),
  );

  // ---------------------------------------------------------------- demo reset (no auth)
  app.post(
    '/api/__demo/reset',
    wrap(async (_req, res) => {
      resetWorkflow();
      resetChallenges();
      let bus: 'ok' | 'unavailable' = 'ok';
      try {
        await busReset();
      } catch {
        bus = 'unavailable';
      }
      res.json({ ok: true, reset: { api: 'ok', bus } });
    }),
  );

  // Fallback for unknown /api routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
  });

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    // Bus unreachable or unexpected bus error → 502 with the error code from the message prefix.
    if (err instanceof Error && !(err instanceof HttpError) && /^[A-Z_]+: /.test(err.message)) {
      const code = err.message.split(':')[0]!;
      return res.status(502).json({ error: { code, message: 'El bus de interoperabilidad no está disponible en este momento' } });
    }
    if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido' } });
    }
    return errorHandler('api')(err, req, res, next);
  });

  return app;
}

/** Demo phone numbers used only to render the masked OTP hint before the citizen is fetched. */
const PHONES: Record<string, string> = {
  '1-2345-6789': '+506 8888-1234',
  '7-0123-0456': '+506 8888-5678',
  '2-0987-0654': '+506 8888-9012',
};
