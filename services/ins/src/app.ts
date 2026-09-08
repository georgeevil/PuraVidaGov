import {
  createServiceApp,
  errorHandler,
  marchamoStatusSchema,
  simulatedLatency,
  todayIso,
  type MarchamoStatusResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type MarchamoPolicy } from './store.js';

export const SERVICE_NAME = 'ins';

/** Demo marchamo: 3 % of the vehicle's fiscal value (docs/CONTRACTS.md v4 → INS). */
export const MARCHAMO_RATE = 0.03;

type MarchamoStatusBody = z.infer<typeof marchamoStatusSchema>;

export function marchamoAmount(fiscalValueCrc: number): number {
  return Math.round(fiscalValueCrc * MARCHAMO_RATE);
}

function toResponse(p: MarchamoPolicy): MarchamoStatusResponse {
  const { plate, year, paid, amountCrc, soaPolicy } = p;
  return { plate, year, paid, amountCrc, soaPolicy };
}

function vehicleNotFound(plate: string) {
  return { error: { code: 'VEHICLE_NOT_FOUND', message: `La placa ${plate} no está registrada en el INS` } };
}

export function createApp(): Express {
  const apiKey = process.env.INS_API_KEY ?? 'demo-ins-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/ins/policies', (_req, res) => {
    res.json(store.listPolicies());
  });

  app.get('/ins/vehicles', (_req, res) => {
    res.json(store.listVehicles());
  });

  app.post(
    '/ins/marchamoStatus',
    validateBody(marchamoStatusSchema),
    wrap(async (req, res) => {
      const body = req.body as MarchamoStatusBody;
      await simulatedLatency();

      const existing = store.findPolicy(body.plate);
      if (existing) return res.json(toResponse(existing));

      const vehicle = store.findVehicle(body.plate);
      if (!vehicle) return res.status(404).json(vehicleNotFound(body.plate));

      const issuedAt = todayIso();
      const year = Number(issuedAt.slice(0, 4));
      const policy = store.savePolicy({
        plate: vehicle.plate,
        year,
        paid: true, // seed: every insured vehicle has the current year's marchamo paid
        amountCrc: marchamoAmount(vehicle.fiscalValueCrc),
        soaPolicy: `SOA-${year}-${String(store.nextPolicySequence(year)).padStart(6, '0')}`,
        fiscalValueCrc: vehicle.fiscalValueCrc,
        issuedAt,
      });
      res.json(toResponse(policy));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
