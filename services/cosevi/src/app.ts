import {
  addYearsIso,
  checkFinesSchema,
  createServiceApp,
  errorHandler,
  renewLicenceSchema,
  simulatedLatency,
  todayIso,
  type LicenceRenewalResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Licence } from './store.js';

export const SERVICE_NAME = 'cosevi';

/** Points every renewed licence starts with (Ley 9078 point system, simplified). */
export const INITIAL_POINTS = 12;
/** Demo fee: ₡5 000 per year of validity plus ₡5 000 of issuance. */
export const FEE_PER_YEAR_CRC = 5000;
export const ISSUANCE_FEE_CRC = 5000;

type CheckFinesBody = z.infer<typeof checkFinesSchema>;
type RenewLicenceBody = z.infer<typeof renewLicenceSchema>;

export function renewalFee(validityYears: number): number {
  return FEE_PER_YEAR_CRC * validityYears + ISSUANCE_FEE_CRC;
}

function toResponse(l: Licence): LicenceRenewalResponse {
  const { licenceNumber, categories, issueDate, expiryDate, points, feeCrc } = l;
  return { licenceNumber, categories, issueDate, expiryDate, points, feeCrc };
}

export function createApp(): Express {
  const apiKey = process.env.COSEVI_API_KEY ?? 'demo-cosevi-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/cosevi/licences', (_req, res) => {
    res.json(store.listLicences());
  });

  app.get('/cosevi/drivers', (_req, res) => {
    res.json(store.listDrivers());
  });

  app.post(
    '/cosevi/checkFines',
    validateBody(checkFinesSchema),
    wrap(async (req, res) => {
      const body = req.body as CheckFinesBody;
      await simulatedLatency();
      res.json(store.finesFor(body.citizenId));
    }),
  );

  app.post(
    '/cosevi/renewLicence',
    validateBody(renewLicenceSchema),
    wrap(async (req, res) => {
      const body = req.body as RenewLicenceBody;
      await simulatedLatency();

      const existing = store.findLicence(body.citizenId);
      if (existing) return res.json(toResponse(existing));

      const fines = store.finesFor(body.citizenId);
      if (fines.pendingFines > 0) {
        return res.status(422).json({
          error: {
            code: 'PENDING_FINES',
            message: `La persona tiene ${fines.pendingFines} multa(s) pendiente(s) por ₡${fines.pendingAmountCrc.toLocaleString('es-CR')}; debe cancelarlas antes de renovar`,
          },
        });
      }
      if (!fines.marchamoPaid) {
        return res.status(422).json({
          error: { code: 'MARCHAMO_UNPAID', message: 'El marchamo del período vigente no está al día' },
        });
      }

      const issueDate = todayIso();
      const licence = store.saveLicence({
        citizenId: body.citizenId,
        fullName: body.fullName,
        medicalCertificate: body.medicalCertificate,
        validityYears: body.validityYears,
        licenceNumber: body.citizenId,
        categories: [...body.categories],
        issueDate,
        expiryDate: addYearsIso(issueDate, body.validityYears),
        points: INITIAL_POINTS,
        feeCrc: renewalFee(body.validityYears),
      });
      res.json(toResponse(licence));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
