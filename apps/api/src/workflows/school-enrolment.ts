import type { Citizen, ScholarshipResponse, SchoolEnrolmentResponse, VaccinationRecordResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  studentId: z.string().trim().min(1, 'Seleccione al estudiante'),
  school: z.string().trim().min(1, 'Seleccione el centro educativo'),
  grade: z.enum(['materno', 'transicion', 'primero', 'septimo']),
  needsTransport: z.enum(['si', 'no']),
  householdMonthlyIncomeCrc: z.coerce.number().int().min(0).max(50_000_000),
  householdSize: z.coerce.number().int().min(1).max(20),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const student = (ctx: StepContext) => ctx.results.estudiante as Citizen;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const schoolEnrolment: WorkflowSpec = {
  id: 'school-enrolment',
  title: 'Mi hijo entra a la escuela',
  titleEn: 'My child starts school',
  description:
    'Matricule a su hijo o hija con los datos que el TSE y la CCSS ya tienen (nacimiento, vacunas, domicilio) y, en el mismo paso, la beca del IMAS, el comedor y el transporte, sin fila en la escuela.',
  descriptionEn: 'Enrol your child with the data the TSE and the CCSS already hold (birth, vaccines, address) and, in the same step, the IMAS scholarship, the school meals and transport, with no queue at the school.',
  available: true,
  agencies: ['registro', 'salud', 'mep', 'imas'],
  legal: {
    status: 'parcial',
    today:
      'La prematrícula se hace en persona en cada centro educativo (para 2026: del 4 al 8 de agosto de 2025) con constancia de nacimiento, carné de vacunas y comprobante de domicilio; no se encontró una plataforma nacional de matrícula en línea. La beca Crecemos/Avancemos del IMAS, el comedor y el transporte se piden aparte, aunque el SINIRUBE (Ley 9137) ya reúne los datos del hogar. En Gosuslugi, LifeSG y Estonia la inscripción escolar es uno de los eventos de vida centrales.',
    todayEn:
      'Pre-enrolment is done in person at each school (for 2026: 4–8 August 2025) with the birth certificate, vaccination card and proof of address; no national online enrolment platform was found. The IMAS Crecemos/Avancemos scholarship, meals and transport are requested separately, although SINIRUBE (Ley 9137) already gathers the household data. In Gosuslugi, LifeSG and Estonia school enrolment is one of the central life events.',
    gap: 'Un decreto para que el MEP tome nacimiento y vacunas del TSE y la CCSS por el bus y ofrezca la matrícula en línea, y un reglamento del IMAS para que la matrícula dispare la evaluación de beca en el SINIRUBE de oficio.',
    gapEn: 'A decree so the MEP takes birth and vaccination data from the TSE and the CCSS through the bus and offers online enrolment, and an IMAS regulation so the enrolment triggers the SINIRUBE scholarship assessment ex officio.',
    basis: ['cr-3481', 'cr-9137', 'cr-8220', 'cr-5395'],
    model: ['ru-210fz', 'sg-myinfo', 'ee-sundmusteenused', 'fi-suomi'],
  },
  fields: [
    { name: 'studentId', label: 'Estudiante', labelEn: 'Student', type: 'select', required: true, optionsFrom: 'children', help: 'Sus hijos menores se cargan del Registro Civil.', helpEn: 'Your minor children are loaded from the Civil Registry.' },
    { name: 'school', label: 'Centro educativo', labelEn: 'School', type: 'select', required: true, optionsFrom: 'schools' },
    { name: 'grade', label: 'Nivel', labelEn: 'Grade', type: 'select', required: true, optionsFrom: 'grades' },
    { name: 'needsTransport', label: '¿Necesita transporte estudiantil?', labelEn: 'Needs student transport?', type: 'radio', required: true, options: [ { value: 'no', label: 'No' }, { value: 'si', label: 'Sí' } ] },
    { name: 'householdMonthlyIncomeCrc', label: 'Ingreso mensual del hogar (₡)', labelEn: 'Household monthly income (CRC)', type: 'number', required: true, min: 0, help: 'Solo para evaluar la beca; en la vida real vendría del SINIRUBE.', helpEn: 'Only to assess the scholarship; in real life it would come from SINIRUBE.' },
    { name: 'householdSize', label: 'Personas en el hogar', labelEn: 'People in the household', type: 'number', required: true, min: 1, max: 20 },
  ],
  steps: [
    {
      id: 'estudiante',
      agency: 'registro',
      action: 'getCitizen',
      label: 'Verificar el nacimiento del estudiante en el Registro Civil',
      labelEn: 'Verify the student\'s birth at the Civil Registry',
      purpose: 'Verificar identidad y nacimiento del menor',
      data: (ctx) => ({ id: input(ctx).studentId }),
      legal: { status: 'parcial', today: 'El TSE tiene el nacimiento desde el hospital; el MEP igual pide la constancia impresa a los padres.', todayEn: 'The TSE has the birth from the hospital; the MEP still asks parents for the printed certificate.', gap: 'Que el MEP consulte al TSE por el bus (decreto; Ley 8220 art. 8).', gapEn: 'Let the MEP query the TSE through the bus (decree; Ley 8220 art. 8).', basis: ['cr-3504', 'cr-8220'], model: ['ru-210fz'] },
    },
    {
      id: 'vacunas',
      agency: 'salud',
      action: 'openVaccinationRecord',
      label: 'Verificar el esquema de vacunación',
      labelEn: 'Verify the vaccination scheme',
      purpose: 'Verificar carné de vacunación del menor',
      data: (ctx) => ({ childId: input(ctx).studentId, childName: student(ctx).fullName, birthDate: student(ctx).dateOfBirth, edusId: `EDUS-${input(ctx).studentId.replace(/-/g, '')}` }),
      legal: { status: 'parcial', today: 'Las dosis están en el EDUS de la CCSS y el esquema es obligatorio (Ley 8111, no verificada aquí); el carné en papel sigue siendo lo que la escuela revisa.', todayEn: 'Doses are in the CCSS EDUS and the scheme is mandatory (Ley 8111, not verified here); the paper card is still what the school checks.', gap: 'Convenio MEP–CCSS y base legal de intercambio (Ley 8968 art. 5 c).', gapEn: 'An MEP–CCSS agreement and a legal basis for exchange (Ley 8968 art. 5 c).', basis: ['cr-5395', 'cr-17'], model: ['sg-myinfo'] },
    },
    {
      id: 'matricula',
      agency: 'mep',
      action: 'enrolStudent',
      label: 'Matricular en el MEP (comedor y transporte incluidos)',
      labelEn: 'Enrol with the MEP (meals and transport included)',
      purpose: 'Matricular estudiante en el centro educativo',
      data: (ctx) => ({ guardianId: ctx.citizen.id, studentId: input(ctx).studentId, studentName: student(ctx).fullName, birthDate: student(ctx).dateOfBirth, vaccinationRecord: (ctx.results.vacunas as VaccinationRecordResponse).recordNumber, school: input(ctx).school, grade: input(ctx).grade, canton: ctx.citizen.canton, needsTransport: input(ctx).needsTransport === 'si' }),
      legal: { status: 'parcial', today: 'Matrícula presencial en cada escuela, regida por resolución ministerial (Resolución MEP-0248-2026 sobre rangos de matrícula); algunos centros hacen parte en línea.', todayEn: 'In-person enrolment at each school, governed by ministerial resolution (Resolución MEP-0248-2026 on class sizes); some schools do part online.', gap: 'Plataforma nacional de matrícula por decreto del MEP.', gapEn: 'A national enrolment platform by MEP decree.', basis: ['cr-3481'], model: ['ru-210fz', 'sg-myinfo'] },
    },
    {
      id: 'beca',
      agency: 'imas',
      action: 'applyScholarship',
      label: 'Evaluar la beca Crecemos / Avancemos en el IMAS (SINIRUBE)',
      labelEn: 'Assess the Crecemos / Avancemos scholarship at IMAS (SINIRUBE)',
      purpose: 'Evaluar elegibilidad de beca estudiantil',
      data: (ctx) => ({ guardianId: ctx.citizen.id, studentId: input(ctx).studentId, enrolmentNumber: (ctx.results.matricula as SchoolEnrolmentResponse).enrolmentNumber, grade: input(ctx).grade, householdMonthlyIncomeCrc: input(ctx).householdMonthlyIncomeCrc, householdSize: input(ctx).householdSize }),
      legal: { status: 'parcial', today: 'Las becas del IMAS se solicitan aparte y se evalúan con el SINIRUBE (Ley 9137), la única base legal de intercambio de datos sociales que ya existe.', todayEn: 'IMAS scholarships are requested separately and assessed with SINIRUBE (Ley 9137), the only social-data sharing legal basis that already exists.', gap: 'Reglamento del IMAS para evaluar de oficio a todo estudiante matriculado.', gapEn: 'An IMAS regulation to assess every enrolled student ex officio.', basis: ['cr-9137'], model: ['ee-sundmusteenused'] },
    },
  ],
  benefits: { tripsAvoided: 3, hoursSaved: 6, costSavedCrc: 20000, daysTraditional: 20, daysDigital: 1 },
  traditional: 'TSE por la constancia, EBAIS por el carné, fila en la escuela en agosto y otra en el IMAS: cuatro mañanas de trabajo perdidas.',
  traditionalEn: 'TSE for the certificate, clinic for the card, a queue at the school in August and another at IMAS: four mornings of work lost.',
  consentText: 'Al continuar, usted autoriza compartir los datos de su hijo o hija con el Registro Civil, la CCSS, el MEP y el IMAS, únicamente para matricularlo y evaluar la beca.',
  inputSchema,
  result: (ctx) => {
    const s = student(ctx);
    const vac = ctx.results.vacunas as VaccinationRecordResponse;
    const enrol = ctx.results.matricula as SchoolEnrolmentResponse;
    const beca = ctx.results.beca as ScholarshipResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: `${s.firstName} ya tiene cupo`,
      headlineEn: 'Your child has a place',
      summary: `${s.fullName} queda matriculado en ${enrol.school} (${enrol.grade}) desde el ${enrol.startDate}, con ${enrol.services.join(' y ').toLowerCase()}. Beca ${beca.programme}: ${beca.eligible ? crc(beca.monthlyAmountCrc) + ' al mes' : 'no elegible con los ingresos declarados'}.`,
      cards: [
        { title: 'Estudiante', titleEn: 'Student', agency: 'registro', exchangeId: id('estudiante'), rows: [ { label: 'Nombre', value: s.fullName }, { label: 'Cédula', value: s.id }, { label: 'Nacimiento', value: s.dateOfBirth } ] },
        { title: 'Vacunación', titleEn: 'Vaccination', agency: 'salud', exchangeId: id('vacunas'), rows: [ { label: 'Carné', value: vac.recordNumber }, { label: 'Esquema', value: vac.scheme } ] },
        { title: 'Matrícula', titleEn: 'Enrolment', agency: 'mep', exchangeId: id('matricula'), rows: [ { label: 'Número', value: enrol.enrolmentNumber }, { label: 'Centro educativo', value: `${enrol.school} (circuito ${enrol.circuit})` }, { label: 'Nivel', value: enrol.grade }, { label: 'Inicio', value: enrol.startDate }, { label: 'Servicios', value: enrol.services.join(', ') } ] },
        { title: 'Beca del IMAS', titleEn: 'IMAS scholarship', agency: 'imas', exchangeId: id('beca'), rows: [ { label: 'Solicitud', value: beca.applicationNumber }, { label: 'Programa', value: beca.programme }, { label: 'Resultado', value: beca.eligible ? `Elegible: ${crc(beca.monthlyAmountCrc)} al mes` : 'No elegible' }, { label: 'Base', value: beca.basis } ] },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre del encargado', source: 'registro', exchangeId: id('identidad') },
        { field: 'address', label: 'Domicilio (comprobante)', source: 'registro', exchangeId: id('identidad') },
        { field: 'children', label: 'Vínculo con el menor', source: 'registro', exchangeId: id('identidad') },
        { field: 'dateOfBirth', label: 'Constancia de nacimiento del menor', source: 'registro', exchangeId: id('estudiante') },
        { field: 'recordNumber', label: 'Carné de vacunación', source: 'salud', exchangeId: id('vacunas') },
        { field: 'enrolmentNumber', label: 'Matrícula → IMAS', source: 'mep', exchangeId: id('beca') },
      ],
    };
  },
};
