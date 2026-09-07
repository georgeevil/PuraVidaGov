import {
  createServiceApp,
  errorHandler,
  registerJobSeekerSchema,
  simulatedLatency,
  todayIso,
  type JobSeekerResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type JobSeeker } from './store.js';

export const SERVICE_NAME = 'mtss';
export const PLATFORM = 'Agencia Nacional de Empleo (ane.cr)';
export const FIRST_APPOINTMENT_DAYS = 7;
export const DEFAULT_TRAINING_OFFER = 'INA: Habilidades digitales básicas';

/** INA course suggested from a keyword found in `desiredArea` (first match wins; data, not code). */
export const TRAINING_OFFERS: Array<{ keywords: string[]; offer: string }> = [
  { keywords: ['software', 'programación', 'programacion', 'desarrollo'], offer: 'INA: Desarrollo web full stack' },
  { keywords: ['turismo', 'turística', 'turistica', 'hotel'], offer: 'INA: Guía de turismo local' },
];

type RegisterJobSeekerBody = z.infer<typeof registerJobSeekerSchema>;

export function trainingOfferFor(desiredArea: string): string {
  const area = desiredArea.toLowerCase();
  return TRAINING_OFFERS.find((t) => t.keywords.some((k) => area.includes(k)))?.offer ?? DEFAULT_TRAINING_OFFER;
}

/** ISO date `days` days after `iso` (UTC arithmetic). */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toResponse(s: JobSeeker): JobSeekerResponse {
  const { registrationNumber, platform, trainingOffer, firstAppointment } = s;
  return { registrationNumber, platform, trainingOffer, firstAppointment };
}

export function createApp(): Express {
  const apiKey = process.env.MTSS_API_KEY ?? 'demo-mtss-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/mtss/jobSeekers', (_req, res) => {
    res.json(store.list());
  });

  app.post(
    '/mtss/registerJobSeeker',
    validateBody(registerJobSeekerSchema),
    wrap(async (req, res) => {
      const body = req.body as RegisterJobSeekerBody;
      await simulatedLatency();

      const existing = store.find(body.citizenId);
      if (existing) return res.json(toResponse(existing));

      const today = todayIso();
      const year = Number(today.slice(0, 4));
      const seeker = store.save({
        citizenId: body.citizenId,
        fullName: body.fullName,
        canton: body.canton,
        lastOccupation: body.lastOccupation,
        desiredArea: body.desiredArea,
        terminationDate: body.terminationDate,
        registrationNumber: `ANE-${year}-${String(store.nextSequence(year)).padStart(6, '0')}`,
        platform: PLATFORM,
        trainingOffer: trainingOfferFor(body.desiredArea),
        firstAppointment: addDaysIso(today, FIRST_APPOINTMENT_DAYS),
      });
      res.json(toResponse(seeker));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
