import {
  createServiceApp,
  errorHandler,
  reviewPlansSchema,
  simulatedLatency,
  todayIso,
  type PlanReviewResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { findProfessional, PROFESSIONALS, store, type PlanReview } from './store.js';

export const SERVICE_NAME = 'cfia';

type ReviewPlansBody = z.infer<typeof reviewPlansSchema>;

/** CFIA fee for plan review: 0.265 % of the declared value of the work. */
export const CFIA_FEE_RATE = 0.00265;

/** Institutions that review plans through the APC platform, with their reference prefix. */
export const REVIEWING_INSTITUTIONS: Array<{ institution: string; prefix: string }> = [
  { institution: 'Ministerio de Salud', prefix: 'MS' },
  { institution: 'Bomberos', prefix: 'BOM' },
  { institution: 'AyA', prefix: 'AYA' },
  { institution: 'INVU', prefix: 'INVU' },
];

export function cfiaFee(declaredValueCrc: number): number {
  return Math.round(declaredValueCrc * CFIA_FEE_RATE);
}

function toResponse(r: PlanReview): PlanReviewResponse {
  const { apcNumber, professionalLicence, reviews, approvedAreaM2, cfiaFeeCrc } = r;
  return { apcNumber, professionalLicence, reviews, approvedAreaM2, cfiaFeeCrc };
}

export function createApp(): Express {
  const apiKey = process.env.CFIA_API_KEY ?? 'demo-cfia-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/cfia/reviews', (_req, res) => {
    res.json(store.list());
  });

  app.get('/cfia/professionals', (_req, res) => {
    res.json(PROFESSIONALS);
  });

  app.post(
    '/cfia/reviewPlans',
    validateBody(reviewPlansSchema),
    wrap(async (req, res) => {
      const body = req.body as ReviewPlansBody;
      await simulatedLatency();

      const professional = findProfessional(body.professionalLicence);
      if (!professional) {
        return res.status(422).json({
          error: {
            code: 'PROFESSIONAL_UNKNOWN',
            message: `El carné profesional ${body.professionalLicence} no está inscrito en el CFIA`,
          },
        });
      }

      const existing = store.find(body.folio, professional.licence);
      if (existing) return res.json(toResponse(existing));

      const submittedAt = todayIso();
      const year = Number(submittedAt.slice(0, 4));
      const seq = String(store.nextSequence(year)).padStart(6, '0');
      const review = store.save({
        citizenId: body.citizenId,
        folio: body.folio,
        projectType: body.projectType,
        areaM2: body.areaM2,
        declaredValueCrc: body.declaredValueCrc,
        landUseCertificate: body.landUseCertificate,
        submittedAt,
        apcNumber: `APC-${year}-${seq}`,
        professionalLicence: professional.licence,
        reviews: REVIEWING_INSTITUTIONS.map(({ institution, prefix }) => ({
          institution,
          result: 'aprobado' as const,
          reference: `${prefix}-${year}-${seq}`,
        })),
        approvedAreaM2: body.areaM2,
        cfiaFeeCrc: cfiaFee(body.declaredValueCrc),
      });
      res.json(toResponse(review));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
