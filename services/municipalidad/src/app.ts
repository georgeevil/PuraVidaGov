import {
  addYearsIso,
  createServiceApp,
  errorHandler,
  findActivity,
  issueLicenseSchema,
  patenteNumber,
  simulatedLatency,
  todayIso,
  type MunicipalityResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { CANTONS, findCanton, store, type License } from './store.js';

export const SERVICE_NAME = 'municipalidad';

type IssueLicenseBody = z.infer<typeof issueLicenseSchema>;

function toResponse(l: License): MunicipalityResponse {
  const { patenteNumber: p, municipality, issueDate, expiryDate, annualFeeCrc } = l;
  return { patenteNumber: p, municipality, issueDate, expiryDate, annualFeeCrc };
}

export function createApp(): Express {
  const apiKey = process.env.MUNICIPALIDAD_API_KEY ?? 'demo-municipalidad-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/municipalidad/licenses', (_req, res) => {
    res.json(store.list());
  });

  app.get('/municipalidad/cantons', (_req, res) => {
    res.json(CANTONS);
  });

  app.post(
    '/municipalidad/issueLicense',
    validateBody(issueLicenseSchema),
    wrap(async (req, res) => {
      const body = req.body as IssueLicenseBody;
      await simulatedLatency();

      const canton = findCanton(body.municipality);
      if (!canton) {
        return res.status(422).json({
          error: { code: 'MUNICIPALITY_UNKNOWN', message: `La municipalidad de ${body.municipality} no está integrada al bus` },
        });
      }
      const activity = findActivity(body.activityCode);
      if (!activity) {
        return res.status(422).json({
          error: { code: 'ACTIVITY_UNKNOWN', message: `El código de actividad ${body.activityCode} no está registrado` },
        });
      }

      const existing = store.findByNite(body.nite);
      if (existing) return res.json(toResponse(existing));

      const issueDate = todayIso();
      const year = Number(issueDate.slice(0, 4));
      const license = store.save({
        nite: body.nite,
        citizenId: body.citizenId,
        businessName: body.businessName,
        activityCode: activity.code,
        address: body.address,
        patenteNumber: patenteNumber(year, store.nextSequence(year)),
        municipality: canton.name,
        issueDate,
        expiryDate: addYearsIso(issueDate, 1),
        annualFeeCrc: Math.round(activity.baseFeeCrc * canton.feeMultiplier),
      });
      res.json(toResponse(license));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
