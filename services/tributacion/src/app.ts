import {
  createServiceApp,
  createTaxIdSchema,
  errorHandler,
  findActivity,
  niteFor,
  simulatedLatency,
  todayIso,
  transferTaxSchema,
  updateAddressSchema,
  updateCivilStatusSchema,
  type AddressUpdateResponse,
  type CivilStatusUpdateResponse,
  type TaxResponse,
  type TransferTaxResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Taxpayer, type TransferTaxReceipt } from './store.js';

export const SERVICE_NAME = 'tributacion';
export const ADDRESS_REGISTRY = 'Tributación (domicilio fiscal)';
export const CIVIL_STATUS_REGISTRY = 'Tributación (RUT)';

/**
 * Impuesto de traspaso (docs/CONTRACTS.md v4 → Tributación): 2.5 % on vehicles (Ley 7088 art. 13 — rate from a
 * secondary source, see docs/research), 1.5 % on real estate (Ley 6999); timbres 0.5 % of the base.
 */
export const TRANSFER_TAX_RATE_PCT: Record<'vehiculo' | 'inmueble', number> = { vehiculo: 2.5, inmueble: 1.5 };
export const TRANSFER_STAMPS_RATE = 0.005;

type CreateTaxIdBody = z.infer<typeof createTaxIdSchema>;
type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
type TransferTaxBody = z.infer<typeof transferTaxSchema>;
type UpdateCivilStatusBody = z.infer<typeof updateCivilStatusSchema>;

/** Tax figures for a transfer: base = max(price, fiscal value). */
export function transferTax(kind: 'vehiculo' | 'inmueble', priceCrc: number, fiscalValueCrc: number) {
  const taxableBaseCrc = Math.max(priceCrc, fiscalValueCrc);
  const ratePct = TRANSFER_TAX_RATE_PCT[kind];
  const taxCrc = Math.round((taxableBaseCrc * ratePct) / 100);
  const stampsCrc = Math.round(taxableBaseCrc * TRANSFER_STAMPS_RATE);
  return { taxableBaseCrc, ratePct, taxCrc, stampsCrc, totalCrc: taxCrc + stampsCrc };
}

function transferToResponse(t: TransferTaxReceipt): TransferTaxResponse {
  const { receiptNumber, taxableBaseCrc, ratePct, taxCrc, stampsCrc, totalCrc } = t;
  return { receiptNumber, taxableBaseCrc, ratePct, taxCrc, stampsCrc, totalCrc };
}

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

  // ---------------------------------------------------------------- v4

  app.get('/tributacion/transferTaxes', (_req, res) => {
    res.json(store.listTransferTaxes());
  });

  app.get('/tributacion/civilStatuses', (_req, res) => {
    res.json(store.listCivilStatuses());
  });

  app.post(
    '/tributacion/transferTax',
    validateBody(transferTaxSchema),
    wrap(async (req, res) => {
      const body = req.body as TransferTaxBody;
      await simulatedLatency();

      const existing = store.findTransferTax(body.kind, body.reference, body.buyerId);
      if (existing) return res.json(transferToResponse(existing));

      const issuedAt = todayIso();
      const year = Number(issuedAt.slice(0, 4));
      const receipt = store.saveTransferTax({
        buyerId: body.buyerId,
        sellerId: body.sellerId,
        kind: body.kind,
        reference: body.reference.trim(),
        priceCrc: body.priceCrc,
        fiscalValueCrc: body.fiscalValueCrc,
        issuedAt,
        receiptNumber: `HAC-${year}-${String(store.nextTransferSequence(year)).padStart(6, '0')}`,
        ...transferTax(body.kind, body.priceCrc, body.fiscalValueCrc),
      });
      res.json(transferToResponse(receipt));
    }),
  );

  app.post(
    '/tributacion/updateCivilStatus',
    validateBody(updateCivilStatusSchema),
    wrap(async (req, res) => {
      const body = req.body as UpdateCivilStatusBody;
      await simulatedLatency();
      store.saveCivilStatus({
        citizenId: body.citizenId,
        certificate: body.certificate,
        updatedAt: todayIso(),
        updated: true,
        registry: CIVIL_STATUS_REGISTRY,
        maritalStatus: body.maritalStatus,
      });
      const response: CivilStatusUpdateResponse = { updated: true, registry: CIVIL_STATUS_REGISTRY, maritalStatus: body.maritalStatus };
      res.json(response);
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
