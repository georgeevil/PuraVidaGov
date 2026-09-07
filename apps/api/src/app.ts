import cors from 'cors';
import { type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { ACTIVITIES, HttpError, LEGAL_REFS, createServiceApp, errorHandler, loginSchema, otpSchema, type Citizen } from '@pvg/shared';
import { config } from './config.js';
import { busAudit, busRegistry, busRequest, busReset } from './bus-client.js';
import { citizenOf, consumeChallenge, createChallenge, issueToken, requireAuth, resetChallenges, verifyCredentials } from './auth.js';
import { IDENTITY_STEP, getTransaction, listTransactions, reset as resetEngine, startTransaction, statusView } from './engine.js';
import { WORKFLOWS, getWorkflow, listDefinitions } from './workflows/index.js';
import { toDefinition } from './workflows/types.js';
import { isOptionSource, loadOptions } from './options.js';
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

/** 400 VALIDATION_ERROR carrying zod's flattened issues in `details` (CONTRACTS v2). */
class ValidationError extends HttpError {
  constructor(
    message: string,
    public details: unknown,
  ) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

const startBodySchema = z.object({
  input: z.record(z.unknown()).optional().default({}),
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

  app.get('/api/activities', requireAuth, (_req, res) => {
    res.json(ACTIVITIES);
  });

  app.get('/api/benefits', requireAuth, (_req, res) => {
    res.json({ ...config.benefits });
  });

  // ---------------------------------------------------------------- workflows (v2)
  app.get('/api/workflows', (_req, res) => {
    res.json(listDefinitions());
  });

  app.get(
    '/api/workflows/:id',
    wrap((req, res) => {
      const spec = getWorkflow(String(req.params.id));
      if (!spec) throw new HttpError(404, 'WORKFLOW_NOT_FOUND', 'No existe ese trámite');
      res.json(toDefinition(spec));
    }),
  );

  app.get(
    '/api/options/:source',
    requireAuth,
    wrap(async (req, res) => {
      const source = String(req.params.source);
      if (!isOptionSource(source)) throw new HttpError(404, 'OPTIONS_UNKNOWN', 'No existe esa lista de opciones');
      res.json(await loadOptions(source, citizenOf(req)));
    }),
  );

  app.post(
    '/api/workflows/:id/start',
    requireAuth,
    wrap((req, res) => {
      const spec = getWorkflow(String(req.params.id));
      if (!spec) throw new HttpError(404, 'WORKFLOW_NOT_FOUND', 'No existe ese trámite');
      const body = parse(startBodySchema, req.body);
      if (body.consent !== true) {
        throw new HttpError(400, 'CONSENT_REQUIRED', 'Debe autorizar el intercambio de sus datos entre instituciones para continuar');
      }
      if (!spec.available) throw new HttpError(409, 'WORKFLOW_UNAVAILABLE', 'Este trámite todavía no está disponible en la demostración');
      const parsed = spec.inputSchema.safeParse(body.input);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const where = first?.path.length ? `${first.path.join('.')}: ` : '';
        throw new ValidationError(`Datos inválidos — ${where}${first?.message ?? 'revise el formulario'}`, parsed.error.flatten());
      }
      const txnId = startTransaction(citizenOf(req), spec, parsed.data as Record<string, unknown>);
      res.status(202).json({ txnId });
    }),
  );

  // ---------------------------------------------------------------- transactions (v2)
  app.get('/api/transactions', requireAuth, (req, res) => {
    res.json(listTransactions(citizenOf(req)));
  });

  const ownedTxn = (req: Request) => {
    const txn = getTransaction(String(req.params.txnId), citizenOf(req));
    if (!txn) throw new HttpError(404, 'TXN_NOT_FOUND', 'No se encontró la transacción');
    return txn;
  };

  const completedTxn = (req: Request) => {
    const txn = ownedTxn(req);
    if (txn.status === 'running') throw new HttpError(409, 'NOT_COMPLETED', 'El trámite todavía está en proceso');
    if (txn.status === 'failed' || !txn.result) {
      const errors = txn.steps.filter((s) => s.status === 'error').map((s) => `${s.label}: ${s.error ?? 'error'}`);
      throw new HttpError(422, 'FAILED', `El trámite falló. ${errors.join(' · ') || 'Sin detalle'}`);
    }
    return txn;
  };

  app.get(
    '/api/transactions/:txnId',
    requireAuth,
    wrap((req, res) => {
      res.json(statusView(ownedTxn(req)));
    }),
  );

  app.get(
    '/api/transactions/:txnId/result',
    requireAuth,
    wrap((req, res) => {
      res.json(completedTxn(req));
    }),
  );

  app.get(
    '/api/transactions/:txnId/pdf',
    requireAuth,
    wrap((req, res) => {
      const txn = completedTxn(req);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PuraVidaGov-${txn.txnId}.pdf"`);
      const doc = renderSummaryPdf(txn, getWorkflow(txn.workflowId)?.fields ?? []);
      doc.pipe(res);
      doc.end();
    }),
  );

  // ---------------------------------------------------------------- legal framework (v2)
  app.get('/api/legal', (_req, res) => {
    res.json({
      refs: Object.values(LEGAL_REFS),
      workflows: WORKFLOWS.map((w) => ({
        id: w.id,
        title: w.title,
        legal: w.legal,
        steps: [...(w.available ? [IDENTITY_STEP] : []), ...w.steps].map((s) => ({ id: s.id, label: s.label, agency: s.agency, legal: s.legal })),
      })),
    });
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
      resetEngine();
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
    if (err instanceof ValidationError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
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
