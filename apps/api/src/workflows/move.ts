import type { AddressUpdateResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  address: z.string().trim().min(5, 'Indique la nueva dirección').max(200),
  province: z.string().trim().min(1),
  canton: z.string().trim().min(1, 'Seleccione el cantón'),
  district: z.string().trim().min(1),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD'),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const payload = (ctx: StepContext) => ({
  citizenId: ctx.citizen.id,
  address: input(ctx).address,
  province: input(ctx).province,
  canton: input(ctx).canton,
  district: input(ctx).district,
  effectiveDate: input(ctx).effectiveDate,
});
const addressLegal = (today: string, todayEn: string, status: 'hoy' | 'parcial' | 'ley', basis: string[]) => ({
  status,
  today,
  todayEn,
  gap: 'Que el Registro Civil sea el registro base del domicilio y las demás instituciones lo lean por el bus, en vez de mantener cuatro direcciones distintas de la misma persona.',
  gapEn: 'Make the Civil Registry the base registry for the address and let the other institutions read it through the bus, instead of keeping four different addresses for the same person.',
  basis,
  model: ['ee-pia', 'sg-myinfo'],
});

export const move: WorkflowSpec = {
  id: 'move',
  title: 'Cambié de domicilio',
  titleEn: 'I moved',
  description:
    'Escriba su nueva dirección una sola vez. El Registro Civil, Tributación, la CCSS y su municipalidad la reciben a la vez; el domicilio electoral, fiscal y patronal quedan actualizados.',
  descriptionEn: 'Type your new address once. The Civil Registry, the tax authority, the CCSS and your municipality receive it at the same time.',
  available: true,
  agencies: ['registro', 'tributacion', 'ccss', 'municipalidad'],
  legal: {
    status: 'ley',
    today:
      'Hoy son cuatro trámites separados que la mayoría de la gente no hace: el domicilio electoral en el TSE (en línea), el domicilio fiscal en TRIBU-CR (en línea), la dirección en la CCSS (presencial) y la del contribuyente municipal (presencial). Resultado: cuatro direcciones distintas de la misma persona y notificaciones que nunca llegan.',
    todayEn:
      'Today these are four separate procedures most people never do: electoral address at the TSE (online), tax domicile in TRIBU-CR (online), address at the CCSS (in person) and at the municipality (in person). Result: four different addresses for the same person and notifications that never arrive.',
    gap: 'Este es el caso más puro de «una sola vez»: exige designar un registro base del domicilio y obligar a las demás instituciones a suscribirse a sus cambios, como el capítulo de bases de datos de la ley estonia. Ninguna norma costarricense lo prevé.',
    gapEn: 'The purest once-only case: it requires designating a base registry for the address and obliging the other institutions to subscribe to its changes, as in the databases chapter of the Estonian law. No Costa Rican rule provides for it.',
    basis: ['cr-3504', 'cr-8220', 'cr-8968'],
    model: ['ee-pia', 'ee-xroad', 'sg-myinfo'],
  },
  fields: [
    { name: 'address', label: 'Nueva dirección (señas)', labelEn: 'New address', type: 'textarea', required: true, placeholder: '100 m norte de la iglesia, casa blanca' },
    { name: 'province', label: 'Provincia', labelEn: 'Province', type: 'select', required: true, options: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'].map((p) => ({ value: p, label: p })) },
    { name: 'canton', label: 'Cantón', labelEn: 'Canton', type: 'select', required: true, optionsFrom: 'cantons' },
    { name: 'district', label: 'Distrito', labelEn: 'District', type: 'text', required: true },
    { name: 'effectiveDate', label: 'Desde cuándo', labelEn: 'Effective date', type: 'date', required: true },
  ],
  steps: [
    {
      id: 'registro',
      agency: 'registro',
      action: 'updateAddress',
      label: 'Actualizar domicilio en el Registro Civil',
      labelEn: 'Update the address at the Civil Registry',
      purpose: 'Actualizar domicilio electoral y registral',
      data: payload,
      legal: addressLegal(
        'El cambio de domicilio electoral ya se hace en línea en el sitio del TSE con la cédula; el TSE es el candidato natural a registro base del domicilio.',
        'The electoral address change is already done online on the TSE site with the id; the TSE is the natural candidate for the base address registry.',
        'hoy',
        ['cr-3504', 'cr-8454'],
      ),
    },
    {
      id: 'tributacion',
      agency: 'tributacion',
      action: 'updateAddress',
      label: 'Actualizar domicilio fiscal en Tributación',
      labelEn: 'Update the tax domicile',
      purpose: 'Actualizar domicilio fiscal',
      data: payload,
      legal: addressLegal(
        'El domicilio fiscal se cambia en TRIBU-CR con firma digital, pero hay que acordarse de hacerlo: Hacienda no se entera del cambio en el TSE.',
        'The tax domicile is changed in TRIBU-CR with a digital signature, but you have to remember to do it: the tax authority does not learn of the change at the TSE.',
        'parcial',
        ['cr-8454', 'cr-8220'],
      ),
    },
    {
      id: 'ccss',
      agency: 'ccss',
      action: 'updateAddress',
      label: 'Actualizar dirección en la CCSS',
      labelEn: 'Update the address at the CCSS',
      purpose: 'Actualizar dirección del asegurado',
      data: payload,
      legal: addressLegal(
        'La dirección del asegurado se actualiza presencialmente en la sucursal, con comprobante de domicilio. Determina a qué EBAIS pertenece la persona.',
        'The insured\'s address is updated in person at the branch, with proof of address. It determines which local clinic the person belongs to.',
        'ley',
        ['cr-17', 'cr-8220'],
      ),
    },
    {
      id: 'municipalidad',
      agency: 'municipalidad',
      action: 'updateAddress',
      label: 'Actualizar contribuyente en la municipalidad',
      labelEn: 'Update the municipal taxpayer record',
      purpose: 'Actualizar dirección del contribuyente municipal',
      data: payload,
      legal: addressLegal(
        'Cada municipalidad lleva su propio padrón de contribuyentes; al mudarse de cantón la persona simplemente desaparece de uno y no aparece en el otro hasta que va en persona.',
        'Each municipality keeps its own taxpayer roll; when someone moves canton they simply vanish from one and do not appear in the other until they go in person.',
        'ley',
        ['cr-7794', 'cr-8220'],
      ),
    },
  ],
  benefits: { tripsAvoided: 2, hoursSaved: 4, costSavedCrc: 15000, daysTraditional: 10, daysDigital: 0 },
  traditional: 'TSE en línea, TRIBU-CR en línea, sucursal de la CCSS y plataforma de servicios municipal: dos filas y dos comprobantes de domicilio.',
  traditionalEn: 'TSE online, TRIBU-CR online, CCSS branch and the municipal service desk: two queues and two proofs of address.',
  consentText:
    'Al continuar, usted autoriza comunicar su nueva dirección al Registro Civil, Tributación, la CCSS y la municipalidad, únicamente para actualizar su domicilio.',
  inputSchema,
  result: (ctx) => {
    const id = (k: string) => ctx.exchangeIds[k];
    const upd = (k: string) => ctx.results[k] as AddressUpdateResponse;
    const card = (k: string, agency: 'registro' | 'tributacion' | 'ccss' | 'municipalidad', title: string, titleEn: string) => ({
      title,
      titleEn,
      agency,
      exchangeId: id(k),
      rows: [
        { label: 'Registro', value: upd(k).registry },
        { label: 'Vigente desde', value: upd(k).effectiveDate },
        { label: 'Estado', value: 'Actualizado' },
      ],
    });
    const full = `${input(ctx).address}, ${input(ctx).district}, ${input(ctx).canton}, ${input(ctx).province}`;
    return {
      headline: 'Su domicilio quedó actualizado en todo el Estado',
      headlineEn: 'Your address is updated across the State',
      summary: `Escribió la dirección una vez («${full}») y cuatro instituciones la recibieron con la misma fecha de vigencia.`,
      cards: [
        card('registro', 'registro', 'Registro Civil', 'Civil Registry'),
        card('tributacion', 'tributacion', 'Tributación', 'Tax authority'),
        card('ccss', 'ccss', 'CCSS', 'CCSS'),
        card('municipalidad', 'municipalidad', 'Municipalidad', 'Municipality'),
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'previousAddress', label: 'Dirección anterior', source: 'registro', exchangeId: id('identidad') },
        { field: 'address', label: 'Nueva dirección → Tributación', source: 'registro', exchangeId: id('tributacion') },
        { field: 'address', label: 'Nueva dirección → CCSS', source: 'registro', exchangeId: id('ccss') },
        { field: 'address', label: 'Nueva dirección → Municipalidad', source: 'registro', exchangeId: id('municipalidad') },
      ],
    };
  },
};
