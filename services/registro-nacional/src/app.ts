import {
  cedulaSchema,
  createServiceApp,
  errorHandler,
  listEstateSchema,
  registerCompanySchema,
  simulatedLatency,
  todayIso,
  transferPropertySchema,
  transferVehicleSchema,
  type CompanyResponse,
  type EstateResponse,
  type PropertyTransferResponse,
  type VehicleTransferResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import { randomInt } from 'node:crypto';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Company, type PropertyTransfer, type VehicleTransfer } from './store.js';

export const SERVICE_NAME = 'registro-nacional';

type RegisterCompanyBody = z.infer<typeof registerCompanySchema>;
type TransferVehicleBody = z.infer<typeof transferVehicleSchema>;
type TransferPropertyBody = z.infer<typeof transferPropertySchema>;
type ListEstateBody = z.infer<typeof listEstateSchema>;

/** Annotation the registry places on every asset of an open succession. */
export function estateAnnotation(deathCertificate: string): string {
  return `Sucesión abierta — certificado ${deathCertificate}`;
}

function vehicleTransferToResponse(t: VehicleTransfer): VehicleTransferResponse {
  const { plate, newOwnerId, registrationNumber, registeredAt } = t;
  return { plate, newOwnerId, registrationNumber, registeredAt };
}

function propertyTransferToResponse(t: PropertyTransfer): PropertyTransferResponse {
  const { folio, newOwnerId, registrationNumber, registeredAt } = t;
  return { folio, newOwnerId, registrationNumber, registeredAt };
}

function sellerMismatch(reference: string, sellerId: string) {
  return {
    error: { code: 'SELLER_MISMATCH', message: `${sellerId} no figura como titular registral de ${reference}` },
  };
}

function encumbered(reference: string, encumbrances: string[]) {
  return {
    error: {
      code: 'ENCUMBERED',
      message: `${reference} tiene gravámenes inscritos (${encumbrances.join(', ')}); deben levantarse antes del traspaso`,
    },
  };
}

function vehicleNotFound(plate: string) {
  return { error: { code: 'VEHICLE_NOT_FOUND', message: `No existe un vehículo con la placa ${plate}` } };
}

function propertyNotFound(folio: string) {
  return { error: { code: 'PROPERTY_NOT_FOUND', message: `No existe una finca con el folio real ${folio}` } };
}

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
      if (!property) return res.status(404).json(propertyNotFound(folio));
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

  // ---------------------------------------------------------------- v4: vehicles, transfers, estates

  app.get(
    '/registro-nacional/vehicles',
    wrap(async (req, res) => {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId : '';
      if (!cedulaSchema.safeParse(ownerId).success) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'ownerId es obligatorio y debe tener el formato 0-0000-0000' },
        });
      }
      await simulatedLatency();
      res.json(store.vehiclesOf(ownerId));
    }),
  );

  app.get(
    '/registro-nacional/vehicle/:plate',
    wrap(async (req, res) => {
      const plate = String(req.params.plate);
      await simulatedLatency();
      const vehicle = store.getVehicle(plate);
      if (!vehicle) return res.status(404).json(vehicleNotFound(plate));
      res.json(vehicle);
    }),
  );

  app.get('/registro-nacional/vehicleTransfers', (_req, res) => {
    res.json(store.listVehicleTransfers());
  });

  app.get('/registro-nacional/propertyTransfers', (_req, res) => {
    res.json(store.listPropertyTransfers());
  });

  app.post(
    '/registro-nacional/transferVehicle',
    validateBody(transferVehicleSchema),
    wrap(async (req, res) => {
      const body = req.body as TransferVehicleBody;
      await simulatedLatency();

      const existing = store.findVehicleTransfer(body.plate, body.taxReceipt);
      if (existing) return res.json(vehicleTransferToResponse(existing));

      const vehicle = store.getVehicle(body.plate);
      if (!vehicle) return res.status(404).json(vehicleNotFound(body.plate));
      if (vehicle.ownerId !== body.sellerId) return res.status(409).json(sellerMismatch(vehicle.plate, body.sellerId));
      if (vehicle.encumbrances.length > 0) return res.status(422).json(encumbered(vehicle.plate, vehicle.encumbrances));

      const registeredAt = todayIso();
      const year = Number(registeredAt.slice(0, 4));
      store.putVehicle({ ...vehicle, ownerId: body.buyerId });
      const transfer = store.saveVehicleTransfer({
        plate: vehicle.plate,
        sellerId: body.sellerId,
        newOwnerId: body.buyerId,
        taxReceipt: body.taxReceipt,
        priceCrc: body.priceCrc,
        registrationNumber: `BM-${year}-${String(store.nextVehicleTransferSequence(year)).padStart(6, '0')}`,
        registeredAt,
      });
      res.json(vehicleTransferToResponse(transfer));
    }),
  );

  app.post(
    '/registro-nacional/transferProperty',
    validateBody(transferPropertySchema),
    wrap(async (req, res) => {
      const body = req.body as TransferPropertyBody;
      await simulatedLatency();

      const existing = store.findPropertyTransfer(body.folio, body.taxReceipt);
      if (existing) return res.json(propertyTransferToResponse(existing));

      const property = store.getProperty(body.folio);
      if (!property) return res.status(404).json(propertyNotFound(body.folio));
      if (property.ownerId !== body.sellerId) return res.status(409).json(sellerMismatch(property.folio, body.sellerId));
      if (property.encumbrances.length > 0) return res.status(422).json(encumbered(property.folio, property.encumbrances));

      const registeredAt = todayIso();
      const year = Number(registeredAt.slice(0, 4));
      store.putProperty({ ...property, ownerId: body.buyerId });
      const transfer = store.savePropertyTransfer({
        folio: property.folio,
        sellerId: body.sellerId,
        newOwnerId: body.buyerId,
        taxReceipt: body.taxReceipt,
        priceCrc: body.priceCrc,
        registrationNumber: `BI-${year}-${String(store.nextPropertyTransferSequence(year)).padStart(6, '0')}`,
        registeredAt,
      });
      res.json(propertyTransferToResponse(transfer));
    }),
  );

  app.post(
    '/registro-nacional/listEstate',
    validateBody(listEstateSchema),
    wrap(async (req, res) => {
      const body = req.body as ListEstateBody;
      await simulatedLatency();
      const estate: EstateResponse = {
        properties: store.propertiesOf(body.deceasedId).map(({ folio, canton, areaM2 }) => ({ folio, canton, areaM2 })),
        vehicles: store.vehiclesOf(body.deceasedId).map(({ plate, make, model, year }) => ({ plate, make, model, year })),
        companies: store.companiesOf(body.deceasedId).map(({ cedulaJuridica, legalName }) => ({ cedulaJuridica, legalName })),
        annotation: estateAnnotation(body.deathCertificate),
      };
      res.json(estate);
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
