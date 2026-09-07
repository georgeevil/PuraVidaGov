import {
  createServiceApp,
  employerNumber,
  errorHandler,
  registerEmployerSchema,
  simulatedLatency,
  todayIso,
  type CcssResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Employer } from './store.js';

export const SERVICE_NAME = 'ccss';

type RegisterEmployerBody = z.infer<typeof registerEmployerSchema>;

/** Demo figures: contribution = 26.67 % of a reference monthly salary (CRC), per person covered. */
export const CONTRIBUTION_RATE = 0.2667;
export const REFERENCE_SALARY_CRC = 460000; // roughly the 2026 minimum wage for unskilled workers

export function monthlyContribution(estimatedEmployees: number): number {
  const persons = Math.max(1, estimatedEmployees); // the owner counts when self-employed
  return Math.round(REFERENCE_SALARY_CRC * CONTRIBUTION_RATE * persons);
}

function toResponse(e: Employer): CcssResponse {
  const { employerNumber: n, registrationType, registrationDate, monthlyContributionRateCrc } = e;
  return { employerNumber: n, registrationType, registrationDate, monthlyContributionRateCrc };
}

function freshEmployerNumber(): string {
  for (let i = 0; i < 20; i++) {
    const n = employerNumber();
    if (!store.hasNumber(n)) return n;
  }
  return employerNumber();
}

export function createApp(): Express {
  const apiKey = process.env.CCSS_API_KEY ?? 'demo-ccss-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/ccss/employers', (_req, res) => {
    res.json(store.list());
  });

  app.post(
    '/ccss/registerEmployer',
    validateBody(registerEmployerSchema),
    wrap(async (req, res) => {
      const body = req.body as RegisterEmployerBody;
      await simulatedLatency();

      const existing = store.findByNite(body.nite);
      if (existing) return res.json(toResponse(existing));

      const employer = store.save({
        nite: body.nite,
        citizenId: body.citizenId,
        fullName: body.fullName,
        businessName: body.businessName,
        estimatedEmployees: body.estimatedEmployees,
        employerNumber: freshEmployerNumber(),
        registrationType: body.estimatedEmployees === 0 ? 'self-employed' : 'employer',
        registrationDate: todayIso(),
        monthlyContributionRateCrc: monthlyContribution(body.estimatedEmployees),
      });
      res.json(toResponse(employer));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
