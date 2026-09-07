import { z } from 'zod';

export const cedulaSchema = z
  .string()
  .regex(/^\d-\d{4}-\d{4}$/, 'La cédula debe tener el formato 0-0000-0000');

export const businessRegistrationSchema = z.object({
  citizenId: cedulaSchema,
  businessName: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120),
  activityCode: z.string().regex(/^\d{4}$/, 'Código de actividad de 4 dígitos'),
  businessType: z.enum(['natural', 'legal']),
  address: z.string().trim().min(5).max(200),
  municipality: z.string().trim().min(2).max(60),
  estimatedEmployees: z.number().int().min(0).max(500),
});

export const busRequestSchema = z.object({
  service: z.enum(['registro', 'tributacion', 'ccss', 'municipalidad', 'registro-nacional', 'salud', 'cfia', 'supen', 'mtss', 'cosevi']),
  action: z.string().min(1),
  data: z.unknown(),
  requester: z.string().min(1),
  subjectId: z.string().min(1),
  consent: z.object({ granted: z.boolean(), reference: z.string().min(1) }),
  purpose: z.string().min(1),
});

export const loginSchema = z.object({
  id: cedulaSchema,
  password: z.string().min(1),
});

export const otpSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export const createTaxIdSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  businessName: z.string().min(1),
  activityCode: z.string().regex(/^\d{4}$/),
  businessType: z.enum(['natural', 'legal']),
  address: z.string().min(1),
});

export const registerEmployerSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  nite: z.string().min(1),
  businessName: z.string().min(1),
  estimatedEmployees: z.number().int().min(0),
});

export const issueLicenseSchema = z.object({
  citizenId: cedulaSchema,
  nite: z.string().min(1),
  businessName: z.string().min(1),
  activityCode: z.string().regex(/^\d{4}$/),
  address: z.string().min(1),
  municipality: z.string().min(1),
});

// ---------------------------------------------------------------- v2 agency actions

export const registerCompanySchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  legalName: z.string().min(3).max(120),
  activityCode: z.string().regex(/^\d{4}$/),
  address: z.string().min(1),
});

export const issueSanitaryPermitSchema = z.object({
  citizenId: cedulaSchema,
  taxId: z.string().min(1), // NITE or cédula jurídica
  businessName: z.string().min(1),
  activityCode: z.string().regex(/^\d{4}$/),
  address: z.string().min(1),
  municipality: z.string().min(1),
});

export const registerBirthSchema = z.object({
  parentId: cedulaSchema,
  parentFullName: z.string().min(1),
  otherParentId: cedulaSchema.optional(),
  childFirstName: z.string().min(1).max(60),
  childLastName1: z.string().min(1).max(40),
  childLastName2: z.string().min(1).max(40),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hospital: z.string().min(1),
  sex: z.enum(['F', 'M']),
});

export const insureDependentSchema = z.object({
  insuredId: cedulaSchema, // the parent
  dependentId: z.string().min(1), // the minor's new cédula
  dependentName: z.string().min(1),
  relationship: z.enum(['hijo', 'hija', 'conyuge']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const openVaccinationRecordSchema = z.object({
  childId: z.string().min(1),
  childName: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  edusId: z.string().min(1),
});

export const reviewPlansSchema = z.object({
  citizenId: cedulaSchema,
  folio: z.string().min(1),
  projectType: z.enum(['vivienda', 'comercial', 'ampliacion']),
  areaM2: z.number().positive().max(100000),
  declaredValueCrc: z.number().positive(),
  professionalLicence: z.string().min(1),
  landUseCertificate: z.string().min(1),
});

export const issueLandUseSchema = z.object({
  citizenId: cedulaSchema,
  folio: z.string().min(1),
  municipality: z.string().min(1),
  projectType: z.enum(['vivienda', 'comercial', 'ampliacion']),
  landUse: z.string().min(1),
});

export const issueBuildingPermitSchema = z.object({
  citizenId: cedulaSchema,
  folio: z.string().min(1),
  municipality: z.string().min(1),
  apcNumber: z.string().min(1),
  landUseCertificate: z.string().min(1),
  declaredValueCrc: z.number().positive(),
  areaM2: z.number().positive(),
});

export const updateAddressSchema = z.object({
  citizenId: cedulaSchema,
  address: z.string().min(5).max(200),
  province: z.string().min(1),
  canton: z.string().min(1),
  district: z.string().min(1),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ---------------------------------------------------------------- v3 agency actions

export const applyPensionSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  modality: z.enum(['vejez', 'anticipada']),
  iban: z.string().regex(/^CR\d{20}$/, 'IBAN costarricense: CR + 20 dígitos'),
});

export const enrollVoluntarySchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  declaredIncomeCrc: z.number().int().min(0),
});

export const withdrawFclSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  employerNumber: z.string().min(1),
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  iban: z.string().regex(/^CR\d{20}$/),
});

export const ropStatementSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  modality: z.enum(['retiro-programado', 'renta-permanente']),
  pensionApplication: z.string().min(1),
});

export const registerJobSeekerSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  canton: z.string().min(1),
  lastOccupation: z.string().min(2).max(80),
  desiredArea: z.string().min(2).max(80),
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const medicalCertificateSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usesGlasses: z.boolean(),
});

export const checkFinesSchema = z.object({
  citizenId: cedulaSchema,
});

export const renewLicenceSchema = z.object({
  citizenId: cedulaSchema,
  fullName: z.string().min(1),
  categories: z.array(z.enum(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'])).min(1),
  medicalCertificate: z.string().min(1),
  validityYears: z.union([z.literal(2), z.literal(4), z.literal(6)]),
});
