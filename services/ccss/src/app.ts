import {
  applyPensionSchema,
  createServiceApp,
  employerNumber,
  enrollVoluntarySchema,
  errorHandler,
  insureDependentSchema,
  registerEmployerSchema,
  simulatedLatency,
  survivorPensionSchema,
  todayIso,
  updateAddressSchema,
  type AddressUpdateResponse,
  type CcssResponse,
  type DependentInsuranceResponse,
  type PensionApplicationResponse,
  type SurvivorPensionResponse,
  type VoluntaryInsuranceResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import { randomInt } from 'node:crypto';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type Dependent, type Employer, type PensionApplication, type SurvivorPension, type VoluntaryInsurance } from './store.js';

export const SERVICE_NAME = 'ccss';
export const ADDRESS_REGISTRY = 'CCSS (SICERE)';

type RegisterEmployerBody = z.infer<typeof registerEmployerSchema>;
type InsureDependentBody = z.infer<typeof insureDependentSchema>;
type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
type ApplyPensionBody = z.infer<typeof applyPensionSchema>;
type EnrollVoluntaryBody = z.infer<typeof enrollVoluntarySchema>;
type SurvivorPensionBody = z.infer<typeof survivorPensionSchema>;

/** Demo figures: contribution = 26.67 % of a reference monthly salary (CRC), per person covered. */
export const CONTRIBUTION_RATE = 0.2667;
export const REFERENCE_SALARY_CRC = 460000; // roughly the 2026 minimum wage for unskilled workers

export function monthlyContribution(estimatedEmployees: number): number {
  const persons = Math.max(1, estimatedEmployees); // the owner counts when self-employed
  return Math.round(REFERENCE_SALARY_CRC * CONTRIBUTION_RATE * persons);
}

// ---------------------------------------------------------------- v3: IVM pension and aseguramiento voluntario

/** Demo simplification of the IVM rules (docs/CONTRACTS.md v3 → CCSS new actions). */
export const IVM_MIN_CONTRIBUTIONS = 300;
export const IVM_MIN_AGE = 65;
export const IVM_EARLY_MIN_AGE = 62;
export const IVM_EARLY_MIN_CONTRIBUTIONS = 360;
/** Pension = 60 % of the last salary, rounded to hundreds. */
export const IVM_REPLACEMENT_RATE = 0.6;
/** Aseguramiento voluntario: 12.33 % of the declared income, never below ₡25 000. */
export const VOLUNTARY_RATE = 0.1233;
export const VOLUNTARY_MIN_PREMIUM_CRC = 25000;

/** Full years between an ISO birth date and an ISO reference date. */
export function ageAt(dateOfBirth: string, onDate: string): number {
  const dob = new Date(dateOfBirth);
  const on = new Date(onDate);
  let age = on.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < dob.getUTCMonth() || (on.getUTCMonth() === dob.getUTCMonth() && on.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

export function pensionStatus(
  contributions: number,
  age: number,
  modality: ApplyPensionBody['modality'],
): PensionApplicationResponse['status'] {
  if (contributions >= IVM_MIN_CONTRIBUTIONS && age >= IVM_MIN_AGE) return 'aprobada';
  if (modality === 'anticipada' && contributions >= IVM_EARLY_MIN_CONTRIBUTIONS && age >= IVM_EARLY_MIN_AGE) return 'aprobada';
  return 'en-estudio';
}

export function monthlyPension(lastSalaryCrc: number): number {
  return Math.round((lastSalaryCrc * IVM_REPLACEMENT_RATE) / 100) * 100;
}

export function voluntaryPremium(declaredIncomeCrc: number): number {
  return Math.max(VOLUNTARY_MIN_PREMIUM_CRC, Math.round(declaredIncomeCrc * VOLUNTARY_RATE));
}

/** First day of the month after `iso`. */
export function firstDayOfNextMonthIso(iso: string): string {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- v4: pensión por viudez / orfandad

/** Share of the deceased's IVM pension estimate per survivor (docs/CONTRACTS.md v4 → CCSS). */
export const SURVIVOR_SHARE: Record<SurvivorPensionBody['relationship'], number> = { conyuge: 0.7, hijo: 0.3 };
/** Contributions the deceased needed for the survivor pension to be approved outright. */
export const SURVIVOR_MIN_CONTRIBUTIONS = 180;

export const SURVIVOR_BENEFICIARY: Record<SurvivorPensionBody['relationship'], SurvivorPensionResponse['beneficiary']> = {
  conyuge: 'viudez',
  hijo: 'orfandad',
};

export function survivorPension(lastSalaryCrc: number, relationship: SurvivorPensionBody['relationship']): number {
  return Math.round(monthlyPension(lastSalaryCrc) * SURVIVOR_SHARE[relationship]);
}

export function survivorStatus(contributions: number): SurvivorPensionResponse['status'] {
  return contributions >= SURVIVOR_MIN_CONTRIBUTIONS ? 'aprobada' : 'en-estudio';
}

function survivorToResponse(p: SurvivorPension): SurvivorPensionResponse {
  const { applicationNumber, beneficiary, monthlyPensionCrc, firstPaymentDate, status } = p;
  return { applicationNumber, beneficiary, monthlyPensionCrc, firstPaymentDate, status };
}

function pensionToResponse(p: PensionApplication): PensionApplicationResponse {
  const { applicationNumber, regime, contributions, monthlyPensionCrc, firstPaymentDate, status } = p;
  return { applicationNumber, regime, contributions, monthlyPensionCrc, firstPaymentDate, status };
}

function voluntaryToResponse(v: VoluntaryInsurance): VoluntaryInsuranceResponse {
  const { policyNumber, monthlyPremiumCrc, coveredFrom } = v;
  return { policyNumber, monthlyPremiumCrc, coveredFrom };
}

function employmentNotFound(citizenId: string) {
  return {
    error: { code: 'EMPLOYMENT_NOT_FOUND', message: `No hay registro laboral en SICERE para la persona ${citizenId}` },
  };
}

function toResponse(e: Employer): CcssResponse {
  const { employerNumber: n, registrationType, registrationDate, monthlyContributionRateCrc } = e;
  return { employerNumber: n, registrationType, registrationDate, monthlyContributionRateCrc };
}

function dependentToResponse(d: Dependent): DependentInsuranceResponse {
  const { beneficiaryNumber, coveredFrom, edusId } = d;
  return { beneficiaryNumber, coveredFrom, edusId };
}

/** "B-NNNNNNN" beneficiary number not yet issued by this instance. */
function freshBeneficiaryNumber(): string {
  let n = '';
  for (let i = 0; i < 20; i++) {
    n = 'B-' + String(randomInt(1000000, 9999999));
    if (!store.hasBeneficiaryNumber(n)) return n;
  }
  return n;
}

/** EDUS (Expediente Digital Único en Salud) identifier, "EDUS-NNNNNNN". */
function edusIdFor(): string {
  return 'EDUS-' + String(randomInt(1000000, 9999999));
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

  app.get('/ccss/dependents', (_req, res) => {
    res.json(store.listDependents());
  });

  app.get('/ccss/addresses', (_req, res) => {
    res.json(store.listAddresses());
  });

  app.post(
    '/ccss/insureDependent',
    validateBody(insureDependentSchema),
    wrap(async (req, res) => {
      const body = req.body as InsureDependentBody;
      await simulatedLatency();

      const existing = store.findDependent(body.dependentId);
      if (existing) return res.json(dependentToResponse(existing));

      const dependent = store.saveDependent({
        insuredId: body.insuredId,
        dependentId: body.dependentId,
        dependentName: body.dependentName,
        relationship: body.relationship,
        birthDate: body.birthDate,
        beneficiaryNumber: freshBeneficiaryNumber(),
        coveredFrom: body.birthDate,
        edusId: edusIdFor(),
      });
      res.json(dependentToResponse(dependent));
    }),
  );

  app.post(
    '/ccss/updateAddress',
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

  // ---------------------------------------------------------------- v3

  app.get('/ccss/employment', (_req, res) => {
    res.json(store.listEmployment());
  });

  app.get(
    '/ccss/employment/:citizenId',
    wrap(async (req, res) => {
      await simulatedLatency();
      const record = store.findEmployment(req.params.citizenId);
      if (!record) return res.status(404).json(employmentNotFound(req.params.citizenId));
      res.json(record);
    }),
  );

  app.get('/ccss/pensions', (_req, res) => {
    res.json(store.listPensions());
  });

  app.get('/ccss/voluntary', (_req, res) => {
    res.json(store.listVoluntary());
  });

  app.post(
    '/ccss/applyPension',
    validateBody(applyPensionSchema),
    wrap(async (req, res) => {
      const body = req.body as ApplyPensionBody;
      await simulatedLatency();

      const existing = store.findPension(body.citizenId);
      if (existing) return res.json(pensionToResponse(existing));

      const record = store.findEmployment(body.citizenId);
      if (!record) return res.status(404).json(employmentNotFound(body.citizenId));

      const today = todayIso();
      const year = Number(today.slice(0, 4));
      const application = store.savePension({
        citizenId: body.citizenId,
        fullName: body.fullName,
        dateOfBirth: body.dateOfBirth,
        modality: body.modality,
        iban: body.iban,
        applicationDate: today,
        applicationNumber: `IVM-${year}-${String(store.nextPensionSequence(year)).padStart(6, '0')}`,
        regime: 'IVM',
        contributions: record.contributions,
        monthlyPensionCrc: monthlyPension(record.lastSalaryCrc),
        firstPaymentDate: firstDayOfNextMonthIso(today),
        status: pensionStatus(record.contributions, ageAt(body.dateOfBirth, today), body.modality),
      });
      res.json(pensionToResponse(application));
    }),
  );

  app.post(
    '/ccss/enrollVoluntary',
    validateBody(enrollVoluntarySchema),
    wrap(async (req, res) => {
      const body = req.body as EnrollVoluntaryBody;
      await simulatedLatency();

      const existing = store.findVoluntary(body.citizenId);
      if (existing) return res.json(voluntaryToResponse(existing));

      const today = todayIso();
      const year = Number(today.slice(0, 4));
      const policy = store.saveVoluntary({
        citizenId: body.citizenId,
        fullName: body.fullName,
        declaredIncomeCrc: body.declaredIncomeCrc,
        policyNumber: `AV-${year}-${String(store.nextVoluntarySequence(year)).padStart(6, '0')}`,
        monthlyPremiumCrc: voluntaryPremium(body.declaredIncomeCrc),
        coveredFrom: today,
      });
      res.json(voluntaryToResponse(policy));
    }),
  );

  // ---------------------------------------------------------------- v4

  app.get('/ccss/survivorPensions', (_req, res) => {
    res.json(store.listSurvivorPensions());
  });

  app.post(
    '/ccss/survivorPension',
    validateBody(survivorPensionSchema),
    wrap(async (req, res) => {
      const body = req.body as SurvivorPensionBody;
      await simulatedLatency();

      const existing = store.findSurvivorPension(body.survivorId, body.deceasedId);
      if (existing) return res.json(survivorToResponse(existing));

      const record = store.findEmployment(body.deceasedId);
      if (!record) return res.status(404).json(employmentNotFound(body.deceasedId));

      const today = todayIso();
      const year = Number(today.slice(0, 4));
      const pension = store.saveSurvivorPension({
        survivorId: body.survivorId,
        deceasedId: body.deceasedId,
        relationship: body.relationship,
        deathCertificate: body.deathCertificate,
        iban: body.iban,
        applicationDate: today,
        applicationNumber: `IVM-SV-${year}-${String(store.nextSurvivorSequence(year)).padStart(6, '0')}`,
        beneficiary: SURVIVOR_BENEFICIARY[body.relationship],
        monthlyPensionCrc: survivorPension(record.lastSalaryCrc, body.relationship),
        firstPaymentDate: firstDayOfNextMonthIso(today),
        status: survivorStatus(record.contributions),
      });
      res.json(survivorToResponse(pension));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
