import {
  findActivity,
  type CcssResponse,
  type CompanyResponse,
  type MunicipalityResponse,
  type SanitaryPermitResponse,
  type TaxResponse,
} from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  businessName: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120),
  businessType: z.enum(['natural', 'legal']),
  activityCode: z.string().regex(/^\d{4}$/, 'Código de actividad de 4 dígitos'),
  address: z.string().trim().min(5).max(200),
  municipality: z.string().trim().min(2).max(60).optional().or(z.literal('')),
  estimatedEmployees: z.coerce.number().int().min(0).max(500),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const municipalityOf = (ctx: StepContext) => (input(ctx).municipality?.trim() ? input(ctx).municipality!.trim() : ctx.citizen.canton);
/** Tax id: the cédula jurídica for a sociedad, the NITE otherwise. */
const taxIdOf = (ctx: StepContext) => (ctx.results.tributacion as TaxResponse).nite;

export const startBusiness: WorkflowSpec = {
  id: 'start-business',
  title: 'Iniciar un negocio',
  titleEn: 'Start a business',
  description:
    'Constituya la sociedad si hace falta, inscríbase en Tributación y la CCSS, obtenga la patente municipal y el permiso sanitario en un solo trámite, sin volver a digitar sus datos.',
  descriptionEn:
    'Form the company if needed, register with the tax authority and social security, and obtain the municipal licence and the sanitary permit in one procedure, without retyping your data.',
  available: true,
  agencies: ['registro', 'registro-nacional', 'tributacion', 'ccss', 'municipalidad', 'salud'],
  legal: {
    status: 'parcial',
    today:
      'Cada pieza existe en línea por separado: Crear Empresa (Registro Nacional), TRIBU-CR (Hacienda), Oficina Virtual (CCSS), la patente en la web de cada municipalidad y el PSF en el Área Rectora. Ley 8220 art. 2 ya prohíbe que se le pidan los mismos documentos dos veces, pero no hay plataforma que conecte las cinco ventanillas.',
    todayEn:
      'Each piece exists online separately: Crear Empresa (Registro Nacional), TRIBU-CR (tax), Oficina Virtual (CCSS), the patente on each municipality\'s site and the sanitary permit at the local Health Area. Ley 8220 art. 2 already forbids asking for the same documents twice, but no platform connects the five windows.',
    gap: 'Un bus de interoperabilidad obligatorio y registros base designados (como el capítulo de bases de datos de la ley estonia de información pública) y una identidad digital que toda institución deba aceptar (como eIDAS 2 en la UE).',
    gapEn: 'A mandatory interoperability bus with designated base registries (as in the databases chapter of Estonia\'s Public Information Act) and a digital identity every institution must accept (as eIDAS 2 in the EU).',
    basis: ['cr-8220', 'cr-8454', 'cr-crear-empresa', 'cr-9986'],
    model: ['ee-pia', 'eu-eidas2', 'br-14129'],
  },
  fields: [
    { name: 'businessName', label: 'Nombre del negocio', labelEn: 'Business name', type: 'text', required: true, placeholder: 'Café Tico' },
    {
      name: 'businessType',
      label: 'Tipo',
      labelEn: 'Type',
      type: 'radio',
      required: true,
      options: [
        { value: 'natural', label: 'Persona física (a mi nombre)' },
        { value: 'legal', label: 'Sociedad (S.A. o S.R.L.)' },
      ],
    },
    { name: 'activityCode', label: 'Actividad económica', labelEn: 'Economic activity', type: 'select', required: true, optionsFrom: 'activities' },
    { name: 'address', label: 'Dirección del local', labelEn: 'Business address', type: 'text', required: true, placeholder: 'Avenida Central, San Pedro' },
    {
      name: 'municipality',
      label: 'Cantón del local',
      labelEn: 'Canton of the premises',
      type: 'select',
      optionsFrom: 'cantons',
      defaultFromCitizen: 'canton',
      help: 'Por defecto, el cantón de su domicilio según el Registro Civil.',
      helpEn: 'Defaults to the canton of your address according to the Civil Registry.',
    },
    { name: 'estimatedEmployees', label: 'Empleados previstos', labelEn: 'Expected employees', type: 'number', required: true, min: 0, max: 500 },
  ],
  steps: [
    {
      id: 'registro-nacional',
      agency: 'registro-nacional',
      action: 'registerCompany',
      label: 'Constituir la sociedad en el Registro Nacional',
      labelEn: 'Form the company at the Registro Nacional',
      purpose: 'Constituir la sociedad y asignar cédula jurídica',
      when: (ctx) => input(ctx).businessType === 'legal',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        legalName: input(ctx).businessName,
        activityCode: input(ctx).activityCode,
        address: input(ctx).address,
      }),
      legal: {
        status: 'hoy',
        today: 'Crear Empresa permite constituir la sociedad en línea con un notario digital y obtener la cédula jurídica en horas. Solo aplica a sociedades; una persona física no pasa por aquí.',
        todayEn: 'Crear Empresa already allows forming the company online with a digital notary and getting the legal id within hours. Only for companies; a natural person skips this step.',
        basis: ['cr-crear-empresa', 'cr-8454'],
        model: [],
      },
    },
    {
      id: 'tributacion',
      agency: 'tributacion',
      action: 'createTaxId',
      label: 'Inscribir contribuyente en Tributación',
      labelEn: 'Register the taxpayer',
      purpose: 'Inscribir al contribuyente y asignar identificación tributaria',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        businessName: input(ctx).businessName,
        activityCode: input(ctx).activityCode,
        businessType: input(ctx).businessType,
        address: input(ctx).address,
      }),
      legal: {
        status: 'hoy',
        today: 'La inscripción se hace hoy en TRIBU-CR con firma digital, pero la persona vuelve a digitar nombre, domicilio y actividad. Que Hacienda los tome del Registro Civil y del Registro Nacional es lo que Ley 8220 art. 2 ya exige y nadie hace cumplir.',
        todayEn: 'Registration is done today in TRIBU-CR with a digital signature, but the person retypes name, address and activity. Having the tax authority take them from the civil and national registries is what Ley 8220 art. 2 already requires and nobody enforces.',
        basis: ['cr-8220', 'cr-8454'],
        model: ['ee-pia'],
      },
    },
    {
      id: 'ccss',
      agency: 'ccss',
      action: 'registerEmployer',
      label: 'Registrar patrono en la CCSS',
      labelEn: 'Register the employer with the CCSS',
      purpose: 'Registrar patrono o trabajador independiente',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        nite: taxIdOf(ctx),
        businessName: input(ctx).businessName,
        estimatedEmployees: input(ctx).estimatedEmployees,
      }),
      legal: {
        status: 'parcial',
        today: 'La inscripción patronal se solicita en la Oficina Virtual de la CCSS, pero exige adjuntar la cédula, la personería y a veces la patente. Con el bus, esos datos viajarían del Registro Nacional y la municipalidad sin adjuntos.',
        todayEn: 'Employer registration is requested in the CCSS Oficina Virtual, but requires attaching the id, the company certificate and sometimes the patente. With the bus those would travel from the registries without attachments.',
        gap: 'Un mandato de intercambio entre instituciones autónomas (la CCSS es autónoma por Constitución) como la ley singapurense de gobernanza del sector público, que autoriza y regula el intercambio entre agencias.',
        gapEn: 'A data-sharing mandate covering autonomous institutions (the CCSS is constitutionally autonomous), like Singapore\'s Public Sector (Governance) Act, which authorises and regulates inter-agency sharing.',
        basis: ['cr-17', 'cr-8220'],
        model: ['sg-psga', 'ee-pia'],
      },
    },
    {
      id: 'municipalidad',
      agency: 'municipalidad',
      action: 'issueLicense',
      label: 'Emitir patente municipal',
      labelEn: 'Issue the municipal licence',
      purpose: 'Emitir patente comercial municipal',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        nite: taxIdOf(ctx),
        businessName: input(ctx).businessName,
        activityCode: input(ctx).activityCode,
        address: input(ctx).address,
        municipality: municipalityOf(ctx),
      }),
      legal: {
        status: 'ley',
        today: 'Cada una de las 84 municipalidades tiene su propia ley de patentes y su propio sistema; varias piden el PSF antes de la patente y el Área Rectora pide la patente antes del PSF. Ninguna puede consultar hoy a Hacienda ni a la CCSS por un canal común.',
        todayEn: 'Each of the 84 municipalities has its own patente law and system; several require the sanitary permit before the licence while the Health Area requires the licence before the permit. None can query the tax authority or the CCSS through a common channel today.',
        gap: 'Una ley que obligue a las municipalidades a usar la identidad digital nacional y el bus (como Ley 9986 lo hizo con SICOP), y una plataforma municipal compartida para los cantones pequeños.',
        gapEn: 'A law obliging municipalities to use the national digital identity and the bus (as Ley 9986 did with SICOP), plus a shared municipal platform for small cantons.',
        basis: ['cr-7794', 'cr-9986'],
        model: ['ee-pia', 'br-14129'],
      },
    },
    {
      id: 'salud',
      agency: 'salud',
      action: 'issueSanitaryPermit',
      label: 'Emitir permiso sanitario de funcionamiento',
      labelEn: 'Issue the sanitary operating permit',
      purpose: 'Emitir permiso sanitario de funcionamiento',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        taxId: taxIdOf(ctx),
        businessName: input(ctx).businessName,
        activityCode: input(ctx).activityCode,
        address: input(ctx).address,
        municipality: municipalityOf(ctx),
      }),
      legal: {
        status: 'parcial',
        today: 'Para actividades de riesgo bajo (grupo C) el PSF es una declaración jurada que el Decreto 39472-S permite resolver de inmediato; para A y B hay inspección. Se entrega en el Área Rectora con copias de la cédula, la patente y el recibo.',
        todayEn: 'For low-risk activities (group C) the permit is a sworn declaration that Decree 39472-S allows to be resolved immediately; A and B require inspection. It is filed at the Health Area with copies of the id, the licence and the receipt.',
        gap: 'Solo un decreto: que el Ministerio de Salud reciba la declaración jurada firmada digitalmente y tome la patente de la municipalidad por el bus.',
        gapEn: 'Only a decree: let the Ministry receive the digitally signed declaration and take the licence from the municipality through the bus.',
        basis: ['cr-5395', 'cr-8454', 'cr-8220'],
        model: ['sg-myinfo'],
      },
    },
  ],
  benefits: { tripsAvoided: 4, hoursSaved: 8, costSavedCrc: 50000, daysTraditional: 30, daysDigital: 1 },
  traditional: 'Notaría, Registro Nacional, Hacienda, CCSS, municipalidad y Área Rectora: cinco filas, seis copias de la cédula, entre dos y seis semanas.',
  traditionalEn: 'Notary, Registro Nacional, tax office, CCSS, municipality and Health Area: five queues, six copies of the id, two to six weeks.',
  consentText:
    'Al continuar, usted autoriza compartir sus datos con las instituciones involucradas: Registro Civil, Registro Nacional, Tributación, CCSS, Municipalidad y Ministerio de Salud, únicamente para inscribir su negocio.',
  inputSchema,
  result: (ctx) => {
    const company = ctx.results['registro-nacional'] as CompanyResponse | undefined;
    const tax = ctx.results.tributacion as TaxResponse;
    const ccss = ctx.results.ccss as CcssResponse;
    const muni = ctx.results.municipalidad as MunicipalityResponse;
    const psf = ctx.results.salud as SanitaryPermitResponse;
    const activity = findActivity(input(ctx).activityCode);
    const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: '¡Su negocio está inscrito!',
      headlineEn: 'Your business is registered!',
      summary:
        'Listo. En un solo trámite obtuvo su inscripción tributaria, su registro patronal, su patente municipal y su permiso sanitario, sin visitar ninguna oficina.',
      cards: [
        ...(company
          ? [
              {
                title: 'Sociedad constituida',
                titleEn: 'Company formed',
                agency: 'registro-nacional' as const,
                exchangeId: id('registro-nacional'),
                rows: [
                  { label: 'Cédula jurídica', value: company.cedulaJuridica },
                  { label: 'Razón social', value: company.legalName },
                  { label: 'Tomo', value: company.tomo },
                  { label: 'Inscrita el', value: company.registrationDate },
                ],
              },
            ]
          : []),
        {
          title: 'Inscripción tributaria',
          titleEn: 'Tax registration',
          agency: 'tributacion',
          exchangeId: id('tributacion'),
          rows: [
            { label: 'Identificación tributaria', value: tax.nite },
            { label: 'Régimen', value: tax.taxRegime === 'simplified' ? 'Simplificado' : 'Tradicional' },
            { label: 'Actividad', value: `${tax.activityCode} · ${activity?.description ?? tax.activityDescription}` },
            { label: 'Inscrito el', value: tax.registrationDate },
          ],
        },
        {
          title: 'Registro patronal CCSS',
          titleEn: 'CCSS employer registration',
          agency: 'ccss',
          exchangeId: id('ccss'),
          rows: [
            { label: 'Número patronal', value: ccss.employerNumber },
            { label: 'Tipo', value: ccss.registrationType === 'employer' ? 'Patrono' : 'Trabajador independiente' },
            { label: 'Cuota mensual estimada', value: crc(ccss.monthlyContributionRateCrc) },
            { label: 'Inscrito el', value: ccss.registrationDate },
          ],
        },
        {
          title: 'Patente municipal',
          titleEn: 'Municipal licence',
          agency: 'municipalidad',
          exchangeId: id('municipalidad'),
          rows: [
            { label: 'Número de patente', value: muni.patenteNumber },
            { label: 'Municipalidad', value: muni.municipality },
            { label: 'Vence el', value: muni.expiryDate },
            { label: 'Monto anual', value: crc(muni.annualFeeCrc) },
          ],
        },
        {
          title: 'Permiso sanitario de funcionamiento',
          titleEn: 'Sanitary operating permit',
          agency: 'salud',
          exchangeId: id('salud'),
          rows: [
            { label: 'Número', value: psf.permitNumber },
            { label: 'Grupo de riesgo', value: psf.riskGroup },
            { label: 'Vence el', value: psf.expiryDate },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'dateOfBirth', label: 'Fecha de nacimiento', source: 'registro', exchangeId: id('identidad') },
        { field: 'address', label: 'Dirección', source: 'registro', exchangeId: id('identidad') },
        { field: 'canton', label: 'Cantón', source: 'registro', exchangeId: id('identidad') },
        { field: 'nationality', label: 'Nacionalidad', source: 'registro', exchangeId: id('identidad') },
        ...(company ? [{ field: 'cedulaJuridica', label: 'Cédula jurídica', source: 'registro-nacional' as const, exchangeId: id('registro-nacional') }] : []),
        { field: 'nite', label: 'Identificación tributaria', source: 'tributacion', exchangeId: id('tributacion') },
        { field: 'taxRegime', label: 'Régimen tributario', source: 'tributacion', exchangeId: id('tributacion') },
        { field: 'employerNumber', label: 'Número patronal', source: 'ccss', exchangeId: id('ccss') },
        { field: 'patenteNumber', label: 'Número de patente', source: 'municipalidad', exchangeId: id('municipalidad') },
        { field: 'permitNumber', label: 'Permiso sanitario', source: 'salud', exchangeId: id('salud') },
      ],
    };
  },
};
