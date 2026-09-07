import type { EmploymentRecord, PensionApplicationResponse, RopStatementResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  modality: z.enum(['vejez', 'anticipada']),
  ropModality: z.enum(['retiro-programado', 'renta-permanente']),
  iban: z.string().trim().toUpperCase().regex(/^CR\d{20}$/, 'IBAN costarricense: CR + 20 dígitos'),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const retirement: WorkflowSpec = {
  id: 'retirement',
  title: 'Me jubilo',
  titleEn: 'I am retiring',
  description:
    'Solicite su pensión IVM con las cuotas que la CCSS ya tiene y, en el mismo trámite, la modalidad de retiro de su ROP en la operadora. Sin constancias: el Estado ya sabe cuánto cotizó.',
  descriptionEn:
    'Apply for your IVM pension with the contributions the CCSS already holds and, in the same procedure, the payout modality of your ROP at the operator. No certificates: the State already knows what you contributed.',
  available: true,
  agencies: ['registro', 'ccss', 'supen'],
  legal: {
    status: 'parcial',
    today:
      'Desde el 21 de julio de 2025 la pensión por vejez del IVM se solicita en línea en la Oficina Virtual de la CCSS, que verifica cuotas, edad y estado con sus propios registros. Es el mejor ejemplo reciente de «una sola vez» dentro de una institución. Lo que sigue faltando es el puente con la operadora: el ROP (Ley 7983) se pide aparte y la operadora exige la resolución de la CCSS en papel o PDF.',
    todayEn:
      'Since 21 July 2025 the IVM old-age pension is requested online in the CCSS Oficina Virtual, which checks contributions, age and status against its own records. The best recent example of once-only inside one institution. What is still missing is the bridge to the operator: the ROP (Ley 7983) is requested separately and the operator asks for the CCSS resolution on paper or PDF.',
    gap: 'Que la resolución de pensión viaje de la CCSS a la operadora por el bus con consentimiento de la persona, y que SUPEN regule que la operadora la acepte; el modelo es el evento «me jubilo» de LifeSG y los registros base estonios.',
    gapEn: 'Let the pension resolution travel from the CCSS to the operator through the bus with the person\'s consent, and have SUPEN require operators to accept it; the model is LifeSG\'s "retiring" event and Estonia\'s base registries.',
    basis: ['cr-17', 'cr-7983', 'cr-8220'],
    model: ['ee-pia', 'sg-myinfo'],
  },
  fields: [
    {
      name: 'modality',
      label: 'Tipo de pensión IVM',
      labelEn: 'IVM pension type',
      type: 'radio',
      required: true,
      options: [
        { value: 'vejez', label: 'Vejez (65 años y 300 cuotas)' },
        { value: 'anticipada', label: 'Anticipada (desde 62 años con 360 cuotas)' },
      ],
      help: 'Las cuotas no las escribe usted: la CCSS las tiene.',
      helpEn: 'You do not type the contributions: the CCSS has them.',
    },
    {
      name: 'ropModality',
      label: 'Modalidad de retiro del ROP',
      labelEn: 'ROP payout modality',
      type: 'select',
      required: true,
      options: [
        { value: 'retiro-programado', label: 'Retiro programado (20 años)' },
        { value: 'renta-permanente', label: 'Renta permanente' },
      ],
    },
    { name: 'iban', label: 'Cuenta IBAN para el depósito', labelEn: 'IBAN for deposits', type: 'text', required: true, placeholder: 'CR + 20 dígitos' },
  ],
  steps: [
    {
      id: 'cuotas',
      agency: 'ccss',
      action: 'getEmployment',
      label: 'Verificar cuotas y estado laboral en la CCSS',
      labelEn: 'Verify contributions and employment status at the CCSS',
      purpose: 'Verificar historial de cuotas IVM',
      data: (ctx) => ({ citizenId: ctx.citizen.id }),
      legal: {
        status: 'hoy',
        today: 'La CCSS verifica cuotas, edad y estado con sus propios registros al recibir la solicitud en línea; la persona ya no aporta constancias.',
        todayEn: 'The CCSS checks contributions, age and status against its own records when it receives the online application; the person no longer provides certificates.',
        basis: ['cr-17'],
        model: [],
      },
    },
    {
      id: 'pension',
      agency: 'ccss',
      action: 'applyPension',
      label: 'Solicitar la pensión IVM',
      labelEn: 'Apply for the IVM pension',
      purpose: 'Solicitar pensión IVM por vejez',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        dateOfBirth: ctx.citizen.dateOfBirth,
        modality: input(ctx).modality,
        iban: input(ctx).iban,
      }),
      legal: {
        status: 'hoy',
        today: 'Trámite en línea desde julio de 2025 en la Oficina Virtual: se indica la cuenta IBAN y, si sigue trabajando, una nota del patrono. La resolución llega por correo.',
        todayEn: 'Online since July 2025 in the Oficina Virtual: you give the IBAN and, if still employed, an employer note. The resolution arrives by e-mail.',
        basis: ['cr-17', 'cr-8454'],
        model: [],
      },
    },
    {
      id: 'rop',
      agency: 'supen',
      action: 'ropStatement',
      label: 'Definir el retiro del ROP en la operadora',
      labelEn: 'Set the ROP payout at the operator',
      purpose: 'Solicitar retiro del Régimen Obligatorio de Pensiones',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        modality: input(ctx).ropModality,
        pensionApplication: (ctx.results.pension as PensionApplicationResponse).applicationNumber,
      }),
      legal: {
        status: 'parcial',
        today: 'La operadora paga el ROP cuando la persona presenta la resolución de pensión de la CCSS (Ley 7983); tiene canales digitales, pero el documento lo lleva la persona.',
        todayEn: 'The operator pays the ROP when the person presents the CCSS pension resolution (Ley 7983); it has digital channels, but the person carries the document.',
        gap: 'Que SUPEN obligue a las operadoras a recibir la resolución por el bus, con consentimiento; base legal de intercambio para una institución autónoma y entidades privadas reguladas.',
        gapEn: 'Have SUPEN require operators to receive the resolution through the bus, with consent; a legal basis for exchange between an autonomous institution and regulated private entities.',
        basis: ['cr-7983', 'cr-8968', 'cr-8220'],
        model: ['ee-pia', 'eu-eidas2'],
      },
    },
  ],
  benefits: { tripsAvoided: 3, hoursSaved: 6, costSavedCrc: 20000, daysTraditional: 90, daysDigital: 5 },
  traditional: 'Sucursal de la CCSS con cédula y constancias, resolución impresa, operadora con la resolución: dos ventanillas y hasta tres meses.',
  traditionalEn: 'A CCSS branch with the cédula and certificates, a printed resolution, the operator with the resolution: two windows and up to three months.',
  consentText:
    'Al continuar, usted autoriza a la CCSS a usar su historial de cuotas para resolver su pensión y a comunicar la resolución a su operadora de pensiones, únicamente para tramitar su jubilación.',
  inputSchema,
  result: (ctx) => {
    const emp = ctx.results.cuotas as EmploymentRecord;
    const pension = ctx.results.pension as PensionApplicationResponse;
    const rop = ctx.results.rop as RopStatementResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    const approved = pension.status === 'aprobada';
    return {
      headline: approved ? 'Su pensión está aprobada' : 'Su solicitud de pensión quedó en estudio',
      headlineEn: approved ? 'Your pension is approved' : 'Your pension application is under review',
      summary: approved
        ? `Pensión IVM de ${crc(pension.monthlyPensionCrc)} al mes desde el ${pension.firstPaymentDate}, más ${crc(rop.monthlyPaymentCrc)} del ROP. Todo con las cuotas que la CCSS ya tenía.`
        : `Con ${pension.contributions} cuotas y su edad actual la CCSS revisará el caso; el ROP ya quedó definido en la operadora. No tuvo que aportar constancias.`,
      cards: [
        {
          title: 'Historial de cuotas',
          titleEn: 'Contribution history',
          agency: 'ccss',
          exchangeId: id('cuotas'),
          rows: [
            { label: 'Cuotas IVM', value: String(emp.contributions) },
            { label: 'Último patrono', value: emp.employerName },
            { label: 'Estado', value: emp.status === 'activo' ? 'Activo' : 'Cesado' },
            { label: 'Último salario', value: crc(emp.lastSalaryCrc) },
          ],
        },
        {
          title: 'Pensión IVM',
          titleEn: 'IVM pension',
          agency: 'ccss',
          exchangeId: id('pension'),
          rows: [
            { label: 'Solicitud', value: pension.applicationNumber },
            { label: 'Estado', value: approved ? 'Aprobada' : 'En estudio' },
            { label: 'Monto mensual', value: crc(pension.monthlyPensionCrc) },
            { label: 'Primer pago', value: pension.firstPaymentDate },
          ],
        },
        {
          title: 'Régimen Obligatorio de Pensiones',
          titleEn: 'Mandatory pension (ROP)',
          agency: 'supen',
          exchangeId: id('rop'),
          rows: [
            { label: 'Operadora', value: rop.operator },
            { label: 'Saldo', value: crc(rop.balanceCrc) },
            { label: 'Modalidad', value: rop.modality === 'retiro-programado' ? 'Retiro programado' : 'Renta permanente' },
            { label: 'Pago mensual', value: crc(rop.monthlyPaymentCrc) },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'dateOfBirth', label: 'Fecha de nacimiento (edad)', source: 'registro', exchangeId: id('identidad') },
        { field: 'contributions', label: 'Cuotas IVM', source: 'ccss', exchangeId: id('cuotas') },
        { field: 'lastSalaryCrc', label: 'Salario de referencia', source: 'ccss', exchangeId: id('cuotas') },
        { field: 'applicationNumber', label: 'Resolución de pensión → operadora', source: 'ccss', exchangeId: id('rop') },
        { field: 'balanceCrc', label: 'Saldo del ROP', source: 'supen', exchangeId: id('rop') },
      ],
    };
  },
};
