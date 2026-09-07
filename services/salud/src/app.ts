import {
  addYearsIso,
  createServiceApp,
  errorHandler,
  findActivity,
  issueSanitaryPermitSchema,
  medicalCertificateSchema,
  openVaccinationRecordSchema,
  simulatedLatency,
  todayIso,
  type MedicalCertificateResponse,
  type SanitaryPermitResponse,
  type VaccinationRecordResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type MedicalCertificate, type SanitaryPermit, type VaccinationRecord } from './store.js';

export const SERVICE_NAME = 'salud';

type IssueSanitaryPermitBody = z.infer<typeof issueSanitaryPermitSchema>;
type OpenVaccinationRecordBody = z.infer<typeof openVaccinationRecordSchema>;
type MedicalCertificateBody = z.infer<typeof medicalCertificateSchema>;

export type RiskGroup = SanitaryPermitResponse['riskGroup'];

/** Sanitary risk group per activity (Decreto 39472-S style classification, simplified for the demo). */
export const RISK_GROUP_BY_ACTIVITY: Record<string, RiskGroup> = {
  '5610': 'B',
  '5510': 'B',
  '4711': 'C',
  '9602': 'C',
  '7911': 'C',
  '6201': 'C',
  '4923': 'A',
  '0111': 'A',
};

/** Validity of the permiso sanitario de funcionamiento, in years, per risk group. */
export const VALIDITY_YEARS: Record<RiskGroup, number> = { A: 1, B: 3, C: 5 };

export const VACCINATION_SCHEME = 'Esquema nacional de vacunación (CNVE)';

/** Validity of the dictamen médico for a driving licence, in days. */
export const MEDICAL_CERTIFICATE_DAYS = 180;
export const GLASSES_RESTRICTION = 'Uso de lentes';

export function riskGroupFor(activityCode: string): RiskGroup {
  return RISK_GROUP_BY_ACTIVITY[activityCode] ?? 'C';
}

/** ISO date `months` months after `iso` (UTC arithmetic; JS normalises overflow such as 31 Dec + 2 months). */
export function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** ISO date `days` days after `iso` (UTC arithmetic). */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function certificateToResponse(c: MedicalCertificate): MedicalCertificateResponse {
  const { certificateNumber, result, restrictions, validUntil } = c;
  return { certificateNumber, result, restrictions: [...restrictions], validUntil };
}

function permitToResponse(p: SanitaryPermit): SanitaryPermitResponse {
  const { permitNumber, riskGroup, issueDate, expiryDate } = p;
  return { permitNumber, riskGroup, issueDate, expiryDate };
}

function recordToResponse(r: VaccinationRecord): VaccinationRecordResponse {
  const { recordNumber, scheme, firstAppointment } = r;
  return { recordNumber, scheme, firstAppointment };
}

export function createApp(): Express {
  const apiKey = process.env.SALUD_API_KEY ?? 'demo-salud-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/salud/permits', (_req, res) => {
    res.json(store.listPermits());
  });

  app.get('/salud/vaccination', (_req, res) => {
    res.json(store.listRecords());
  });

  app.post(
    '/salud/issueSanitaryPermit',
    validateBody(issueSanitaryPermitSchema),
    wrap(async (req, res) => {
      const body = req.body as IssueSanitaryPermitBody;
      await simulatedLatency();

      const activity = findActivity(body.activityCode);
      if (!activity) {
        return res.status(422).json({
          error: { code: 'ACTIVITY_UNKNOWN', message: `El código de actividad ${body.activityCode} no está registrado` },
        });
      }

      const existing = store.findPermit(body.taxId);
      if (existing) return res.json(permitToResponse(existing));

      const issueDate = todayIso();
      const year = Number(issueDate.slice(0, 4));
      const riskGroup = riskGroupFor(activity.code);
      const permit = store.savePermit({
        citizenId: body.citizenId,
        taxId: body.taxId,
        businessName: body.businessName,
        activityCode: activity.code,
        address: body.address,
        municipality: body.municipality,
        permitNumber: `PSF-${year}-${String(store.nextPermitSequence(year)).padStart(6, '0')}`,
        riskGroup,
        issueDate,
        expiryDate: addYearsIso(issueDate, VALIDITY_YEARS[riskGroup]),
      });
      res.json(permitToResponse(permit));
    }),
  );

  app.post(
    '/salud/openVaccinationRecord',
    validateBody(openVaccinationRecordSchema),
    wrap(async (req, res) => {
      const body = req.body as OpenVaccinationRecordBody;
      await simulatedLatency();

      const existing = store.findRecord(body.childId);
      if (existing) return res.json(recordToResponse(existing));

      const year = Number(todayIso().slice(0, 4));
      const record = store.saveRecord({
        childId: body.childId,
        childName: body.childName,
        birthDate: body.birthDate,
        edusId: body.edusId,
        recordNumber: `CNV-${year}-${String(store.nextRecordSequence(year)).padStart(6, '0')}`,
        scheme: VACCINATION_SCHEME,
        firstAppointment: addMonthsIso(body.birthDate, 2),
      });
      res.json(recordToResponse(record));
    }),
  );

  // ---------------------------------------------------------------- v3

  app.get('/salud/certificates', (_req, res) => {
    res.json(store.listCertificates());
  });

  app.post(
    '/salud/medicalCertificate',
    validateBody(medicalCertificateSchema),
    wrap(async (req, res) => {
      const body = req.body as MedicalCertificateBody;
      await simulatedLatency();

      const issueDate = todayIso();
      // Idempotent per citizenId while the previous dictamen is still valid (180 days).
      const existing = store.findCertificate(body.citizenId);
      if (existing && existing.validUntil >= issueDate) return res.json(certificateToResponse(existing));

      const year = Number(issueDate.slice(0, 4));
      const restrictions = body.usesGlasses ? [GLASSES_RESTRICTION] : [];
      const certificate = store.saveCertificate({
        citizenId: body.citizenId,
        fullName: body.fullName,
        dateOfBirth: body.dateOfBirth,
        usesGlasses: body.usesGlasses,
        issueDate,
        certificateNumber: `SEDIMEC-${year}-${String(store.nextCertificateSequence(year)).padStart(6, '0')}`,
        result: restrictions.length ? 'apto-con-restricciones' : 'apto',
        restrictions,
        validUntil: addDaysIso(issueDate, MEDICAL_CERTIFICATE_DAYS),
      });
      res.json(certificateToResponse(certificate));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
