import {
  createServiceApp,
  enrolStudentSchema,
  errorHandler,
  simulatedLatency,
  todayIso,
  type SchoolEnrolmentResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { findSchool, SCHOOLS, store, type Enrolment, type Grade } from './store.js';

export const SERVICE_NAME = 'mep';

/** Minimum age, in full years, on 15 February of the school year (Reglamento de Matrícula, simplified). */
export const MIN_AGE_BY_GRADE: Record<Grade, number> = { materno: 4, transicion: 5, primero: 6, septimo: 12 };

export const GRADE_LABELS: Record<Grade, string> = {
  materno: 'Materno infantil',
  transicion: 'Transición',
  primero: 'Primer grado',
  septimo: 'Sétimo año',
};

/** Every enrolment includes the school canteen; transport is added on request. */
export const CANTEEN_SERVICE = 'Comedor (PANEA)';
export const TRANSPORT_SERVICE = 'Transporte estudiantil';

type EnrolStudentBody = z.infer<typeof enrolStudentSchema>;

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

/** The next 1 February on or after `iso` (school year start, "curso lectivo"). */
export function nextSchoolYearStart(iso: string): string {
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const thisYear = `${year}-02-01`;
  return iso <= thisYear ? thisYear : `${year + 1}-02-01`;
}

/** Age cut-off date for a school year starting on `startDate`: 15 February of that year. */
export function ageCutoffFor(startDate: string): string {
  return `${startDate.slice(0, 4)}-02-15`;
}

export function meetsAgeRule(grade: Grade, birthDate: string, startDate: string): boolean {
  return ageAt(birthDate, ageCutoffFor(startDate)) >= MIN_AGE_BY_GRADE[grade];
}

export function servicesFor(needsTransport: boolean): string[] {
  return needsTransport ? [CANTEEN_SERVICE, TRANSPORT_SERVICE] : [CANTEEN_SERVICE];
}

function toResponse(e: Enrolment): SchoolEnrolmentResponse {
  const { enrolmentNumber, school, grade, circuit, startDate, services } = e;
  return { enrolmentNumber, school, grade, circuit, startDate, services };
}

export function createApp(): Express {
  const apiKey = process.env.MEP_API_KEY ?? 'demo-mep-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/mep/schools', (_req, res) => {
    res.json(SCHOOLS);
  });

  app.get('/mep/enrolments', (_req, res) => {
    res.json(store.listEnrolments());
  });

  app.post(
    '/mep/enrolStudent',
    validateBody(enrolStudentSchema),
    wrap(async (req, res) => {
      const body = req.body as EnrolStudentBody;
      await simulatedLatency();

      const existing = store.findEnrolment(body.studentId);
      if (existing) return res.json(toResponse(existing));

      const school = findSchool(body.school);
      if (!school) {
        return res.status(422).json({
          error: { code: 'SCHOOL_UNKNOWN', message: `El centro educativo "${body.school}" no está en el padrón del MEP` },
        });
      }

      const enrolledAt = todayIso();
      const startDate = nextSchoolYearStart(enrolledAt);
      if (!meetsAgeRule(body.grade, body.birthDate, startDate)) {
        return res.status(422).json({
          error: {
            code: 'AGE_RULE',
            message: `Para ${GRADE_LABELS[body.grade]} se requieren ${MIN_AGE_BY_GRADE[body.grade]} años cumplidos al ${ageCutoffFor(startDate)}`,
          },
        });
      }

      const year = Number(enrolledAt.slice(0, 4));
      const enrolment = store.saveEnrolment({
        guardianId: body.guardianId,
        studentId: body.studentId,
        studentName: body.studentName,
        birthDate: body.birthDate,
        vaccinationRecord: body.vaccinationRecord,
        canton: body.canton,
        needsTransport: body.needsTransport,
        enrolledAt,
        enrolmentNumber: `MEP-${year}-${String(store.nextSequence(year)).padStart(6, '0')}`,
        school: school.name,
        grade: body.grade,
        circuit: school.circuit,
        startDate,
        services: servicesFor(body.needsTransport),
      });
      res.json(toResponse(enrolment));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
