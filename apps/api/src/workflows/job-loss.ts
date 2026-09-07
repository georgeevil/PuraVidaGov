import type { EmploymentRecord, FclWithdrawalResponse, JobSeekerResponse, VoluntaryInsuranceResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  lastOccupation: z.string().trim().min(2, 'Indique su último puesto').max(80),
  desiredArea: z.string().trim().min(2, 'Indique el área en que busca trabajo').max(80),
  declaredIncomeCrc: z.coerce.number().int().min(0).max(50_000_000),
  iban: z.string().trim().toUpperCase().regex(/^CR\d{20}$/, 'IBAN costarricense: CR + 20 dígitos'),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const employment = (ctx: StepContext) => ctx.results.cese as EmploymentRecord;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const jobLoss: WorkflowSpec = {
  id: 'job-loss',
  title: 'Perdí el empleo',
  titleEn: 'I lost my job',
  description:
    'Con el cese que su patrono ya reportó a la CCSS: retire su Fondo de Capitalización Laboral, inscríbase en la bolsa de empleo del MTSS y mantenga su seguro de salud, sin llevar una carta de despido a ninguna parte.',
  descriptionEn:
    'Using the termination your employer already reported to the CCSS: withdraw your labour capitalisation fund, register with the MTSS job bank and keep your health insurance, without carrying a dismissal letter anywhere.',
  available: true,
  agencies: ['registro', 'ccss', 'supen', 'mtss'],
  legal: {
    status: 'ley',
    today:
      'El cese ya está en la CCSS: el patrono lo reporta en la planilla. Pero la Ley 7983 obliga a la operadora a pagar el FCL en 15 días solo cuando el trabajador demuestra el despido con papeles, la bolsa de empleo del MTSS se llena aparte y el seguro de salud se pierde hasta que la persona va a la sucursal a asegurarse por su cuenta. No existe seguro de desempleo.',
    todayEn:
      'The termination is already at the CCSS: the employer reports it on the payroll. But Ley 7983 makes the operator pay the FCL within 15 days only when the worker proves dismissal with paperwork, the MTSS job bank is filled in separately and health coverage lapses until the person goes to a branch to insure themselves. There is no unemployment insurance.',
    gap: 'Un evento «cese laboral» publicado por la CCSS en el bus, con base legal para que la operadora, el MTSS y la propia CCSS actúen de oficio (como el «una sola vez» estonio y el evento de vida de LifeSG), y una decisión política aparte sobre el seguro de desempleo.',
    gapEn: 'A "job termination" event published by the CCSS on the bus, with a legal basis for the operator, the MTSS and the CCSS itself to act ex officio (Estonia\'s once-only and LifeSG\'s life event), plus a separate political decision on unemployment insurance.',
    basis: ['cr-7983', 'cr-17', 'cr-8220', 'cr-8968'],
    model: ['ee-pia', 'sg-psga', 'sg-myinfo'],
  },
  fields: [
    { name: 'lastOccupation', label: 'Último puesto', labelEn: 'Last occupation', type: 'text', required: true, placeholder: 'Contadora' },
    { name: 'desiredArea', label: 'Área en la que busca trabajo', labelEn: 'Desired area', type: 'text', required: true, placeholder: 'Contabilidad, software, turismo…' },
    {
      name: 'declaredIncomeCrc',
      label: 'Ingreso mensual estimado mientras busca trabajo (₡)',
      labelEn: 'Estimated monthly income while job-seeking (CRC)',
      type: 'number',
      required: true,
      min: 0,
      help: 'Sirve para calcular la cuota del seguro voluntario. Puede ser 0.',
      helpEn: 'Used to compute the voluntary insurance premium. Can be 0.',
    },
    { name: 'iban', label: 'Cuenta IBAN para el depósito del FCL', labelEn: 'IBAN for the FCL payout', type: 'text', required: true, placeholder: 'CR + 20 dígitos' },
  ],
  steps: [
    {
      id: 'cese',
      agency: 'ccss',
      action: 'getEmployment',
      label: 'Verificar el cese reportado por el patrono en la CCSS',
      labelEn: 'Verify the termination reported by the employer to the CCSS',
      purpose: 'Verificar cese laboral reportado en planilla',
      data: (ctx) => ({ citizenId: ctx.citizen.id }),
      legal: {
        status: 'hoy',
        today: 'El patrono reporta la salida del trabajador en la planilla mensual de la CCSS; el dato existe y la persona puede verlo en la Oficina Virtual. Nadie más lo consulta.',
        todayEn: 'The employer reports the worker\'s exit on the monthly CCSS payroll; the record exists and the person can see it in the Oficina Virtual. Nobody else queries it.',
        basis: ['cr-17'],
        model: ['ee-pia'],
      },
    },
    {
      id: 'fcl',
      agency: 'supen',
      action: 'withdrawFcl',
      label: 'Retirar el Fondo de Capitalización Laboral en la operadora',
      labelEn: 'Withdraw the labour capitalisation fund at the operator',
      purpose: 'Solicitar retiro del FCL por cese laboral',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        employerNumber: employment(ctx).employerNumber,
        terminationDate: employment(ctx).endDate ?? new Date().toISOString().slice(0, 10),
        iban: input(ctx).iban,
      }),
      legal: {
        status: 'parcial',
        today: 'Las operadoras tienen canales digitales y la Ley 7983 (art. 6) fija 15 días para pagar, pero exigen la carta de despido o una constancia: la prueba del cese que la CCSS ya tiene en la planilla.',
        todayEn: 'Operators have digital channels and Ley 7983 (art. 6) sets 15 days to pay, but they require the dismissal letter or a certificate: the proof of termination the CCSS already holds on the payroll.',
        gap: 'Que la operadora lea el cese en la CCSS por el bus, con consentimiento de la persona (Ley 8968 art. 5), en vez de pedir el papel.',
        gapEn: 'Let the operator read the termination at the CCSS through the bus, with the person\'s consent (Ley 8968 art. 5), instead of asking for the paper.',
        basis: ['cr-7983', 'cr-8220'],
        model: ['ee-pia', 'sg-myinfo'],
      },
    },
    {
      id: 'empleo',
      agency: 'mtss',
      action: 'registerJobSeeker',
      label: 'Inscribirse en la bolsa de empleo del MTSS',
      labelEn: 'Register with the MTSS job bank',
      purpose: 'Inscribir a la persona en la bolsa nacional de empleo',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        canton: ctx.citizen.canton,
        lastOccupation: input(ctx).lastOccupation,
        desiredArea: input(ctx).desiredArea,
        terminationDate: employment(ctx).endDate ?? new Date().toISOString().slice(0, 10),
      }),
      legal: {
        status: 'parcial',
        today: 'El MTSS mantiene una bolsa de empleo en línea (Agencia Nacional de Empleo) en la que la persona se registra por su cuenta, volviendo a escribir lo que el Estado ya sabe de ella. Nada avisa al MTSS de que alguien acaba de quedar sin trabajo.',
        todayEn: 'The MTSS runs an online job bank (Agencia Nacional de Empleo) where the person registers on their own, retyping what the State already knows. Nothing tells the MTSS that someone just lost their job.',
        gap: 'Un evento de vida «cese» que ofrezca la inscripción y la formación del INA de oficio, como LifeSG.',
        gapEn: 'A "termination" life event that offers registration and INA training ex officio, as LifeSG does.',
        basis: ['cr-8220', 'cr-9943'],
        model: ['sg-myinfo'],
      },
    },
    {
      id: 'seguro',
      agency: 'ccss',
      action: 'enrollVoluntary',
      label: 'Mantener el seguro de salud (asegurado voluntario)',
      labelEn: 'Keep health coverage (voluntary insurance)',
      purpose: 'Inscribir como asegurado voluntario tras el cese',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        declaredIncomeCrc: input(ctx).declaredIncomeCrc,
      }),
      legal: {
        status: 'ley',
        today: 'Al cesar la relación laboral la cobertura de salud se pierde; para asegurarse por cuenta propia la persona debe ir a la sucursal de la CCSS a declarar ingresos y firmar. La CCSS ya sabe que fue cesada porque ella misma recibió la planilla.',
        todayEn: 'When employment ends, health coverage lapses; to insure themselves the person must go to a CCSS branch to declare income and sign. The CCSS already knows about the termination because it received the payroll.',
        gap: 'Continuidad automática de cobertura por un plazo tras el cese y afiliación voluntaria en línea, por reglamento de la CCSS con base en una ley que autorice el uso de oficio de sus propios datos. El seguro de desempleo es otra ley.',
        gapEn: 'Automatic coverage continuity for a period after termination and online voluntary enrolment, by CCSS regulation under a statute authorising ex-officio use of its own data. Unemployment insurance is another statute.',
        basis: ['cr-17', 'cr-8968'],
        model: ['sg-psga', 'ee-pia'],
      },
    },
  ],
  benefits: { tripsAvoided: 3, hoursSaved: 8, costSavedCrc: 30000, daysTraditional: 30, daysDigital: 15 },
  traditional: 'Carta de despido al patrono, operadora con la carta, plataforma del MTSS, sucursal de la CCSS: tres filas en el peor momento.',
  traditionalEn: 'A dismissal letter from the employer, the operator with the letter, the MTSS platform, a CCSS branch: three queues at the worst possible time.',
  consentText:
    'Al continuar, usted autoriza a la CCSS a comunicar su cese laboral a su operadora de pensiones y al Ministerio de Trabajo, y a la operadora y al MTSS a usarlo únicamente para pagar su FCL, inscribirlo en la bolsa de empleo y mantener su seguro.',
  inputSchema,
  result: (ctx) => {
    const emp = employment(ctx);
    const fcl = ctx.results.fcl as FclWithdrawalResponse;
    const job = ctx.results.empleo as JobSeekerResponse;
    const ins = ctx.results.seguro as VoluntaryInsuranceResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: 'Su cese quedó atendido en un solo paso',
      headlineEn: 'Your job loss was handled in one step',
      summary: `El FCL de ${crc(fcl.balanceCrc)} se deposita el ${fcl.paymentDate}, está inscrito en la bolsa de empleo y su seguro de salud sigue vigente. No presentó ninguna carta.`,
      cards: [
        {
          title: 'Cese verificado',
          titleEn: 'Termination verified',
          agency: 'ccss',
          exchangeId: id('cese'),
          rows: [
            { label: 'Patrono', value: `${emp.employerName} (${emp.employerNumber})` },
            { label: 'Relación laboral', value: `${emp.startDate} → ${emp.endDate ?? 'vigente'}` },
            { label: 'Cuotas acumuladas', value: String(emp.contributions) },
          ],
        },
        {
          title: 'Fondo de Capitalización Laboral',
          titleEn: 'Labour capitalisation fund',
          agency: 'supen',
          exchangeId: id('fcl'),
          rows: [
            { label: 'Solicitud', value: fcl.requestNumber },
            { label: 'Operadora', value: fcl.operator },
            { label: 'Monto', value: crc(fcl.balanceCrc) },
            { label: 'Depósito el', value: fcl.paymentDate },
          ],
        },
        {
          title: 'Bolsa de empleo',
          titleEn: 'Job bank',
          agency: 'mtss',
          exchangeId: id('empleo'),
          rows: [
            { label: 'Inscripción', value: job.registrationNumber },
            { label: 'Plataforma', value: job.platform },
            { label: 'Formación sugerida', value: job.trainingOffer },
            { label: 'Primera cita', value: job.firstAppointment },
          ],
        },
        {
          title: 'Seguro de salud',
          titleEn: 'Health coverage',
          agency: 'ccss',
          exchangeId: id('seguro'),
          rows: [
            { label: 'Póliza voluntaria', value: ins.policyNumber },
            { label: 'Cuota mensual', value: crc(ins.monthlyPremiumCrc) },
            { label: 'Cubierto desde', value: ins.coveredFrom },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'canton', label: 'Cantón', source: 'registro', exchangeId: id('identidad') },
        { field: 'employerNumber', label: 'Patrono y número patronal', source: 'ccss', exchangeId: id('cese') },
        { field: 'endDate', label: 'Fecha de cese (prueba del despido)', source: 'ccss', exchangeId: id('cese') },
        { field: 'contributions', label: 'Cuotas acumuladas', source: 'ccss', exchangeId: id('cese') },
        { field: 'balanceCrc', label: 'Saldo del FCL', source: 'supen', exchangeId: id('fcl') },
        { field: 'registrationNumber', label: 'Inscripción en la bolsa de empleo', source: 'mtss', exchangeId: id('empleo') },
        { field: 'policyNumber', label: 'Póliza de seguro voluntario', source: 'ccss', exchangeId: id('seguro') },
      ],
    };
  },
};
