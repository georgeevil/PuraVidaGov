import {
  applyScholarshipSchema,
  createServiceApp,
  errorHandler,
  simulatedLatency,
  todayIso,
  type ScholarshipResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Grade, type ScholarshipApplication } from './store.js';

export const SERVICE_NAME = 'imas';

/** Demo poverty line: monthly per-capita household income below this qualifies (docs/CONTRACTS.md v4 → IMAS). */
export const POVERTY_LINE_CRC = 130000;
/** Monthly transfer per programme when eligible. */
export const AMOUNT_BY_PROGRAMME: Record<ScholarshipResponse['programme'], number> = { Crecemos: 25000, Avancemos: 40000 };

type ApplyScholarshipBody = z.infer<typeof applyScholarshipSchema>;

/** Crecemos covers preschool and primary; Avancemos covers secondary. */
export function programmeFor(grade: Grade): ScholarshipResponse['programme'] {
  return grade === 'septimo' ? 'Avancemos' : 'Crecemos';
}

export function perCapitaIncome(householdMonthlyIncomeCrc: number, householdSize: number): number {
  return Math.round(householdMonthlyIncomeCrc / householdSize);
}

export function isEligible(perCapitaCrc: number): boolean {
  return perCapitaCrc < POVERTY_LINE_CRC;
}

export function basisFor(perCapitaCrc: number, eligible: boolean): string {
  const amount = `₡${perCapitaCrc.toLocaleString('es-CR')}`;
  return eligible
    ? `SINIRUBE: ingreso per cápita de ${amount} bajo la línea de pobreza (₡${POVERTY_LINE_CRC.toLocaleString('es-CR')})`
    : `SINIRUBE: ingreso per cápita de ${amount} sobre la línea de pobreza (₡${POVERTY_LINE_CRC.toLocaleString('es-CR')})`;
}

function toResponse(a: ScholarshipApplication): ScholarshipResponse {
  const { applicationNumber, programme, eligible, monthlyAmountCrc, basis } = a;
  return { applicationNumber, programme, eligible, monthlyAmountCrc, basis };
}

export function createApp(): Express {
  const apiKey = process.env.IMAS_API_KEY ?? 'demo-imas-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/imas/applications', (_req, res) => {
    res.json(store.listApplications());
  });

  app.post(
    '/imas/applyScholarship',
    validateBody(applyScholarshipSchema),
    wrap(async (req, res) => {
      const body = req.body as ApplyScholarshipBody;
      await simulatedLatency();

      const existing = store.findApplication(body.studentId);
      if (existing) return res.json(toResponse(existing));

      const appliedAt = todayIso();
      const year = Number(appliedAt.slice(0, 4));
      const perCapita = perCapitaIncome(body.householdMonthlyIncomeCrc, body.householdSize);
      const eligible = isEligible(perCapita);
      const programme = programmeFor(body.grade);
      const application = store.saveApplication({
        guardianId: body.guardianId,
        studentId: body.studentId,
        enrolmentNumber: body.enrolmentNumber,
        grade: body.grade,
        householdMonthlyIncomeCrc: body.householdMonthlyIncomeCrc,
        householdSize: body.householdSize,
        perCapitaIncomeCrc: perCapita,
        appliedAt,
        applicationNumber: `IMAS-${year}-${String(store.nextSequence(year)).padStart(6, '0')}`,
        programme,
        eligible,
        monthlyAmountCrc: eligible ? AMOUNT_BY_PROGRAMME[programme] : 0,
        basis: basisFor(perCapita, eligible),
      });
      res.json(toResponse(application));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
