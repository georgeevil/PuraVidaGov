import type { FinesCheckResponse, LicenceRenewalResponse, MedicalCertificateResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  categories: z.enum(['B1', 'A2,B1', 'B1,C1', 'A1', 'B2']),
  validityYears: z.coerce.number().pipe(z.union([z.literal(2), z.literal(4), z.literal(6)])),
  usesGlasses: z.enum(['si', 'no']),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const crc = (n: number) => `₡${Math.round(n).toLocaleString('es-CR')}`;

export const driverLicense: WorkflowSpec = {
  id: 'driver-license',
  title: 'Renovar licencia de conducir',
  titleEn: 'Renew driving licence',
  description:
    'Dictamen médico digital, verificación de multas y marchamo, y renovación con la fotografía que el Registro Civil ya tiene. Sin cita ni fila.',
  descriptionEn: 'Digital medical certificate, fines and road-tax check, and renewal with the photo the Civil Registry already holds. No appointment, no queue.',
  available: true,
  agencies: ['registro', 'salud', 'cosevi'],
  legal: {
    status: 'parcial',
    today:
      'El dictamen médico ya es digital (SEDIMEC, 180 días de vigencia) y COSEVI muestra multas y estado de la licencia en línea. Pero la renovación sigue siendo presencial en 42 sucursales del BCR y 13 sedes del MOPT, para tomar una fotografía que la cédula ya tiene. En 2026 el MOPT licitó la licencia digital y el examen teórico en línea.',
    todayEn:
      'The medical certificate is already digital (SEDIMEC, valid 180 days) and COSEVI shows fines and licence status online. But renewal is still in person at 42 BCR branches and 13 MOPT offices, to take a photo the cédula already has. In 2026 the MOPT tendered the digital licence and the online theory test.',
    gap: 'Solo un reglamento del MOPT/COSEVI: aceptar el dictamen firmado digitalmente por el bus y reutilizar la fotografía del Registro Civil con la IDC como prueba de identidad remota. No hace falta ley.',
    gapEn: 'Only a MOPT/COSEVI regulation: accept the digitally signed certificate through the bus and reuse the Civil Registry photo with the IDC as remote identity proof. No statute needed.',
    basis: ['cr-9078', 'cr-8454', 'cr-idc'],
    model: ['sg-myinfo', 'eu-eidas2'],
  },
  fields: [
    {
      name: 'categories',
      label: 'Categorías a renovar',
      labelEn: 'Categories to renew',
      type: 'select',
      required: true,
      options: [
        { value: 'B1', label: 'B1 · vehículos livianos' },
        { value: 'A2,B1', label: 'A2 y B1 · motocicleta y liviano' },
        { value: 'B1,C1', label: 'B1 y C1 · liviano y taxi' },
        { value: 'A1', label: 'A1 · motocicleta hasta 125 cc' },
        { value: 'B2', label: 'B2 · carga liviana' },
      ],
    },
    {
      name: 'validityYears',
      label: 'Vigencia',
      labelEn: 'Validity',
      type: 'radio',
      required: true,
      options: [
        { value: '2', label: '2 años' },
        { value: '4', label: '4 años' },
        { value: '6', label: '6 años' },
      ],
    },
    {
      name: 'usesGlasses',
      label: '¿Usa lentes para conducir?',
      labelEn: 'Do you wear glasses to drive?',
      type: 'radio',
      required: true,
      options: [
        { value: 'no', label: 'No' },
        { value: 'si', label: 'Sí' },
      ],
    },
  ],
  steps: [
    {
      id: 'dictamen',
      agency: 'salud',
      action: 'medicalCertificate',
      label: 'Dictamen médico digital (SEDIMEC)',
      labelEn: 'Digital medical certificate (SEDIMEC)',
      purpose: 'Emitir dictamen médico para licencia de conducir',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        dateOfBirth: ctx.citizen.dateOfBirth,
        usesGlasses: input(ctx).usesGlasses === 'si',
      }),
      legal: {
        status: 'hoy',
        today: 'El médico emite el dictamen en línea en SEDIMEC (plataforma del Colegio de Médicos) y COSEVI lo consulta; vale 180 días. En el demo lo simula el mock de Salud.',
        todayEn: 'The doctor issues the certificate online in SEDIMEC (the medical college\'s platform) and COSEVI looks it up; valid 180 days. The demo simulates it in the Health mock.',
        basis: ['cr-9078', 'cr-8454'],
        model: [],
      },
    },
    {
      id: 'multas',
      agency: 'cosevi',
      action: 'checkFines',
      label: 'Verificar multas y marchamo',
      labelEn: 'Check fines and road tax',
      purpose: 'Verificar multas pendientes y marchamo',
      data: (ctx) => ({ citizenId: ctx.citizen.id }),
      legal: {
        status: 'hoy',
        today: 'COSEVI muestra las multas en línea y el marchamo (INS) se consulta por placa; ambos datos ya son digitales.',
        todayEn: 'COSEVI shows fines online and the road tax (INS) is looked up by plate; both are already digital.',
        basis: ['cr-9078'],
        model: [],
      },
    },
    {
      id: 'renovacion',
      agency: 'cosevi',
      action: 'renewLicence',
      label: 'Renovar la licencia',
      labelEn: 'Renew the licence',
      purpose: 'Renovar licencia de conducir',
      data: (ctx) => ({
        citizenId: ctx.citizen.id,
        fullName: ctx.citizen.fullName,
        categories: input(ctx).categories.split(','),
        medicalCertificate: (ctx.results.dictamen as MedicalCertificateResponse).certificateNumber,
        validityYears: input(ctx).validityYears,
      }),
      legal: {
        status: 'parcial',
        today: 'El pago se hace en línea, pero la persona debe presentarse en una sucursal del BCR o sede del MOPT para la fotografía y la entrega del plástico. Desde diciembre de 2025 ya no es obligatorio portar la licencia física.',
        todayEn: 'Payment is online, but the person must go to a BCR branch or MOPT office for the photo and the plastic card. Since December 2025 carrying the physical licence is no longer mandatory.',
        gap: 'Reglamento que admita la fotografía del Registro Civil y la IDC como prueba de identidad remota, y una licencia digital (licitación MOPT 2026).',
        gapEn: 'A regulation admitting the Civil Registry photo and the IDC as remote identity proof, and a digital licence (MOPT tender 2026).',
        basis: ['cr-9078', 'cr-idc'],
        model: ['sg-myinfo', 'eu-eidas2'],
      },
    },
  ],
  benefits: { tripsAvoided: 2, hoursSaved: 4, costSavedCrc: 15000, daysTraditional: 15, daysDigital: 0 },
  traditional: 'Consultorio para el dictamen (ya digital), banco para el pago y sucursal del BCR o sede del MOPT para la foto: una cita que puede tardar semanas.',
  traditionalEn: 'A doctor for the certificate (already digital), a bank for the payment and a BCR branch or MOPT office for the photo: an appointment that can take weeks.',
  consentText:
    'Al continuar, usted autoriza compartir sus datos con el Registro Civil, el médico que emite el dictamen y COSEVI, únicamente para renovar su licencia de conducir.',
  inputSchema,
  result: (ctx) => {
    const med = ctx.results.dictamen as MedicalCertificateResponse;
    const fines = ctx.results.multas as FinesCheckResponse;
    const lic = ctx.results.renovacion as LicenceRenewalResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: 'Su licencia está renovada',
      headlineEn: 'Your licence is renewed',
      summary: `Licencia ${lic.categories.join(' y ')} vigente hasta el ${lic.expiryDate}. Dictamen, multas y fotografía: nada lo tuvo que llevar usted.`,
      cards: [
        {
          title: 'Dictamen médico',
          titleEn: 'Medical certificate',
          agency: 'salud',
          exchangeId: id('dictamen'),
          rows: [
            { label: 'Número', value: med.certificateNumber },
            { label: 'Resultado', value: med.result === 'apto' ? 'Apto' : `Apto con restricciones: ${med.restrictions.join(', ')}` },
            { label: 'Vigente hasta', value: med.validUntil },
          ],
        },
        {
          title: 'Multas y marchamo',
          titleEn: 'Fines and road tax',
          agency: 'cosevi',
          exchangeId: id('multas'),
          rows: [
            { label: 'Multas pendientes', value: String(fines.pendingFines) },
            { label: 'Marchamo', value: fines.marchamoPaid ? 'Al día' : 'Pendiente' },
          ],
        },
        {
          title: 'Licencia renovada',
          titleEn: 'Renewed licence',
          agency: 'cosevi',
          exchangeId: id('renovacion'),
          rows: [
            { label: 'Número', value: lic.licenceNumber },
            { label: 'Categorías', value: lic.categories.join(', ') },
            { label: 'Vence el', value: lic.expiryDate },
            { label: 'Puntos', value: String(lic.points) },
            { label: 'Costo', value: crc(lic.feeCrc) },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'dateOfBirth', label: 'Fecha de nacimiento', source: 'registro', exchangeId: id('identidad') },
        { field: 'photo', label: 'Fotografía de la cédula', source: 'registro', exchangeId: id('identidad') },
        { field: 'certificateNumber', label: 'Dictamen médico', source: 'salud', exchangeId: id('renovacion') },
        { field: 'pendingFines', label: 'Estado de multas', source: 'cosevi', exchangeId: id('multas') },
        { field: 'marchamoPaid', label: 'Marchamo', source: 'cosevi', exchangeId: id('multas') },
      ],
    };
  },
};
