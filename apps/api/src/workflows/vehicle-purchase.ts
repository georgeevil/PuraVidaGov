import type { MarchamoStatusResponse, TransferTaxResponse, Vehicle, VehicleFinesResponse, VehicleTransferResponse } from '@pvg/shared';
import { z } from 'zod';
import { VEHICLES_FOR_SALE } from '../options.js';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  plate: z.string().trim().min(3, 'Seleccione el vehículo'),
  priceCrc: z.coerce.number().positive('Precio pactado').max(1e12),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const vehicle = (ctx: StepContext) => ctx.results.vehiculo as Vehicle;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const vehiclePurchase: WorkflowSpec = {
  id: 'vehicle-purchase',
  title: 'Compré un carro',
  titleEn: 'I bought a car',
  description:
    'Verifique el vehículo en el Registro Nacional, las multas en COSEVI y el marchamo en el INS, pague el impuesto de traspaso en Hacienda e inscriba el traspaso, en un solo trámite y sin copias.',
  descriptionEn: 'Check the vehicle at the Registro Nacional, fines at COSEVI and the road tax at the INS, pay the transfer tax at the tax authority and register the transfer, in one procedure with no copies.',
  available: true,
  agencies: ['registro', 'registro-nacional', 'cosevi', 'ins', 'tributacion'],
  legal: {
    status: 'parcial',
    today:
      'El traspaso es un acto notarial que se inscribe en el Registro de Bienes Muebles con escritura, entero del impuesto de transferencia y timbres «por el valor más alto entre valor contractual y fiscal», marchamo al día y aceptación de gravámenes e infracciones. Cada dato ya es digital en alguna institución: el Registro, COSEVI (multas anotadas), el INS (marchamo) y Hacienda; el comprador o su notario los recopila. Es el servicio más usado de Gosuslugi en Rusia y uno de los 21 procedimientos obligatorios en línea de la Pasarela Digital Única europea.',
    todayEn:
      'The transfer is a notarial act registered at the Registro de Bienes Muebles with the deed, the transfer tax and stamps "on the higher of the contractual and fiscal value", road tax up to date and acceptance of encumbrances and fines. Each item is already digital somewhere: the Registro, COSEVI (annotated fines), the INS (road tax) and the tax authority; the buyer or the notary gathers them. It is Gosuslugi\'s most used service in Russia and one of the 21 mandatory online procedures of the EU Single Digital Gateway.',
    gap: 'Reglamento del Registro Nacional que liquide el impuesto y verifique marchamo y multas por el bus dentro de la presentación electrónica; no hace falta ley salvo para cambiar la tasa.',
    gapEn: 'A Registro Nacional regulation that settles the tax and checks road tax and fines through the bus inside the electronic filing; no statute is needed except to change the rate.',
    basis: ['cr-7088', 'cr-8454', 'cr-9078', 'cr-8220'],
    model: ['ru-210fz', 'eu-sdg', 'ee-pia'],
  },
  fields: [
    {
      name: 'plate',
      label: 'Vehículo que compra',
      labelEn: 'Vehicle you are buying',
      type: 'select',
      required: true,
      optionsFrom: 'vehicles-for-sale',
      help: 'Lista de demostración; en la vida real escribiría la placa.',
      helpEn: 'Demo listing; in real life you would type the plate.',
    },
    { name: 'priceCrc', label: 'Precio pactado (₡)', labelEn: 'Agreed price (CRC)', type: 'number', required: true, min: 1 },
  ],
  steps: [
    {
      id: 'vehiculo',
      agency: 'registro-nacional',
      action: 'getVehicle',
      label: 'Verificar el vehículo y sus gravámenes en el Registro Nacional',
      labelEn: 'Verify the vehicle and its encumbrances at the Registro Nacional',
      purpose: 'Verificar titularidad y gravámenes del vehículo',
      data: (ctx) => ({ plate: input(ctx).plate }),
      legal: {
        status: 'hoy',
        today: 'La consulta de bienes muebles es pública y en línea en rnpdigital.com; muestra dueño, gravámenes e infracciones anotadas.',
        todayEn: 'The movable-property lookup is public and online at rnpdigital.com; it shows owner, encumbrances and annotated fines.',
        basis: ['cr-7088'],
        model: [],
      },
    },
    {
      id: 'multas',
      agency: 'cosevi',
      action: 'checkVehicleFines',
      label: 'Verificar multas pendientes del vehículo en COSEVI',
      labelEn: 'Check the vehicle\'s pending fines at COSEVI',
      purpose: 'Verificar infracciones pendientes por placa',
      data: (ctx) => ({ plate: input(ctx).plate }),
      legal: {
        status: 'parcial',
        today: 'COSEVI muestra las multas por placa en línea y el Registro exige que el comprador las acepte; el comprador las consulta por su cuenta.',
        todayEn: 'COSEVI shows fines by plate online and the Registro requires the buyer to accept them; the buyer checks them on their own.',
        gap: 'Que el Registro las consulte por el bus al presentar el traspaso.',
        gapEn: 'Let the Registro query them through the bus when the transfer is filed.',
        basis: ['cr-9078', 'cr-8220'],
        model: ['ru-210fz'],
      },
    },
    {
      id: 'marchamo',
      agency: 'ins',
      action: 'marchamoStatus',
      label: 'Verificar marchamo y SOA en el INS',
      labelEn: 'Check road tax and SOA at the INS',
      purpose: 'Verificar derechos de circulación y seguro obligatorio',
      data: (ctx) => ({ plate: input(ctx).plate }),
      legal: {
        status: 'hoy',
        today: 'El marchamo (impuesto a la propiedad de vehículos, Ley 7088 art. 9, más el SOA) se paga en línea al INS y el Registro exige que esté al día para inscribir el traspaso. Composición y canales 2026: no verificados.',
        todayEn: 'The road tax (vehicle property tax, Ley 7088 art. 9, plus the SOA) is paid online to the INS and the Registro requires it to be current to register the transfer. 2026 composition and channels: not verified.',
        basis: ['cr-7088', 'cr-9078'],
        model: [],
      },
    },
    {
      id: 'impuesto',
      agency: 'tributacion',
      action: 'transferTax',
      label: 'Liquidar el impuesto de transferencia y los timbres en Hacienda',
      labelEn: 'Settle the transfer tax and stamps at the tax authority',
      purpose: 'Liquidar impuesto de transferencia de vehículo',
      data: (ctx) => ({
        buyerId: ctx.citizen.id,
        sellerId: vehicle(ctx).ownerId,
        kind: 'vehiculo',
        reference: input(ctx).plate,
        priceCrc: input(ctx).priceCrc,
        fiscalValueCrc: vehicle(ctx).fiscalValueCrc,
      }),
      legal: {
        status: 'parcial',
        today: 'El impuesto (Ley 7088 art. 13, sobre el mayor entre precio y valor fiscal) y los timbres se pagan por entero bancario antes de presentar la escritura; el notario lleva el comprobante.',
        todayEn: 'The tax (Ley 7088 art. 13, on the higher of price and fiscal value) and the stamps are paid by bank deposit before the deed is filed; the notary carries the receipt.',
        gap: 'Liquidación automática dentro de la presentación electrónica (resolución de Hacienda + reglamento del Registro).',
        gapEn: 'Automatic settlement inside the electronic filing (tax authority resolution plus Registro regulation).',
        basis: ['cr-7088'],
        model: ['ee-pia'],
      },
    },
    {
      id: 'traspaso',
      agency: 'registro-nacional',
      action: 'transferVehicle',
      label: 'Inscribir el traspaso en el Registro de Bienes Muebles',
      labelEn: 'Register the transfer at the Registro de Bienes Muebles',
      purpose: 'Inscribir traspaso de vehículo',
      data: (ctx) => ({
        plate: input(ctx).plate,
        sellerId: vehicle(ctx).ownerId,
        buyerId: ctx.citizen.id,
        taxReceipt: (ctx.results.impuesto as TransferTaxResponse).receiptNumber,
        priceCrc: input(ctx).priceCrc,
      }),
      legal: {
        status: 'parcial',
        today: 'La escritura la otorga un notario con firma digital; si el Registro ya admite presentación electrónica del testimonio no se pudo verificar. Los gravámenes anotados (prenda) deben levantarse antes.',
        todayEn: 'The deed is granted by a notary with a digital signature; whether the Registro already accepts electronic filing could not be verified. Annotated encumbrances (liens) must be lifted first.',
        gap: 'Reglamento de la Junta Administrativa del Registro Nacional (Ley 5695): presentación electrónica con verificaciones por el bus.',
        gapEn: 'Regulation of the Registro Nacional board (Ley 5695): electronic filing with bus-side checks.',
        basis: ['cr-7088', 'cr-8454'],
        model: ['eu-sdg', 'ru-210fz'],
      },
    },
  ],
  benefits: { tripsAvoided: 4, hoursSaved: 8, costSavedCrc: 35000, daysTraditional: 15, daysDigital: 1 },
  traditional: 'Consulta registral, COSEVI, INS, banco para el entero, notario y Registro Nacional: entre cuatro y seis paradas y dos semanas.',
  traditionalEn: 'Registry lookup, COSEVI, INS, bank for the deposit, notary and Registro Nacional: four to six stops and two weeks.',
  consentText:
    'Al continuar, usted autoriza compartir sus datos y los del vehículo con el Registro Nacional, COSEVI, el INS y Tributación, únicamente para inscribir el traspaso a su nombre.',
  inputSchema,
  result: (ctx) => {
    const v = vehicle(ctx);
    const fines = ctx.results.multas as VehicleFinesResponse;
    const marchamo = ctx.results.marchamo as MarchamoStatusResponse;
    const tax = ctx.results.impuesto as TransferTaxResponse;
    const transfer = ctx.results.traspaso as VehicleTransferResponse;
    const listing = VEHICLES_FOR_SALE.find((x) => x.plate === v.plate);
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: 'El carro ya está a su nombre',
      headlineEn: 'The car is now in your name',
      summary: `${v.make} ${v.model} ${v.year}, placa ${v.plate}, inscrito a su nombre. Impuesto y timbres: ${crc(tax.totalCrc)}. Ninguna copia, ninguna fila.`,
      cards: [
        {
          title: 'Vehículo verificado',
          titleEn: 'Vehicle verified',
          agency: 'registro-nacional',
          exchangeId: id('vehiculo'),
          rows: [
            { label: 'Placa', value: v.plate },
            { label: 'Vehículo', value: `${v.make} ${v.model} ${v.year}` },
            { label: 'Vendedor', value: listing?.label.split(' · vende ')[1]?.split(' · ')[0] ?? v.ownerId },
            { label: 'Valor fiscal', value: crc(v.fiscalValueCrc) },
            { label: 'Gravámenes', value: v.encumbrances.length ? v.encumbrances.join('; ') : 'Ninguno' },
          ],
        },
        {
          title: 'Multas y marchamo',
          titleEn: 'Fines and road tax',
          agency: 'cosevi',
          exchangeId: id('multas'),
          rows: [
            { label: 'Multas pendientes', value: fines.pendingFines ? `${fines.pendingFines} (${crc(fines.pendingAmountCrc)})` : 'Ninguna' },
            { label: `Marchamo ${marchamo.year}`, value: marchamo.paid ? `Al día (${crc(marchamo.amountCrc)})` : 'Pendiente' },
            { label: 'Póliza SOA', value: marchamo.soaPolicy },
          ],
        },
        {
          title: 'Impuesto de transferencia',
          titleEn: 'Transfer tax',
          agency: 'tributacion',
          exchangeId: id('impuesto'),
          rows: [
            { label: 'Comprobante', value: tax.receiptNumber },
            { label: 'Base (mayor entre precio y valor fiscal)', value: crc(tax.taxableBaseCrc) },
            { label: `Impuesto (${tax.ratePct} %)`, value: crc(tax.taxCrc) },
            { label: 'Timbres', value: crc(tax.stampsCrc) },
            { label: 'Total', value: crc(tax.totalCrc) },
          ],
        },
        {
          title: 'Traspaso inscrito',
          titleEn: 'Transfer registered',
          agency: 'registro-nacional',
          exchangeId: id('traspaso'),
          rows: [
            { label: 'Asiento', value: transfer.registrationNumber },
            { label: 'Nuevo dueño', value: ctx.citizen.fullName },
            { label: 'Inscrito el', value: transfer.registeredAt },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre del comprador', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula del comprador', source: 'registro', exchangeId: id('identidad') },
        { field: 'ownerId', label: 'Titularidad del vendedor', source: 'registro-nacional', exchangeId: id('vehiculo') },
        { field: 'encumbrances', label: 'Gravámenes del vehículo', source: 'registro-nacional', exchangeId: id('vehiculo') },
        { field: 'fiscalValueCrc', label: 'Valor fiscal (base del impuesto)', source: 'registro-nacional', exchangeId: id('impuesto') },
        { field: 'pendingFines', label: 'Multas anotadas', source: 'cosevi', exchangeId: id('multas') },
        { field: 'paid', label: 'Marchamo al día', source: 'ins', exchangeId: id('marchamo') },
        { field: 'receiptNumber', label: 'Comprobante del impuesto → Registro', source: 'tributacion', exchangeId: id('traspaso') },
      ],
    };
  },
};
