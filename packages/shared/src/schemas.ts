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
  service: z.enum(['registro', 'tributacion', 'ccss', 'municipalidad']),
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
