import {
  createServiceApp,
  createTaxIdSchema,
  errorHandler,
  findActivity,
  niteFor,
  simulatedLatency,
  todayIso,
  updateAddressSchema,
  type AddressUpdateResponse,
  type TaxResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Taxpayer } from './store.js';

export const SERVICE_NAME = 'tributacion';
export const ADDRESS_REGISTRY = 'Tributación (domicilio fiscal)';

type CreateTaxIdBody = z.infer<typeof createTaxIdSchema>;
type UpdateAddressBody = z.infer<typeof updateAddressSchema>;

function toResponse(t: Taxpayer): TaxResponse {
  const { nite, taxRegime, status, activityCode, activityDescription, registrationDate } = t;
  return { nite, taxRegime, status, activityCode, activityDescription, registrationDate };
}

/** Generates a NITE not yet issued by this instance. */
function freshNite(businessType: 'natural' | 'legal'): string {
  for (let i = 0; i < 20; i++) {
    const nite = niteFor(businessType);
    if (!store.hasNite(nite)) return nite;
  }
  return niteFor(businessType);
}

export function createApp(): Express {
  const apiKey = process.env.TRIBUTACION_API_KEY ?? 'demo-tributacion-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/tributacion/taxpayers', (_req, res) => {
    res.json(store.list());
  });

  app.post(
    '/tributacion/createTaxId',
    validateBody(createTaxIdSchema),
    wrap(async (req, res) => {
      const body = req.body as CreateTaxIdBody;
      await simulatedLatency();

      const activity = findActivity(body.activityCode);
      if (!activity) {
        return res.status(422).json({
          error: { code: 'ACTIVITY_UNKNOWN', message: `El código de actividad ${body.activityCode} no está registrado` },
        });
      }

      const existing = store.find(body.citizenId, body.businessName);
      if (existing) return res.json(toResponse(existing));

      const taxpayer = store.save({
        citizenId: body.citizenId,
        fullName: body.fullName,
        businessName: body.businessName,
        businessType: body.businessType,
        address: body.address,
        nite: freshNite(body.businessType),
        taxRegime: body.businessType === 'natural' ? 'simplified' : 'traditional',
        status: 'active',
        activityCode: activity.code,
        activityDescription: activity.description,
        registrationDate: todayIso(),
      });
      res.json(toResponse(taxpayer));
    }),
  );

  app.get('/tributacion/addresses', (_req, res) => {
    res.json(store.listAddresses());
  });

  app.post(
    '/tributacion/updateAddress',
    validateBody(updateAddressSchema),
    wrap(async (req, res) => {
      const body = req.body as UpdateAddressBody;
      await simulatedLatency();
      store.saveAddress({
        citizenId: body.citizenId,
        address: body.address.trim(),
        province: body.province.trim(),
        canton: body.canton.trim(),
        district: body.district.trim(),
        updated: true,
        registry: ADDRESS_REGISTRY,
        effectiveDate: body.effectiveDate,
      });
      const response: AddressUpdateResponse = { updated: true, registry: ADDRESS_REGISTRY, effectiveDate: body.effectiveDate };
      res.json(response);
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
