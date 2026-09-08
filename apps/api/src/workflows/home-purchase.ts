import type { Property, PropertyDeclarationResponse, PropertyTransferResponse, TransferTaxResponse } from '@pvg/shared';
import { z } from 'zod';
import { PROPERTIES_FOR_SALE } from '../options.js';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  folio: z.string().trim().min(1, 'Seleccione la propiedad'),
  priceCrc: z.coerce.number().positive('Precio pactado').max(1e13),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const property = (ctx: StepContext) => ctx.results.finca as Property;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const homePurchase: WorkflowSpec = {
  id: 'home-purchase',
  title: 'Compré una casa',
  titleEn: 'I bought a home',
  description:
    'Verifique la finca, pague el impuesto de traspaso, inscriba la escritura y quede declarado como contribuyente de bienes inmuebles en la municipalidad, sin volver a presentar la escritura en ninguna ventanilla.',
  descriptionEn: 'Verify the property, pay the transfer tax, register the deed and be declared as the municipal property-tax payer, without presenting the deed at any window again.',
  available: true,
  agencies: ['registro', 'registro-nacional', 'tributacion', 'municipalidad'],
  legal: {
    status: 'parcial',
    today:
      'La compra es un acto notarial que se inscribe en el Registro de Bienes Inmuebles tras pagar el impuesto de traspaso (Ley 6999) y los timbres. Después, el nuevo dueño debe ir a la municipalidad a declarar el valor del inmueble (Ley 7509) y a AyA, ICE o CNFL a cambiar los servicios a su nombre, aunque el Registro ya sabe quién compró y por cuánto. Detalle de tasas y canales: no verificado contra el texto legal.',
    todayEn:
      'The purchase is a notarial act registered at the Registro de Bienes Inmuebles after paying the transfer tax (Ley 6999) and stamps. Afterwards the new owner must go to the municipality to declare the property value (Ley 7509) and to the water and power utilities to change the services, although the Registro already knows who bought and for how much. Rates and channels: not verified against the legal text.',
    gap: 'Que el Registro Nacional comunique el cambio de dueño a la municipalidad y a las empresas de servicios por el bus (decreto para Hacienda y el Registro; reforma de la Ley 7509 para sustituir la declaración quinquenal por el dato registral; convenios con AyA e ICE, que son autónomos).',
    gapEn: 'Let the Registro Nacional communicate the ownership change to the municipality and the utilities through the bus (a decree for the tax authority and the Registro; a Ley 7509 amendment replacing the five-yearly declaration with the registry record; agreements with the autonomous water and power utilities).',
    basis: ['cr-6999', 'cr-7794', 'cr-8220', 'cr-8454'],
    model: ['ee-pia', 'ru-210fz', 'dk-borger'],
  },
  fields: [
    { name: 'folio', label: 'Propiedad que compra', labelEn: 'Property you are buying', type: 'select', required: true, optionsFrom: 'properties-for-sale', help: 'Lista de demostración; en la vida real escribiría el folio real.', helpEn: 'Demo listing; in real life you would type the folio.' },
    { name: 'priceCrc', label: 'Precio pactado (₡)', labelEn: 'Agreed price (CRC)', type: 'number', required: true, min: 1 },
  ],
  steps: [
    {
      id: 'finca',
      agency: 'registro-nacional',
      action: 'getProperty',
      label: 'Verificar la finca y sus gravámenes en el Registro Nacional',
      labelEn: 'Verify the property and its encumbrances at the Registro Nacional',
      purpose: 'Verificar titularidad y gravámenes de la finca',
      data: (ctx) => ({ folio: input(ctx).folio }),
      legal: { status: 'hoy', today: 'Consulta pública en línea en rnpdigital.com; certificación literal en minutos con firma digital.', todayEn: 'Public online lookup at rnpdigital.com; literal certificate in minutes with a digital signature.', basis: ['cr-8454'], model: [] },
    },
    {
      id: 'impuesto',
      agency: 'tributacion',
      action: 'transferTax',
      label: 'Liquidar el impuesto de traspaso y los timbres en Hacienda',
      labelEn: 'Settle the transfer tax and stamps at the tax authority',
      purpose: 'Liquidar impuesto de traspaso de bien inmueble',
      data: (ctx) => ({ buyerId: ctx.citizen.id, sellerId: property(ctx).ownerId, kind: 'inmueble', reference: input(ctx).folio, priceCrc: input(ctx).priceCrc, fiscalValueCrc: Math.round(input(ctx).priceCrc * 0.8) }),
      legal: {
        status: 'parcial',
        today: 'Ley 6999: el impuesto se paga por entero antes de inscribir; el notario adjunta el comprobante. La tasa (1,5 %) no se verificó contra el texto.',
        todayEn: 'Ley 6999: the tax is paid by deposit before registration; the notary attaches the receipt. The rate (1.5 %) was not verified against the text.',
        gap: 'Liquidación automática dentro de la presentación electrónica del testimonio.',
        gapEn: 'Automatic settlement inside the electronic filing of the deed.',
        basis: ['cr-6999'],
        model: ['ee-pia'],
      },
    },
    {
      id: 'traspaso',
      agency: 'registro-nacional',
      action: 'transferProperty',
      label: 'Inscribir la escritura en el Registro de Bienes Inmuebles',
      labelEn: 'Register the deed at the Registro de Bienes Inmuebles',
      purpose: 'Inscribir traspaso de bien inmueble',
      data: (ctx) => ({ folio: input(ctx).folio, sellerId: property(ctx).ownerId, buyerId: ctx.citizen.id, taxReceipt: (ctx.results.impuesto as TransferTaxResponse).receiptNumber, priceCrc: input(ctx).priceCrc }),
      legal: {
        status: 'parcial',
        today: 'Acto notarial con firma digital; la presentación electrónica del testimonio y los plazos de inscripción no se verificaron.',
        todayEn: 'Notarial act with a digital signature; electronic filing of the deed and registration times were not verified.',
        gap: 'Reglamento de la Junta del Registro Nacional (Ley 5695).',
        gapEn: 'Regulation of the Registro Nacional board (Ley 5695).',
        basis: ['cr-8454', 'cr-6999'],
        model: ['eu-sdg'],
      },
    },
    {
      id: 'declaracion',
      agency: 'municipalidad',
      action: 'declareProperty',
      label: 'Declaración de bienes inmuebles en la municipalidad',
      labelEn: 'Property-tax declaration at the municipality',
      purpose: 'Declarar el inmueble para el impuesto municipal',
      data: (ctx) => ({ citizenId: ctx.citizen.id, folio: input(ctx).folio, municipality: property(ctx).canton, declaredValueCrc: input(ctx).priceCrc, registrationNumber: (ctx.results.traspaso as PropertyTransferResponse).registrationNumber }),
      legal: {
        status: 'ley',
        today: 'Ley 7509: el dueño declara el valor del inmueble cada cinco años ante la municipalidad, en persona en la mayoría de los 84 cantones, con copia de la escritura que el Registro ya inscribió. Artículo y tasa (0,25 %) no verificados contra el texto.',
        todayEn: 'Ley 7509: the owner declares the property value every five years to the municipality, in person in most of the 84 cantons, with a copy of the deed the Registro already registered. Article and rate (0.25 %) not verified against the text.',
        gap: 'Reforma de la Ley 7509 para que la declaración se sustituya por el dato del Registro Nacional recibido por el bus; las municipalidades son autónomas (Constitución art. 170), así que solo una ley las obliga.',
        gapEn: 'A Ley 7509 amendment so the declaration is replaced by the Registro Nacional record received through the bus; municipalities are autonomous (Constitution art. 170), so only a statute binds them.',
        basis: ['cr-6999', 'cr-7794'],
        model: ['ee-pia', 'dk-borger'],
      },
    },
  ],
  benefits: { tripsAvoided: 4, hoursSaved: 10, costSavedCrc: 40000, daysTraditional: 45, daysDigital: 3 },
  traditional: 'Registro Nacional, banco para el entero, notario, municipalidad y las empresas de servicios: un mes y medio y la escritura fotocopiada cuatro veces.',
  traditionalEn: 'Registro Nacional, bank for the deposit, notary, municipality and the utilities: a month and a half and the deed photocopied four times.',
  consentText: 'Al continuar, usted autoriza compartir sus datos y los de la finca con el Registro Nacional, Tributación y la municipalidad, únicamente para inscribir la compra a su nombre.',
  inputSchema,
  result: (ctx) => {
    const p = property(ctx);
    const tax = ctx.results.impuesto as TransferTaxResponse;
    const transfer = ctx.results.traspaso as PropertyTransferResponse;
    const decl = ctx.results.declaracion as PropertyDeclarationResponse;
    const listing = PROPERTIES_FOR_SALE.find((x) => x.folio === p.folio);
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: 'La casa ya está a su nombre',
      headlineEn: 'The home is now in your name',
      summary: `Finca ${p.folio} en ${p.canton} inscrita a su nombre y declarada en la municipalidad. Impuesto y timbres: ${crc(tax.totalCrc)}; impuesto municipal anual: ${crc(decl.annualTaxCrc)}.`,
      cards: [
        { title: 'Finca verificada', titleEn: 'Property verified', agency: 'registro-nacional', exchangeId: id('finca'), rows: [
          { label: 'Folio real', value: p.folio },
          { label: 'Ubicación', value: `${p.district}, ${p.canton}, ${p.province}` },
          { label: 'Área', value: `${p.areaM2.toLocaleString('es-CR')} m²` },
          { label: 'Vendedor', value: listing?.label.split(' · vende ')[1]?.split(' · ')[0] ?? p.ownerId },
          { label: 'Gravámenes', value: p.encumbrances.length ? p.encumbrances.join('; ') : 'Ninguno' },
        ] },
        { title: 'Impuesto de traspaso', titleEn: 'Transfer tax', agency: 'tributacion', exchangeId: id('impuesto'), rows: [
          { label: 'Comprobante', value: tax.receiptNumber },
          { label: 'Base', value: crc(tax.taxableBaseCrc) },
          { label: `Impuesto (${tax.ratePct} %)`, value: crc(tax.taxCrc) },
          { label: 'Timbres', value: crc(tax.stampsCrc) },
          { label: 'Total', value: crc(tax.totalCrc) },
        ] },
        { title: 'Escritura inscrita', titleEn: 'Deed registered', agency: 'registro-nacional', exchangeId: id('traspaso'), rows: [
          { label: 'Asiento', value: transfer.registrationNumber },
          { label: 'Nuevo dueño', value: ctx.citizen.fullName },
          { label: 'Inscrita el', value: transfer.registeredAt },
        ] },
        { title: 'Bienes inmuebles municipales', titleEn: 'Municipal property tax', agency: 'municipalidad', exchangeId: id('declaracion'), rows: [
          { label: 'Municipalidad', value: decl.municipality },
          { label: 'Declaración', value: decl.declarationNumber },
          { label: 'Valor declarado', value: crc(decl.declaredValueCrc) },
          { label: 'Impuesto anual', value: crc(decl.annualTaxCrc) },
          { label: 'Vigente hasta', value: decl.validUntil },
        ] },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre del comprador', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula del comprador', source: 'registro', exchangeId: id('identidad') },
        { field: 'ownerId', label: 'Titularidad del vendedor', source: 'registro-nacional', exchangeId: id('finca') },
        { field: 'encumbrances', label: 'Gravámenes de la finca', source: 'registro-nacional', exchangeId: id('finca') },
        { field: 'receiptNumber', label: 'Comprobante del impuesto → Registro', source: 'tributacion', exchangeId: id('traspaso') },
        { field: 'registrationNumber', label: 'Escritura inscrita → municipalidad', source: 'registro-nacional', exchangeId: id('declaracion') },
      ],
    };
  },
};
