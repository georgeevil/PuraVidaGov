import type { BirthRegistrationResponse, DependentInsuranceResponse, VaccinationRecordResponse } from '@pvg/shared';
import { z } from 'zod';
import type { StepContext, WorkflowSpec } from './types.js';

const inputSchema = z.object({
  childFirstName: z.string().trim().min(1, 'Indique el nombre').max(60),
  childLastName1: z.string().trim().min(1).max(40),
  childLastName2: z.string().trim().min(1).max(40),
  sex: z.enum(['F', 'M']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD'),
  hospital: z.string().trim().min(1, 'Seleccione el hospital'),
  otherParentId: z
    .string()
    .trim()
    .regex(/^\d-\d{4}-\d{4}$/, 'Cédula en formato 0-0000-0000')
    .optional()
    .or(z.literal('')),
});
type Input = z.infer<typeof inputSchema>;
const input = (ctx: StepContext) => ctx.input as Input;
const childName = (ctx: StepContext) => `${input(ctx).childFirstName} ${input(ctx).childLastName1} ${input(ctx).childLastName2}`;

export const newborn: WorkflowSpec = {
  id: 'newborn',
  title: 'Tuve un hijo',
  titleEn: 'I had a child',
  description:
    'Inscriba el nacimiento en el Registro Civil, asegure al bebé en la CCSS y abra su carné de vacunación en un solo paso, desde el hospital o desde la casa.',
  descriptionEn: 'Register the birth, insure the baby with the CCSS and open the vaccination record in one step, from the hospital or from home.',
  available: true,
  agencies: ['registro', 'ccss', 'salud'],
  legal: {
    status: 'parcial',
    today:
      'La mitad ya funciona: los hospitales de la CCSS declaran el nacimiento electrónicamente al TSE y el Registro Civil lo inscribe sin que la familia vaya a una oficina. La otra mitad no: asegurar al bebé como beneficiario exige presentarse en la sucursal de la CCSS con constancia de nacimiento, cédulas y comprobante de domicilio, y el carné de vacunas se abre aparte en el EBAIS.',
    todayEn:
      'Half already works: CCSS hospitals declare the birth electronically to the TSE and the Civil Registry records it without the family visiting an office. The other half does not: insuring the baby as a dependant requires going to a CCSS branch with the birth certificate, ids and proof of address, and the vaccination card is opened separately at the local clinic.',
    gap: 'Que la CCSS tome la inscripción del propio Registro Civil (Ley 8220 art. 2 ya lo permite) y que un mandato de intercambio cubra a la institución autónoma, como en Singapur, donde el registro de nacimiento dispara automáticamente la cuenta de ahorro infantil y el seguro.',
    gapEn: 'Let the CCSS take the registration from the Civil Registry itself (Ley 8220 art. 2 already allows it) and have a sharing mandate cover the autonomous institution, as in Singapore where the birth registration automatically triggers the child account and insurance.',
    basis: ['cr-3504', 'cr-17', 'cr-8220', 'cr-8968'],
    model: ['sg-myinfo', 'sg-psga', 'ee-pia'],
  },
  fields: [
    { name: 'childFirstName', label: 'Nombre del bebé', labelEn: 'Child\'s first name', type: 'text', required: true, placeholder: 'Sofía' },
    {
      name: 'childLastName1',
      label: 'Primer apellido',
      labelEn: 'First surname',
      type: 'text',
      required: true,
      help: 'Normalmente el primer apellido del padre o de la madre, según el orden que la familia elija.',
      helpEn: 'Usually the first surname of the father or the mother, in the order the family chooses.',
    },
    { name: 'childLastName2', label: 'Segundo apellido', labelEn: 'Second surname', type: 'text', required: true },
    {
      name: 'sex',
      label: 'Sexo registral',
      labelEn: 'Registered sex',
      type: 'radio',
      required: true,
      options: [
        { value: 'F', label: 'Femenino' },
        { value: 'M', label: 'Masculino' },
      ],
    },
    { name: 'birthDate', label: 'Fecha de nacimiento', labelEn: 'Date of birth', type: 'date', required: true },
    { name: 'hospital', label: 'Hospital o lugar del parto', labelEn: 'Hospital', type: 'select', required: true, optionsFrom: 'hospitals' },
    {
      name: 'otherParentId',
      label: 'Cédula del otro progenitor (opcional)',
      labelEn: 'Other parent\'s id (optional)',
      type: 'text',
      placeholder: '0-0000-0000',
      help: 'Si la indica, el Registro Civil tomará su nombre y apellidos sin que usted los escriba.',
      helpEn: 'If given, the Civil Registry takes their name from its own records without you typing it.',
    },
  ],
  steps: [
    {
      id: 'registro-nacimiento',
      agency: 'registro',
      action: 'registerBirth',
      label: 'Inscribir el nacimiento en el Registro Civil',
      labelEn: 'Record the birth at the Civil Registry',
      purpose: 'Inscribir nacimiento y asignar cédula al menor',
      data: (ctx) => ({
        parentId: ctx.citizen.id,
        parentFullName: ctx.citizen.fullName,
        otherParentId: input(ctx).otherParentId?.trim() ? input(ctx).otherParentId : undefined,
        childFirstName: input(ctx).childFirstName,
        childLastName1: input(ctx).childLastName1,
        childLastName2: input(ctx).childLastName2,
        birthDate: input(ctx).birthDate,
        hospital: input(ctx).hospital,
        sex: input(ctx).sex,
      }),
      legal: {
        status: 'hoy',
        today: 'Desde hace más de una década los hospitales declaran los nacimientos al TSE por vía electrónica y el Registro Civil asigna la cédula del menor en días; la familia solo firma la declaración en el hospital.',
        todayEn: 'For over a decade hospitals have declared births electronically to the TSE and the Civil Registry assigns the minor\'s id within days; the family only signs the declaration at the hospital.',
        basis: ['cr-3504', 'cr-8454'],
        model: [],
      },
    },
    {
      id: 'ccss',
      agency: 'ccss',
      action: 'insureDependent',
      label: 'Asegurar al bebé como beneficiario en la CCSS',
      labelEn: 'Insure the baby as a dependant with the CCSS',
      purpose: 'Asegurar al recién nacido como beneficiario del progenitor',
      data: (ctx) => ({
        insuredId: ctx.citizen.id,
        dependentId: (ctx.results['registro-nacimiento'] as BirthRegistrationResponse).childId,
        dependentName: childName(ctx),
        relationship: input(ctx).sex === 'F' ? 'hija' : 'hijo',
        birthDate: input(ctx).birthDate,
      }),
      legal: {
        status: 'ley',
        today: 'El aseguramiento de un beneficiario se hace presencialmente en la sucursal de la CCSS con constancia de nacimiento del Registro Civil, cédula del asegurado y comprobante de domicilio: tres documentos que el Estado ya tiene.',
        todayEn: 'Insuring a dependant is done in person at the CCSS branch with the Civil Registry birth certificate, the insured\'s id and a proof of address: three documents the State already holds.',
        gap: 'Un mandato de intercambio de datos que alcance a las instituciones autónomas y designe al Registro Civil como registro base del que la CCSS debe leer, no pedir copias.',
        gapEn: 'A data-sharing mandate reaching the autonomous institutions and designating the Civil Registry as the base registry the CCSS must read from instead of asking for copies.',
        basis: ['cr-17', 'cr-8220'],
        model: ['sg-psga', 'ee-pia'],
      },
    },
    {
      id: 'salud',
      agency: 'salud',
      action: 'openVaccinationRecord',
      label: 'Abrir el carné de vacunación',
      labelEn: 'Open the vaccination record',
      purpose: 'Abrir carné de vacunación en el esquema nacional',
      data: (ctx) => ({
        childId: (ctx.results['registro-nacimiento'] as BirthRegistrationResponse).childId,
        childName: childName(ctx),
        birthDate: input(ctx).birthDate,
        edusId: (ctx.results.ccss as DependentInsuranceResponse).edusId,
      }),
      legal: {
        status: 'parcial',
        today: 'El esquema nacional de vacunación es obligatorio y las dosis se registran en el EDUS, pero el carné se abre cuando la familia llega al EBAIS con el bebé y los papeles. Nada avisa al EBAIS de que nació un niño en su área.',
        todayEn: 'The national vaccination scheme is mandatory and doses are recorded in EDUS, but the record is opened when the family shows up at the clinic with the baby and the papers. Nothing tells the clinic a child was born in its area.',
        gap: 'Un evento de vida «nació un niño» publicado en el bus para que Salud y la CCSS actúen de oficio, como hace LifeSG con la cita pediátrica.',
        gapEn: 'A "child born" life event published on the bus so Health and the CCSS act ex officio, as LifeSG does with the paediatric appointment.',
        basis: ['cr-5395', 'cr-17'],
        model: ['sg-myinfo'],
      },
    },
  ],
  benefits: { tripsAvoided: 3, hoursSaved: 6, costSavedCrc: 25000, daysTraditional: 20, daysDigital: 1 },
  traditional: 'Hospital, Registro Civil por la constancia, sucursal de la CCSS y EBAIS: tres filas con un recién nacido en brazos.',
  traditionalEn: 'Hospital, Civil Registry for the certificate, CCSS branch and local clinic: three queues with a newborn in your arms.',
  consentText:
    'Al continuar, usted autoriza compartir los datos del nacimiento con el Registro Civil, la CCSS y el Ministerio de Salud, únicamente para inscribir, asegurar y vacunar a su hijo o hija.',
  inputSchema,
  result: (ctx) => {
    const birth = ctx.results['registro-nacimiento'] as BirthRegistrationResponse;
    const ccss = ctx.results.ccss as DependentInsuranceResponse;
    const vac = ctx.results.salud as VaccinationRecordResponse;
    const id = (k: string) => ctx.exchangeIds[k];
    return {
      headline: `¡Bienvenida al mundo, ${input(ctx).childFirstName}!`,
      headlineEn: 'Welcome to the world!',
      summary: 'El nacimiento quedó inscrito, el bebé está asegurado y su carné de vacunación ya existe. No tuvo que ir a ninguna oficina.',
      cards: [
        {
          title: 'Inscripción de nacimiento',
          titleEn: 'Birth registration',
          agency: 'registro',
          exchangeId: id('registro-nacimiento'),
          rows: [
            { label: 'Nombre', value: childName(ctx) },
            { label: 'Cédula asignada', value: birth.childId },
            { label: 'Certificado', value: birth.certificateNumber },
            { label: 'Inscrito el', value: birth.registrationDate },
          ],
        },
        {
          title: 'Aseguramiento CCSS',
          titleEn: 'CCSS coverage',
          agency: 'ccss',
          exchangeId: id('ccss'),
          rows: [
            { label: 'Número de beneficiario', value: ccss.beneficiaryNumber },
            { label: 'Expediente EDUS', value: ccss.edusId },
            { label: 'Cubierto desde', value: ccss.coveredFrom },
          ],
        },
        {
          title: 'Carné de vacunación',
          titleEn: 'Vaccination record',
          agency: 'salud',
          exchangeId: id('salud'),
          rows: [
            { label: 'Número de carné', value: vac.recordNumber },
            { label: 'Esquema', value: vac.scheme },
            { label: 'Primera cita', value: vac.firstAppointment },
          ],
        },
      ],
      onceOnly: [
        { field: 'fullName', label: 'Nombre del progenitor', source: 'registro', exchangeId: id('identidad') },
        { field: 'id', label: 'Cédula del progenitor', source: 'registro', exchangeId: id('identidad') },
        { field: 'address', label: 'Domicilio', source: 'registro', exchangeId: id('identidad') },
        { field: 'childId', label: 'Cédula del menor', source: 'registro', exchangeId: id('registro-nacimiento') },
        { field: 'certificateNumber', label: 'Constancia de nacimiento', source: 'registro', exchangeId: id('registro-nacimiento') },
        { field: 'edusId', label: 'Expediente EDUS', source: 'ccss', exchangeId: id('ccss') },
        { field: 'beneficiaryNumber', label: 'Número de beneficiario', source: 'ccss', exchangeId: id('ccss') },
        { field: 'recordNumber', label: 'Carné de vacunación', source: 'salud', exchangeId: id('salud') },
      ],
    };
  },
};
