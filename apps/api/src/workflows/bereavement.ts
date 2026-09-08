import type { BeneficiaryPayoutResponse, DeathRegistrationResponse, EstateResponse, SurvivorPensionResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  deceasedId: z.string().trim().regex(/^\d-\d{4}-\d{4}$/, 'Cédula en formato 0-0000-0000'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD'),
  hospital: z.string().trim().min(1, 'Seleccione el hospital'),
  iban: z.string().trim().toUpperCase().regex(/^CR\d{20}$/, 'IBAN costarricense: CR + 20 dígitos'),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const death = (ctx: StepContext) => ctx.results.defuncion as DeathRegistrationResponse;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const bereavement: WorkflowSpec = {
  id: 'bereavement',
  title: 'Falleció mi cónyuge',
  titleEn: 'My spouse died',
  description:
    'El hospital ya declaró la defunción al TSE. Con esa sola inscripción: pensión por viudez en la CCSS, entrega del ROP y el FCL de la operadora y anotación de la sucesión en el Registro Nacional, sin recorrer ventanillas con el certificado en la mano.',
  descriptionEn:
    'The hospital already declared the death to the TSE. From that single registration: survivor pension at the CCSS, ROP and FCL payout from the operator and the succession annotated at the Registro Nacional, without walking from window to window with the certificate.',
  available: true,
  agencies: ['registro', 'ccss', 'supen', 'registro-nacional'],
  legal: {
    status: 'ley',
    today:
      'La inscripción ya es electrónica cuando la muerte ocurre en un hospital: el médico registrador auxiliar emite el certificado en SEDIMEC («Defunción en Línea», desde 2018) y el TSE inscribe gratis en ocho días hábiles. Todo lo demás lo hace la familia, ventanilla por ventanilla, con el certificado: la pensión por muerte en la CCSS, el ROP y el FCL en la operadora, la sucesión ante notario o juez y los bancos. Nada avisa a nadie.',
    todayEn:
      'Registration is already electronic when the death occurs in a hospital: the physician acting as auxiliary registrar issues the certificate in SEDIMEC ("Defunción en Línea", since 2018) and the TSE registers it free within eight working days. Everything else the family does window by window with the certificate: the survivor pension at the CCSS, the ROP and FCL at the operator, the succession before a notary or judge and the banks. Nothing notifies anyone.',
    gap: 'Una base legal para que la inscripción de defunción del TSE se comunique de oficio a la CCSS, a SUPEN y al Registro Nacional (Ley 8968 art. 5 c), como Skatteverket avisa a las demás autoridades en Suecia y como el «aviso de defunción» estonio dispara el registro automático. La sucesión seguirá siendo un acto notarial o judicial.',
    gapEn: 'A legal basis for the TSE death registration to be communicated ex officio to the CCSS, SUPEN and the Registro Nacional (Ley 8968 art. 5 c), as Skatteverket notifies the other authorities in Sweden and as the Estonian "death notice" triggers automatic registration. The succession will remain a notarial or judicial act.',
    basis: ['cr-defuncion', 'cr-17', 'cr-7983', 'cr-8968', 'cr-8220'],
    model: ['se-efterlevande', 'ee-sundmusteenused', 'no-livshendelser', 'ru-210fz'],
  },
  fields: [
    {
      name: 'deceasedId',
      label: 'Cédula de la persona fallecida',
      labelEn: 'Cédula of the deceased',
      type: 'text',
      required: true,
      defaultFromCitizen: 'spouseId',
      help: 'Se toma de su registro matrimonial en el TSE; puede cambiarla.',
      helpEn: 'Taken from your marriage record at the TSE; you can change it.',
    },
    { name: 'date', label: 'Fecha del fallecimiento', labelEn: 'Date of death', type: 'date', required: true },
    { name: 'hospital', label: 'Hospital donde ocurrió', labelEn: 'Hospital', type: 'select', required: true, optionsFrom: 'hospitals' },
    { name: 'iban', label: 'Cuenta IBAN para la pensión y los fondos', labelEn: 'IBAN for the pension and the funds', type: 'text', required: true, placeholder: 'CR + 20 dígitos' },
  ],
  steps: [
    {
      id: 'defuncion',
      agency: 'registro',
      action: 'registerDeath',
      label: 'Inscribir la defunción en el Registro Civil (certificado SEDIMEC del hospital)',
      labelEn: 'Register the death at the Civil Registry (hospital SEDIMEC certificate)',
      purpose: 'Inscribir defunción con certificado médico electrónico',
      data: (ctx) => ({ declarantId: ctx.citizen.id, deceasedId: input(ctx).deceasedId, date: input(ctx).date, hospital: input(ctx).hospital }),
      legal: {
        status: 'hoy',
        today: 'Ley 3504 art. 95 c): el médico registrador auxiliar declara en «Defunción en Línea» (SEDIMEC) y el TSE inscribe gratis en ocho días hábiles. Fuera de un hospital, la familia lleva el formulario en papel.',
        todayEn: 'Ley 3504 art. 95 c): the physician acting as auxiliary registrar declares in "Defunción en Línea" (SEDIMEC) and the TSE registers free within eight working days. Outside a hospital the family brings the paper form.',
        basis: ['cr-defuncion', 'cr-3504'],
        model: [],
      },
    },
    {
      id: 'pension',
      agency: 'ccss',
      action: 'survivorPension',
      label: 'Pensión por viudez (IVM) en la CCSS',
      labelEn: 'Survivor pension (IVM) at the CCSS',
      purpose: 'Solicitar pensión por muerte del cotizante',
      data: (ctx) => ({
        survivorId: ctx.citizen.id,
        deceasedId: input(ctx).deceasedId,
        relationship: 'conyuge',
        deathCertificate: death(ctx).certificateNumber,
        iban: input(ctx).iban,
      }),
      legal: {
        status: 'parcial',
        today: 'La CCSS ofrece la «Solicitud de pensión por muerte» como trámite; la persona viuda aporta las certificaciones del TSE (defunción, matrimonio) que la propia CCSS podría consultar en el padrón. Disponibilidad en línea y plazo: no verificados.',
        todayEn: 'The CCSS offers the "survivor pension application" as a procedure; the widow or widower brings the TSE certificates (death, marriage) the CCSS itself could look up in the register. Online availability and time: not verified.',
        gap: 'Que la CCSS abra el expediente de oficio al recibir la defunción por el bus (Reglamento IVM + base legal Ley 8968 art. 5 c).',
        gapEn: 'Let the CCSS open the file ex officio when the death arrives through the bus (IVM regulation plus a Ley 8968 art. 5 c legal basis).',
        basis: ['cr-17', 'cr-8220'],
        model: ['se-efterlevande', 'ee-sundmusteenused'],
      },
    },
    {
      id: 'fondos',
      agency: 'supen',
      action: 'beneficiaryPayout',
      label: 'Entrega del ROP y el FCL a la persona beneficiaria',
      labelEn: 'ROP and FCL payout to the beneficiary',
      purpose: 'Pagar saldos del ROP y FCL a la persona beneficiaria',
      data: (ctx) => ({
        beneficiaryId: ctx.citizen.id,
        deceasedId: input(ctx).deceasedId,
        deathCertificate: death(ctx).certificateNumber,
        iban: input(ctx).iban,
      }),
      legal: {
        status: 'parcial',
        today: 'La operadora paga a las personas beneficiarias designadas (Ley 7983) cuando la familia se presenta con el certificado de defunción; nadie le avisa a la operadora que su afiliado murió.',
        todayEn: 'The operator pays the designated beneficiaries (Ley 7983) when the family shows up with the death certificate; nobody tells the operator its member died.',
        gap: 'Reglamento de SUPEN que obligue a las operadoras a consultar el padrón del TSE por el bus y a contactar a las personas beneficiarias de oficio.',
        gapEn: 'A SUPEN regulation obliging operators to query the TSE register through the bus and contact beneficiaries ex officio.',
        basis: ['cr-7983', 'cr-8968'],
        model: ['se-efterlevande'],
      },
    },
    {
      id: 'sucesion',
      agency: 'registro-nacional',
      action: 'listEstate',
      label: 'Anotar la sucesión sobre los bienes en el Registro Nacional',
      labelEn: 'Annotate the succession on the assets at the Registro Nacional',
      purpose: 'Listar bienes de la persona fallecida y anotar sucesión abierta',
      data: (ctx) => ({ deceasedId: input(ctx).deceasedId, deathCertificate: death(ctx).certificateNumber }),
      legal: {
        status: 'parcial',
        today: 'La consulta de bienes es pública en línea, pero la sucesión (notarial si los herederos son mayores y están de acuerdo, judicial si no) empieza cuando la familia la inicia, y nada impide que un bien del difunto se venda entre tanto.',
        todayEn: 'Asset lookup is public online, but the succession (notarial if the heirs are adults and agree, judicial otherwise) starts when the family starts it, and nothing prevents an asset of the deceased being sold in the meantime.',
        gap: 'Que el Registro Nacional anote de oficio «sucesión abierta» al recibir la defunción del TSE; la sucesión misma sigue siendo un acto notarial o judicial.',
        gapEn: 'Let the Registro Nacional annotate "succession open" ex officio when it receives the death from the TSE; the succession itself remains a notarial or judicial act.',
        basis: ['cr-8220', 'cr-8968'],
        model: ['ee-sundmusteenused', 'no-livshendelser'],
      },
    },
  ],
  benefits: { tripsAvoided: 5, hoursSaved: 12, costSavedCrc: 45000, daysTraditional: 120, daysDigital: 8 },
  traditional: 'TSE por las certificaciones, sucursal de la CCSS, operadora de pensiones, notario y bancos: cinco filas con un certificado de defunción en la mano, en el peor momento de la vida.',
  traditionalEn: 'TSE for the certificates, CCSS branch, pension operator, notary and banks: five queues with a death certificate in hand, at the worst moment of one\'s life.',
  consentText:
    'Al continuar, usted autoriza al Registro Civil a comunicar la defunción a la CCSS, a su operadora de pensiones y al Registro Nacional, y a estas a usarla únicamente para resolver su pensión, entregarle los fondos y anotar la sucesión.',
  inputSchema,
  result: (ctx) => {
    const d = death(ctx);
    const pension = ctx.results.pension as SurvivorPensionResponse;
    const funds = ctx.results.fondos as BeneficiaryPayoutResponse;
    const estate = ctx.results.sucesion as EstateResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: 'Todo lo que dependía del Estado quedó resuelto',
      headlineEn: 'Everything that depended on the State is resolved',
      summary: `La defunción de ${d.deceasedName} quedó inscrita; su pensión por viudez está ${pension.status === 'aprobada' ? 'aprobada' : 'en estudio'} y los fondos de pensiones se depositan el ${funds.paymentDate}. Solo la sucesión sigue siendo suya y de su notario.`,
      cards: [
        {
          title: 'Inscripción de la defunción',
          titleEn: 'Death registration',
          agency: 'registro',
          exchangeId: id('defuncion'),
          rows: [
            { label: 'Persona fallecida', value: `${d.deceasedName} (${d.deceasedId})` },
            { label: 'Certificado médico', value: d.medicalCertificate },
            { label: 'Certificado del TSE', value: d.certificateNumber },
            { label: 'Inscrita el', value: d.registeredAt },
          ],
        },
        {
          title: 'Pensión por viudez',
          titleEn: 'Survivor pension',
          agency: 'ccss',
          exchangeId: id('pension'),
          rows: [
            { label: 'Solicitud', value: pension.applicationNumber },
            { label: 'Estado', value: pension.status === 'aprobada' ? 'Aprobada' : 'En estudio' },
            { label: 'Monto mensual', value: crc(pension.monthlyPensionCrc) },
            { label: 'Primer pago', value: pension.firstPaymentDate },
          ],
        },
        {
          title: 'Fondos de pensiones',
          titleEn: 'Pension funds',
          agency: 'supen',
          exchangeId: id('fondos'),
          rows: [
            { label: 'Solicitud', value: funds.requestNumber },
            { label: 'Operadora', value: funds.operator },
            { label: 'ROP', value: crc(funds.ropBalanceCrc) },
            { label: 'FCL', value: crc(funds.fclBalanceCrc) },
            { label: 'Depósito el', value: funds.paymentDate },
          ],
        },
        {
          title: 'Bienes y sucesión',
          titleEn: 'Assets and succession',
          agency: 'registro-nacional',
          exchangeId: id('sucesion'),
          rows: [
            { label: 'Propiedades', value: estate.properties.length ? estate.properties.map((p) => `${p.folio} (${p.canton})`).join('; ') : 'Ninguna' },
            { label: 'Vehículos', value: estate.vehicles.length ? estate.vehicles.map((v) => `${v.plate} ${v.make} ${v.model}`).join('; ') : 'Ninguno' },
            { label: 'Sociedades', value: estate.companies.length ? estate.companies.map((c) => c.legalName).join('; ') : 'Ninguna' },
            { label: 'Anotación', value: estate.annotation },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre de la persona viuda', source: 'registro', exchangeId: id('identidad') },
        { field: 'spouseId', label: 'Vínculo matrimonial', source: 'registro', exchangeId: id('identidad') },
        { field: 'medicalCertificate', label: 'Certificado médico (SEDIMEC)', source: 'registro', exchangeId: id('defuncion') },
        { field: 'certificateNumber', label: 'Certificado de defunción → CCSS, operadora, Registro Nacional', source: 'registro', exchangeId: id('defuncion') },
        { field: 'contributions', label: 'Cuotas del cotizante fallecido', source: 'ccss', exchangeId: id('pension') },
        { field: 'ropBalanceCrc', label: 'Saldos del ROP y FCL', source: 'supen', exchangeId: id('fondos') },
        { field: 'estate', label: 'Bienes inscritos', source: 'registro-nacional', exchangeId: id('sucesion') },
      ],
    };
  },
};
