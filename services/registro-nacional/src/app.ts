import {
  cedulaSchema,
  createServiceApp,
  errorHandler,
  registerCompanySchema,
  simulatedLatency,
  todayIso,
  type CompanyResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import { randomInt } from 'node:crypto';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Company } from './store.js';

export const SERVICE_NAME = 'registro-nacional';

type RegisterCompanyBody = z.infer<typeof registerCompanySchema>;

function toResponse(c: Company): CompanyResponse {
  const { cedulaJuridica, legalName, registrationDate, tomo } = c;
  return { cedulaJuridica, legalName, registrationDate, tomo };
}

/** "3-101-NNNNNN" not yet issued by this instance. */
function freshCedulaJuridica(): string {
  let id = '';
  for (let i = 0; i < 20; i++) {
    id = `3-101-${randomInt(100000, 999999)}`;
    if (!store.hasCedulaJuridica(id)) return id;
  }
  return id;
}

/** Registry "tomo" reference, e.g. "2026-123456-1-1". */
function tomoFor(year: number): string {
  return `${year}-${randomInt(100000, 999999)}-1-1`;
}

export function createApp(): Express {
  const apiKey = process.env.REGISTRO_NACIONAL_API_KEY ?? 'demo-registro-nacional-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/registro-nacional/companies', (_req, res) => {
    res.json(store.listCompanies());
  });

  app.get(
    '/registro-nacional/properties',
    wrap(async (req, res) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : '';
      if (!cedulaSchema.safeParse(ownerId).success) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'ownerId es obligatorio y debe tener el formato 0-0000-0000' },
        });
      }
      await simulatedLatency();
      res.json(store.propertiesOf(ownerId));
    }),
  );

  app.get(
    '/registro-nacional/property/:folio',
    wrap(async (req, res) => {
      const folio = String(req.params.folio);
      await simulatedLatency();
      const property = store.getProperty(folio);
      if (!property) {
        return res
          .status(404)
          .json({ error: { code: 'PROPERTY_NOT_FOUND', message: `No existe una finca con el folio real ${folio}` } });
      }
      res.json(property);
    }),
  );

  app.post(
    '/registro-nacional/registerCompany',
    validateBody(registerCompanySchema),
    wrap(async (req, res) => {
      const body = req.body as RegisterCompanyBody;
      await simulatedLatency();

      const existing = store.findCompany(body.citizenId, body.legalName);
      if (existing) return res.json(toResponse(existing));

      const registrationDate = todayIso();
      const company = store.saveCompany({
        citizenId: body.citizenId,
        fullName: body.fullName,
        activityCode: body.activityCode,
        address: body.address,
        legalName: body.legalName.trim(),
        cedulaJuridica: freshCedulaJuridica(),
        registrationDate,
        tomo: tomoFor(Number(registrationDate.slice(0, 4))),
      });
      res.json(toResponse(company));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
