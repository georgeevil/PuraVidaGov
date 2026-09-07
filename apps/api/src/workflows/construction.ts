import type { BuildingPermitResponse, LandUseResponse, PlanReviewResponse, Property } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  folio: z.string().trim().min(1, 'Seleccione la propiedad'),
  projectType: z.enum(['vivienda', 'comercial', 'ampliacion']),
  areaM2: z.coerce.number().positive('Área en m²').max(100000),
  declaredValueCrc: z.coerce.number().positive('Valor de la obra').max(1e12),
  professionalLicence: z.string().trim().min(1, 'Seleccione el profesional responsable'),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const property = (ctx: StepContext) => ctx.results.propiedad as Property;

export const construction: WorkflowSpec = {
  id: 'construction',
  title: 'Voy a construir',
  titleEn: 'I am going to build',
  description:
    'Verifique su finca en el Registro Nacional, obtenga el uso de suelo, la revisión de planos del CFIA con Salud, Bomberos, AyA e INVU, y el permiso municipal de construcción en un solo trámite.',
  descriptionEn: 'Verify your property, get the land-use certificate, the CFIA plan review with Health, Fire, Water and Housing, and the municipal building permit in one procedure.',
  available: true,
  agencies: ['registro', 'registro-nacional', 'municipalidad', 'cfia'],
  legal: {
    status: 'parcial',
    today:
      'Es el trámite más avanzado del país: desde 2011 la plataforma APC del CFIA recibe los planos una sola vez y Salud, Bomberos, AyA e INVU los revisan en paralelo por decreto. Pero el uso de suelo y el permiso municipal siguen en cada municipalidad, muchas fuera de APC, con copias de la escritura y del plano catastrado que el Registro Nacional ya tiene.',
    todayEn:
      'The country\'s most advanced procedure: since 2011 the CFIA\'s APC platform receives the plans once and Health, Fire, Water and Housing review them in parallel by decree. But land use and the municipal permit remain at each municipality, many outside APC, with copies of the deed and cadastral plan the Registro Nacional already holds.',
    gap: 'Conectar las 84 municipalidades a APC por ley y dejar que consulten la finca en el Registro Nacional por el bus, como los registros base estonios.',
    gapEn: 'Connect all 84 municipalities to APC by law and let them read the property from the Registro Nacional through the bus, like Estonia\'s base registries.',
    basis: ['cr-36550', 'cr-833', 'cr-7794', 'cr-8220'],
    model: ['ee-pia', 'eu-sdg'],
  },
  fields: [
    {
      name: 'folio',
      label: 'Propiedad',
      labelEn: 'Property',
      type: 'select',
      required: true,
      optionsFrom: 'properties',
      help: 'Sus fincas se cargan del Registro Nacional; no tiene que aportar escritura ni plano catastrado.',
      helpEn: 'Your properties are loaded from the Registro Nacional; no deed or cadastral plan needed.',
    },
    {
      name: 'projectType',
      label: 'Tipo de obra',
      labelEn: 'Project type',
      type: 'radio',
      required: true,
      options: [
        { value: 'vivienda', label: 'Vivienda' },
        { value: 'comercial', label: 'Local comercial' },
        { value: 'ampliacion', label: 'Ampliación o remodelación' },
      ],
    },
    { name: 'areaM2', label: 'Área a construir (m²)', labelEn: 'Area to build (m²)', type: 'number', required: true, min: 1, max: 100000 },
    { name: 'declaredValueCrc', label: 'Valor declarado de la obra (₡)', labelEn: 'Declared value (CRC)', type: 'number', required: true, min: 1 },
    {
      name: 'professionalLicence',
      label: 'Profesional responsable (CFIA)',
      labelEn: 'Responsible professional (CFIA)',
      type: 'select',
      required: true,
      optionsFrom: 'professionals',
    },
  ],
  steps: [
    {
      id: 'propiedad',
      agency: 'registro-nacional',
      action: 'getProperty',
      label: 'Verificar la finca en el Registro Nacional',
      labelEn: 'Verify the property at the Registro Nacional',
      purpose: 'Verificar titularidad y gravámenes de la finca',
      data: (ctx) => ({ folio: input(ctx).folio }),
      legal: {
        status: 'hoy',
        today: 'La consulta de fincas del Registro Nacional está en línea y es pública; con firma digital se obtiene la certificación literal en minutos. Lo que no existe es que la municipalidad la consulte por usted.',
        todayEn: 'Property lookup at the Registro Nacional is online and public; with a digital signature the certificate is issued in minutes. What does not exist is the municipality querying it on your behalf.',
        basis: ['cr-8454', 'cr-8220'],
        model: ['ee-pia'],
      },
    },
    {
      id: 'uso-suelo',
      agency: 'municipalidad',
      action: 'issueLandUse',
      label: 'Certificado de uso de suelo',
      labelEn: 'Land-use certificate',
      purpose: 'Emitir certificado de uso de suelo',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        folio: input(ctx).folio,
        municipality: property(ctx).canton,
        projectType: input(ctx).projectType,
        landUse: property(ctx).landUse,
      }),
      legal: {
        status: 'parcial',
        today: 'Varias municipalidades ya emiten el uso de suelo en línea; la mayoría pide el plano catastrado y la certificación registral en papel, aunque el Registro Nacional los tenga.',
        todayEn: 'Several municipalities already issue land use online; most ask for the cadastral plan and the registry certificate on paper even though the Registro Nacional holds them.',
        gap: 'Obligación municipal de leer del Registro Nacional por el bus en vez de pedir copias (Ley 8220 art. 8 con dientes).',
        gapEn: 'A municipal duty to read from the Registro Nacional through the bus instead of asking for copies (Ley 8220 art. 8 with teeth).',
        basis: ['cr-7794', 'cr-8220'],
        model: ['ee-pia', 'br-14129'],
      },
    },
    {
      id: 'cfia',
      agency: 'cfia',
      action: 'reviewPlans',
      label: 'Revisión de planos en APC (CFIA, Salud, Bomberos, AyA, INVU)',
      labelEn: 'Plan review in APC (CFIA, Health, Fire, Water, Housing)',
      purpose: 'Revisar planos constructivos con las instituciones competentes',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        folio: input(ctx).folio,
        projectType: input(ctx).projectType,
        areaM2: input(ctx).areaM2,
        declaredValueCrc: input(ctx).declaredValueCrc,
        professionalLicence: input(ctx).professionalLicence,
        landUseCertificate: (ctx.results['uso-suelo'] as LandUseResponse).certificateNumber,
      }),
      legal: {
        status: 'hoy',
        today: 'Esto ya existe y funciona: el Decreto 36550 obliga a presentar los planos una sola vez en APC y a que las instituciones respondan en plazo. Es la prueba costarricense de que la ventanilla única digital es posible.',
        todayEn: 'This already exists and works: Decree 36550 requires plans to be filed once in APC and institutions to answer within a deadline. Costa Rica\'s own proof that a digital one-stop window is possible.',
        basis: ['cr-36550', 'cr-8220'],
        model: [],
      },
    },
    {
      id: 'permiso',
      agency: 'municipalidad',
      action: 'issueBuildingPermit',
      label: 'Permiso municipal de construcción',
      labelEn: 'Municipal building permit',
      purpose: 'Emitir permiso de construcción y liquidar el impuesto del 1 %',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        folio: input(ctx).folio,
        municipality: property(ctx).canton,
        apcNumber: (ctx.results.cfia as PlanReviewResponse).apcNumber,
        landUseCertificate: (ctx.results['uso-suelo'] as LandUseResponse).certificateNumber,
        declaredValueCrc: input(ctx).declaredValueCrc,
        areaM2: input(ctx).areaM2,
      }),
      legal: {
        status: 'parcial',
        today: 'En 2020, 70 de 82 municipalidades ya emitían el permiso 100 % digital por «APC Municipal»; el resto pide el sello de APC impreso más las certificaciones. El impuesto de hasta el 1 % (Ley 4240 art. 70) se paga en cada municipalidad.',
        todayEn: 'By 2020, 70 of 82 municipalities already issued the permit fully digitally through "APC Municipal"; the rest ask for the printed APC stamp plus certificates. The tax of up to 1 % (Ley 4240 art. 70) is paid at each municipality.',
        gap: 'Hacer obligatoria la conexión municipal a APC y al bus, como la Ley 9986 hizo obligatorio SICOP para las municipalidades.',
        gapEn: 'Make the municipal connection to APC and the bus mandatory, as Ley 9986 made SICOP mandatory for municipalities.',
        basis: ['cr-833', 'cr-36550', 'cr-9986'],
        model: ['ee-pia'],
      },
    },
  ],
  benefits: { tripsAvoided: 5, hoursSaved: 16, costSavedCrc: 120000, daysTraditional: 60, daysDigital: 5 },
  traditional: 'Registro Nacional, catastro, municipalidad (dos veces), CFIA y las instituciones que no estén en APC: entre uno y tres meses.',
  traditionalEn: 'Registro Nacional, cadastre, municipality (twice), CFIA and any institution outside APC: one to three months.',
  consentText:
    'Al continuar, usted autoriza compartir los datos de su finca y de su proyecto con el Registro Nacional, la municipalidad y el CFIA (y a través de APC con Salud, Bomberos, AyA e INVU), únicamente para tramitar el permiso de construcción.',
  inputSchema,
  result: (ctx) => {
    const prop = property(ctx);
    const landUse = ctx.results['uso-suelo'] as LandUseResponse;
    const apc = ctx.results.cfia as PlanReviewResponse;
    const permit = ctx.results.permiso as BuildingPermitResponse;
    const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: '¡Puede empezar a construir!',
      headlineEn: 'You can start building!',
      summary: `Uso de suelo, revisión de planos y permiso municipal de la finca ${prop.folio} resueltos en un solo trámite. Impuesto de construcción liquidado: ${crc(permit.taxCrc)}.`,
      cards: [
        {
          title: 'Finca verificada',
          titleEn: 'Property verified',
          agency: 'registro-nacional',
          exchangeId: id('propiedad'),
          rows: [
            { label: 'Folio real', value: prop.folio },
            { label: 'Ubicación', value: `${prop.district}, ${prop.canton}, ${prop.province}` },
            { label: 'Área', value: `${prop.areaM2.toLocaleString('es-CR')} m²` },
            { label: 'Gravámenes', value: prop.encumbrances.length ? prop.encumbrances.join('; ') : 'Ninguno' },
          ],
        },
        {
          title: 'Uso de suelo',
          titleEn: 'Land use',
          agency: 'municipalidad',
          exchangeId: id('uso-suelo'),
          rows: [
            { label: 'Certificado', value: landUse.certificateNumber },
            { label: 'Uso permitido', value: landUse.allowedUse },
            { label: 'Municipalidad', value: landUse.municipality },
          ],
        },
        {
          title: 'Revisión de planos (APC)',
          titleEn: 'Plan review (APC)',
          agency: 'cfia',
          exchangeId: id('cfia'),
          rows: [
            { label: 'Expediente APC', value: apc.apcNumber },
            { label: 'Profesional', value: apc.professionalLicence },
            ...apc.reviews.map((r) => ({ label: r.institution, value: `${r.result} · ${r.reference}` })),
            { label: 'Timbres CFIA', value: crc(apc.cfiaFeeCrc) },
          ],
        },
        {
          title: 'Permiso de construcción',
          titleEn: 'Building permit',
          agency: 'municipalidad',
          exchangeId: id('permiso'),
          rows: [
            { label: 'Número', value: permit.permitNumber },
            { label: 'Impuesto 1 % (Ley 4240)', value: crc(permit.taxCrc) },
            { label: 'Vence el', value: permit.expiryDate },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'folio', label: 'Titularidad de la finca', source: 'registro-nacional', exchangeId: id('propiedad') },
        { field: 'encumbrances', label: 'Gravámenes', source: 'registro-nacional', exchangeId: id('propiedad') },
        { field: 'canton', label: 'Cantón de la finca', source: 'registro-nacional', exchangeId: id('propiedad') },
        { field: 'landUse', label: 'Uso del suelo registral', source: 'registro-nacional', exchangeId: id('propiedad') },
        { field: 'certificateNumber', label: 'Certificado de uso de suelo', source: 'municipalidad', exchangeId: id('uso-suelo') },
        { field: 'apcNumber', label: 'Expediente APC', source: 'cfia', exchangeId: id('cfia') },
        { field: 'reviews', label: 'Visados de Salud, Bomberos, AyA e INVU', source: 'cfia', exchangeId: id('cfia') },
        { field: 'permitNumber', label: 'Permiso de construcción', source: 'municipalidad', exchangeId: id('permiso') },
      ],
    };
  },
};
