import {
  addYearsIso,
  createServiceApp,
  declarePropertySchema,
  errorHandler,
  findActivity,
  issueBuildingPermitSchema,
  issueLandUseSchema,
  issueLicenseSchema,
  patenteNumber,
  simulatedLatency,
  todayIso,
  updateAddressSchema,
  type AddressUpdateResponse,
  type BuildingPermitResponse,
  type LandUseResponse,
  type MunicipalityResponse,
  type PropertyDeclarationResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import {
  CANTONS,
  findCanton,
  store,
  type BuildingPermit,
  type LandUseCertificate,
  type License,
  type ProjectType,
  type PropertyDeclaration,
} from './store.js';

export const SERVICE_NAME = 'municipalidad';
export const ADDRESS_REGISTRY = 'Municipalidad (contribuyente)';

/** Impuesto de construcciones: 1 % of the declared value (Ley 833 / Código Municipal). */
export const BUILDING_TAX_RATE = 0.01;

type IssueLicenseBody = z.infer<typeof issueLicenseSchema>;
type IssueLandUseBody = z.infer<typeof issueLandUseSchema>;
type IssueBuildingPermitBody = z.infer<typeof issueBuildingPermitSchema>;
type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
type DeclarePropertyBody = z.infer<typeof declarePropertySchema>;

/** Impuesto sobre bienes inmuebles: 0.25 % of the declared value per year (Ley 7509 art. 23). */
export const PROPERTY_TAX_RATE = 0.0025;
/** A declaración de bienes inmuebles is valid for five years (Ley 7509 art. 16). */
export const DECLARATION_VALIDITY_YEARS = 5;

export function propertyTax(declaredValueCrc: number): number {
  return Math.round(declaredValueCrc * PROPERTY_TAX_RATE);
}

function declarationToResponse(d: PropertyDeclaration): PropertyDeclarationResponse {
  const { municipality, declarationNumber, declaredValueCrc, annualTaxCrc, validUntil } = d;
  return { municipality, declarationNumber, declaredValueCrc, annualTaxCrc, validUntil };
}

const normalizeUse = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const LAND_USE_LABELS: Record<string, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  mixto: 'Mixto',
  agricola: 'Agrícola',
};

const PROJECT_LABELS: Record<ProjectType, string> = {
  vivienda: 'vivienda unifamiliar',
  comercial: 'local comercial',
  ampliacion: 'ampliación de obra existente',
};

/** "Residencial: vivienda unifamiliar" — the use the certificate allows for the project. */
export function allowedUseFor(landUse: string, projectType: ProjectType): string {
  const key = normalizeUse(landUse);
  const label = LAND_USE_LABELS[key] ?? landUse.trim().charAt(0).toUpperCase() + landUse.trim().slice(1);
  return `${label}: ${PROJECT_LABELS[projectType]}`;
}

/** Agricultural land cannot host a commercial project (plan regulador, simplified for the demo). */
export function isIncompatible(landUse: string, projectType: ProjectType): boolean {
  return normalizeUse(landUse) === 'agricola' && projectType === 'comercial';
}

export function buildingTax(declaredValueCrc: number): number {
  return Math.round(declaredValueCrc * BUILDING_TAX_RATE);
}

function landUseToResponse(c: LandUseCertificate): LandUseResponse {
  const { certificateNumber, municipality, allowedUse, issueDate } = c;
  return { certificateNumber, municipality, allowedUse, issueDate };
}

function permitToResponse(p: BuildingPermit): BuildingPermitResponse {
  const { permitNumber, municipality, taxCrc, issueDate, expiryDate } = p;
  return { permitNumber, municipality, taxCrc, issueDate, expiryDate };
}

function municipalityUnknown(name: string) {
  return { error: { code: 'MUNICIPALITY_UNKNOWN', message: `La municipalidad de ${name} no está integrada al bus` } };
}

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
      if (!canton) return res.status(422).json(municipalityUnknown(body.municipality));
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

  app.get('/municipalidad/landUses', (_req, res) => {
    res.json(store.listLandUses());
  });

  app.get('/municipalidad/buildingPermits', (_req, res) => {
    res.json(store.listPermits());
  });

  app.get('/municipalidad/addresses', (_req, res) => {
    res.json(store.listAddresses());
  });

  app.post(
    '/municipalidad/issueLandUse',
    validateBody(issueLandUseSchema),
    wrap(async (req, res) => {
      const body = req.body as IssueLandUseBody;
      await simulatedLatency();

      const canton = findCanton(body.municipality);
      if (!canton) return res.status(422).json(municipalityUnknown(body.municipality));
      if (isIncompatible(body.landUse, body.projectType)) {
        return res.status(422).json({
          error: {
            code: 'LAND_USE_INCOMPATIBLE',
            message: `El uso de suelo ${body.landUse} no permite un proyecto ${body.projectType} en ${canton.name}`,
          },
        });
      }

      const existing = store.findLandUse(body.folio, body.projectType);
      if (existing) return res.json(landUseToResponse(existing));

      const issueDate = todayIso();
      const year = Number(issueDate.slice(0, 4));
      const certificate = store.saveLandUse({
        citizenId: body.citizenId,
        folio: body.folio,
        projectType: body.projectType,
        landUse: body.landUse,
        certificateNumber: `US-${year}-${String(store.nextLandUseSequence(year)).padStart(5, '0')}`,
        municipality: canton.name,
        allowedUse: allowedUseFor(body.landUse, body.projectType),
        issueDate,
      });
      res.json(landUseToResponse(certificate));
    }),
  );

  app.post(
    '/municipalidad/issueBuildingPermit',
    validateBody(issueBuildingPermitSchema),
    wrap(async (req, res) => {
      const body = req.body as IssueBuildingPermitBody;
      await simulatedLatency();

      const canton = findCanton(body.municipality);
      if (!canton) return res.status(422).json(municipalityUnknown(body.municipality));

      const existing = store.findPermit(body.apcNumber);
      if (existing) return res.json(permitToResponse(existing));

      const issueDate = todayIso();
      const year = Number(issueDate.slice(0, 4));
      const permit = store.savePermit({
        citizenId: body.citizenId,
        folio: body.folio,
        apcNumber: body.apcNumber,
        landUseCertificate: body.landUseCertificate,
        declaredValueCrc: body.declaredValueCrc,
        areaM2: body.areaM2,
        permitNumber: `PC-${year}-${String(store.nextPermitSequence(year)).padStart(5, '0')}`,
        municipality: canton.name,
        taxCrc: buildingTax(body.declaredValueCrc),
        issueDate,
        expiryDate: addYearsIso(issueDate, 1),
      });
      res.json(permitToResponse(permit));
    }),
  );

  app.post(
    '/municipalidad/updateAddress',
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

  app.get('/municipalidad/declarations', (_req, res) => {
    res.json(store.listDeclarations());
  });

  app.post(
    '/municipalidad/declareProperty',
    validateBody(declarePropertySchema),
    wrap(async (req, res) => {
      const body = req.body as DeclarePropertyBody;
      await simulatedLatency();

      const canton = findCanton(body.municipality);
      if (!canton) return res.status(422).json(municipalityUnknown(body.municipality));

      const existing = store.findDeclaration(body.folio, body.citizenId);
      if (existing) return res.json(declarationToResponse(existing));

      const declaredAt = todayIso();
      const year = Number(declaredAt.slice(0, 4));
      const declaration = store.saveDeclaration({
        citizenId: body.citizenId,
        folio: body.folio.trim(),
        registrationNumber: body.registrationNumber,
        declaredAt,
        municipality: canton.name,
        declarationNumber: `DBI-${year}-${String(store.nextDeclarationSequence(year)).padStart(5, '0')}`,
        declaredValueCrc: body.declaredValueCrc,
        annualTaxCrc: propertyTax(body.declaredValueCrc),
        validUntil: addYearsIso(declaredAt, DECLARATION_VALIDITY_YEARS),
      });
      res.json(declarationToResponse(declaration));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
