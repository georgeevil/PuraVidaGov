import type { CivilStatusUpdateResponse, DependentInsuranceResponse, MarriageRegistrationResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  spouseId: z.string().trim().regex(/^\d-\d{4}-\d{4}$/, 'Cédula en formato 0-0000-0000'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD'),
  regime: z.enum(['gananciales', 'separacion']),
  notary: z.string().trim().min(3, 'Indique el notario o juzgado').max(80),
  insureSpouse: z.enum(['si', 'no']),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const marriageOf = (ctx: StepContext) => ctx.results.matrimonio as MarriageRegistrationResponse;

export const marriage: WorkflowSpec = {
  id: 'marriage',
  title: 'Me caso',
  titleEn: 'I am getting married',
  description:
    'El notario inscribe el matrimonio en el TSE; con esa sola inscripción, su cónyuge queda asegurado en la CCSS y su estado civil se actualiza en Hacienda, sin certificaciones ni filas.',
  descriptionEn: 'The notary registers the marriage at the TSE; from that single registration your spouse is insured at the CCSS and your civil status is updated at the tax authority, with no certificates and no queues.',
  available: true,
  agencies: ['registro', 'ccss', 'tributacion'],
  legal: {
    status: 'parcial',
    today:
      'El matrimonio civil lo celebra un notario o un juez y lo inscribe el TSE (Código de Familia; Ley 3504). Asegurar al cónyuge en la CCSS es un trámite aparte («Protección familiar»), y Hacienda y los bancos se enteran del nuevo estado civil solo si la persona lo declara. El divorcio por mutuo acuerdo ante notario todavía no existe: el proyecto 23.982 se aprobó en primer debate el 21 de abril de 2026.',
    todayEn:
      'Civil marriage is celebrated by a notary or a judge and registered by the TSE (Family Code; Ley 3504). Insuring the spouse at the CCSS is a separate procedure ("family protection"), and the tax authority and banks learn the new status only if the person declares it. Divorce by mutual agreement before a notary does not exist yet: bill 23.982 passed first debate on 21 April 2026.',
    gap: 'Reglamento del TSE para la inscripción electrónica por el notario, reglamento de la CCSS para asegurar al cónyuge de oficio, decreto para que Hacienda consulte el padrón, y la ley 23.982 para el divorcio notarial. Estonia ya deja presentar la solicitud de matrimonio en línea sin que ambos estén presentes.',
    gapEn: 'A TSE regulation for electronic filing by the notary, a CCSS regulation to insure the spouse ex officio, a decree so the tax authority queries the register, and bill 23.982 for notarial divorce. Estonia already lets the marriage application be filed online without both present.',
    basis: ['cr-5476', 'cr-3504', 'cr-17', 'cr-8220'],
    model: ['ee-sundmusteenused', 'sg-myinfo', 'dk-borger'],
  },
  fields: [
    { name: 'spouseId', label: 'Cédula de su futuro cónyuge', labelEn: 'Cédula of your future spouse', type: 'text', required: true, placeholder: '1-1111-2222', help: 'Demo: Diego Alonso Solano Vega, 1-1111-2222.', helpEn: 'Demo: Diego Alonso Solano Vega, 1-1111-2222.' },
    { name: 'date', label: 'Fecha de la boda', labelEn: 'Wedding date', type: 'date', required: true },
    { name: 'regime', label: 'Régimen patrimonial', labelEn: 'Property regime', type: 'radio', required: true, options: [ { value: 'gananciales', label: 'Gananciales (régimen legal por defecto)' }, { value: 'separacion', label: 'Separación de bienes (capitulaciones)' } ] },
    { name: 'notary', label: 'Notario o juzgado que celebra', labelEn: 'Officiating notary or court', type: 'text', required: true, placeholder: 'Lic. Ana Mora, notaria pública' },
    { name: 'insureSpouse', label: '¿Asegurar a su cónyuge como beneficiario en la CCSS?', labelEn: 'Insure your spouse as a CCSS dependant?', type: 'radio', required: true, options: [ { value: 'si', label: 'Sí' }, { value: 'no', label: 'No, ya tiene seguro propio' } ] },
  ],
  steps: [
    {
      id: 'matrimonio',
      agency: 'registro',
      action: 'registerMarriage',
      label: 'Inscribir el matrimonio en el Registro Civil',
      labelEn: 'Register the marriage at the Civil Registry',
      purpose: 'Inscribir matrimonio civil celebrado ante notario',
      data: (ctx) => ({ spouseAId: ctx.citizen.id, spouseBId: input(ctx).spouseId, date: input(ctx).date, regime: input(ctx).regime, notary: input(ctx).notary }),
      legal: {
        status: 'parcial',
        today: 'El notario levanta el acta y la remite al TSE para inscripción; si la remisión ya es electrónica no se pudo verificar (las páginas del TSE están tras un bloqueo de robots).',
        todayEn: 'The notary draws up the record and sends it to the TSE for registration; whether the filing is already electronic could not be verified (TSE pages sit behind a bot-manager).',
        gap: 'Reglamento del TSE: inscripción electrónica con firma digital del notario.',
        gapEn: 'A TSE regulation: electronic filing with the notary\'s digital signature.',
        basis: ['cr-5476', 'cr-3504', 'cr-8454'],
        model: ['ee-sundmusteenused'],
      },
    },
    {
      id: 'ccss',
      agency: 'ccss',
      action: 'insureDependent',
      label: 'Asegurar al cónyuge como beneficiario en la CCSS',
      labelEn: 'Insure the spouse as a CCSS dependant',
      purpose: 'Asegurar al cónyuge por protección familiar',
      when: (ctx) => input(ctx).insureSpouse === 'si',
      data: (ctx) => ({ insuredId: ctx.citizen.id, dependentId: input(ctx).spouseId, dependentName: `Cónyuge ${input(ctx).spouseId}`, relationship: 'conyuge', birthDate: ctx.citizen.dateOfBirth }),
      legal: {
        status: 'parcial',
        today: 'La CCSS ofrece la «Solicitud de aseguramiento por protección familiar» y verifica el vínculo contra el TSE, pero la persona debe solicitarlo. Requisitos específicos del cónyuge: no verificados.',
        todayEn: 'The CCSS offers the "family protection insurance application" and checks the link against the TSE, but the person must request it. Spouse-specific requirements: not verified.',
        gap: 'Reglamento del Seguro de Salud que ofrezca el aseguramiento de oficio al recibir el matrimonio por el bus, con base legal de intercambio.',
        gapEn: 'A Health Insurance regulation offering coverage ex officio when the marriage arrives through the bus, with a legal basis for exchange.',
        basis: ['cr-17', 'cr-8220'],
        model: ['sg-psga', 'ee-pia'],
      },
    },
    {
      id: 'hacienda',
      agency: 'tributacion',
      action: 'updateCivilStatus',
      label: 'Actualizar el estado civil en Tributación',
      labelEn: 'Update civil status at the tax authority',
      purpose: 'Actualizar estado civil en el RUT',
      data: (ctx) => ({ citizenId: ctx.citizen.id, maritalStatus: 'married', certificate: marriageOf(ctx).certificateNumber }),
      legal: {
        status: 'parcial',
        today: 'El estado civil se cambia en TRIBU-CR si la persona se acuerda; Hacienda no consulta el padrón del TSE de oficio.',
        todayEn: 'Civil status is changed in TRIBU-CR if the person remembers; the tax authority does not query the TSE register ex officio.',
        gap: 'Un decreto que ordene a Hacienda leer el estado civil del padrón por el bus.',
        gapEn: 'A decree ordering the tax authority to read civil status from the register through the bus.',
        basis: ['cr-8220', 'cr-8454'],
        model: ['ee-pia'],
      },
    },
  ],
  benefits: { tripsAvoided: 3, hoursSaved: 5, costSavedCrc: 20000, daysTraditional: 30, daysDigital: 8 },
  traditional: 'TSE por las certificaciones de estado civil, notario, sucursal de la CCSS, TRIBU-CR y el banco: tres filas para decir lo mismo.',
  traditionalEn: 'TSE for the civil-status certificates, notary, CCSS branch, TRIBU-CR and the bank: three queues to say the same thing.',
  consentText: 'Al continuar, ambos contrayentes autorizan al Registro Civil a comunicar el matrimonio a la CCSS y a Tributación, únicamente para asegurar al cónyuge y actualizar el estado civil.',
  inputSchema,
  result: (ctx) => {
    const m = marriageOf(ctx);
    const ins = ctx.results.ccss as DependentInsuranceResponse | undefined;
    const hac = ctx.results.hacienda as CivilStatusUpdateResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: '¡Felicidades! Su matrimonio quedó inscrito en todo el Estado',
      headlineEn: 'Congratulations! Your marriage is registered across the State',
      summary: `Matrimonio ${m.certificateNumber} inscrito el ${m.date} bajo régimen de ${m.regime === 'gananciales' ? 'gananciales' : 'separación de bienes'}; ${ins ? 'su cónyuge quedó asegurado en la CCSS y ' : ''}su estado civil está actualizado en Hacienda.`,
      cards: [
        { title: 'Inscripción del matrimonio', titleEn: 'Marriage registration', agency: 'registro', exchangeId: id('matrimonio'), rows: [
          { label: 'Certificado', value: m.certificateNumber },
          { label: 'Contrayentes', value: `${m.spouseAId} y ${m.spouseBId}` },
          { label: 'Fecha', value: m.date },
          { label: 'Régimen', value: m.regime === 'gananciales' ? 'Gananciales' : 'Separación de bienes' },
        ] },
        ...(ins ? [{ title: 'Aseguramiento del cónyuge', titleEn: 'Spouse coverage', agency: 'ccss' as const, exchangeId: id('ccss'), rows: [
          { label: 'Número de beneficiario', value: ins.beneficiaryNumber },
          { label: 'Expediente EDUS', value: ins.edusId },
          { label: 'Cubierto desde', value: ins.coveredFrom },
        ] }] : []),
        { title: 'Estado civil en Tributación', titleEn: 'Civil status at the tax authority', agency: 'tributacion', exchangeId: id('hacienda'), rows: [
          { label: 'Registro', value: hac.registry },
          { label: 'Estado civil', value: 'Casado/a' },
        ] },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'maritalStatus', label: 'Estado civil previo (soltería)', source: 'registro', exchangeId: id('identidad') },
        { field: 'spouse', label: 'Identidad del cónyuge', source: 'registro', exchangeId: id('matrimonio') },
        ...(ins ? [{ field: 'certificateNumber', label: 'Vínculo matrimonial → CCSS', source: 'registro' as const, exchangeId: id('ccss') }] : []),
        { field: 'certificateNumber', label: 'Vínculo matrimonial → Tributación', source: 'registro', exchangeId: id('hacienda') },
      ],
    };
  },
};
