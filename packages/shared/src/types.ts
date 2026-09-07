/**
 * Domain types shared by every service. These mirror docs/CONTRACTS.md — change both together.
 * Spanish domain nouns (cédula, patente, NITE) are kept as-is; identifiers are English.
 */

export type AgencyName =
  | 'registro'
  | 'tributacion'
  | 'ccss'
  | 'municipalidad'
  | 'registro-nacional'
  | 'salud'
  | 'cfia';

export const AGENCIES: AgencyName[] = ['registro', 'tributacion', 'ccss', 'municipalidad', 'registro-nacional', 'salud', 'cfia'];

export const AGENCY_LABELS: Record<AgencyName, string> = {
  registro: 'Registro Civil (TSE)',
  tributacion: 'Tributación (Ministerio de Hacienda)',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
  'registro-nacional': 'Registro Nacional',
  salud: 'Ministerio de Salud',
  cfia: 'CFIA (APC)',
};

export const AGENCY_SHORT: Record<AgencyName, string> = {
  registro: 'Registro Civil',
  tributacion: 'Tributación',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
  'registro-nacional': 'Registro Nacional',
  salud: 'Salud',
  cfia: 'CFIA',
};

/** Citizen record held by the simulated Registro Civil. */
export interface Citizen {
  id: string; // cédula, e.g. "1-2345-6789"
  fullName: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
  dateOfBirth: string; // ISO date
  nationality: 'CR';
  address: string;
  province: string;
  canton: string; // municipality that will issue the patente
  district: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  email: string; // simulated, used only to "send" the OTP
  phone: string; // simulated
}

export type BusinessType = 'natural' | 'legal';

export interface BusinessRegistrationRequest {
  citizenId: string;
  businessName: string;
  activityCode: string; // CIIU-like 4-digit code
  businessType: BusinessType;
  address: string;
  municipality: string; // canton name
  estimatedEmployees: number;
}

export interface TaxResponse {
  nite: string; // "3-101-123456"
  taxRegime: 'simplified' | 'traditional';
  status: 'active';
  activityCode: string;
  activityDescription: string;
  registrationDate: string;
}

export interface CcssResponse {
  employerNumber: string; // "E-45678"
  registrationType: 'employer' | 'self-employed';
  registrationDate: string;
  monthlyContributionRateCrc: number;
}

export interface MunicipalityResponse {
  patenteNumber: string; // "P-2026-00987"
  municipality: string;
  issueDate: string;
  expiryDate: string;
  annualFeeCrc: number;
}

/** Where a value on screen came from — the "once-only" provenance badge. */
export interface Provenance<T = unknown> {
  value: T;
  source: AgencyName;
  fetchedAt: string;
  exchangeId: string;
}

// ---------------------------------------------------------------- Bus contract

export interface BusRequest<TData = unknown> {
  service: AgencyName;
  action: string; // e.g. "getCitizen", "createTaxId", "registerEmployer", "issueLicense"
  data: TData;
  /** Who is asking (system id of the consumer, e.g. "portal-ciudadano"). */
  requester: string;
  /** Cédula of the citizen the request is about; used for the audit trail. */
  subjectId: string;
  /** Consent reference given by the citizen for this exchange (PRD §12). */
  consent: { granted: boolean; reference: string };
  /** Free-text purpose shown in the audit viewer. */
  purpose: string;
}

export interface BusSuccess<TData = unknown> {
  ok: true;
  exchangeId: string;
  service: AgencyName;
  action: string;
  data: TData;
  latencyMs: number;
  timestamp: string;
}

export interface BusFailure {
  ok: false;
  exchangeId: string;
  service: AgencyName;
  action: string;
  error: { code: string; message: string; status: number };
  latencyMs: number;
  timestamp: string;
}

export type BusResponse<TData = unknown> = BusSuccess<TData> | BusFailure;

export interface AuditEntry {
  id: string; // exchangeId
  timestamp: string;
  requester: string;
  service: AgencyName;
  action: string;
  subjectId: string;
  purpose: string;
  consent: { granted: boolean; reference: string };
  status: 'ok' | 'error';
  errorCode?: string;
  latencyMs: number;
  /** Names of the top-level fields returned (never the values — data minimisation). */
  fieldsReturned: string[];
}

export interface RegistryEntry {
  service: AgencyName;
  label: string;
  baseUrl: string;
  actions: Record<string, { method: 'GET' | 'POST'; path: string }>;
  healthy?: boolean;
  lastChecked?: string;
}

// ---------------------------------------------------------------- New agency payloads (v2)

/** A property (finca) in the simulated Registro Nacional. */
export interface Property {
  folio: string; // "1-123456-000"
  ownerId: string; // cédula
  province: string;
  canton: string;
  district: string;
  areaM2: number;
  landUse: 'residencial' | 'comercial' | 'mixto' | 'agricola';
  address: string;
  encumbrances: string[]; // gravámenes; empty when clean
}

export interface CompanyResponse {
  cedulaJuridica: string; // "3-101-123456"
  legalName: string;
  registrationDate: string;
  tomo: string;
}

export interface SanitaryPermitResponse {
  permitNumber: string; // "PSF-2026-000123"
  riskGroup: 'A' | 'B' | 'C';
  issueDate: string;
  expiryDate: string;
}

export interface VaccinationRecordResponse {
  recordNumber: string; // "CNV-2026-000123"
  scheme: string; // "Esquema nacional de vacunación"
  firstAppointment: string;
}

export interface PlanReviewResponse {
  apcNumber: string; // "APC-2026-001234"
  professionalLicence: string;
  reviews: Array<{ institution: string; result: 'aprobado' | 'observado'; reference: string }>;
  approvedAreaM2: number;
  cfiaFeeCrc: number;
}

export interface BirthRegistrationResponse {
  childId: string; // cédula of the minor
  certificateNumber: string;
  registrationDate: string;
}

export interface DependentInsuranceResponse {
  beneficiaryNumber: string;
  coveredFrom: string;
  edusId: string;
}

export interface LandUseResponse {
  certificateNumber: string;
  municipality: string;
  allowedUse: string;
  issueDate: string;
}

export interface BuildingPermitResponse {
  permitNumber: string; // "PC-2026-00012"
  municipality: string;
  taxCrc: number; // 1 % of the declared value (Ley 833 / Código Municipal)
  issueDate: string;
  expiryDate: string;
}

export interface AddressUpdateResponse {
  updated: true;
  registry: string;
  effectiveDate: string;
}

// ---------------------------------------------------------------- Legal status (v2)

/** Can this interaction happen in Costa Rica today? */
export type LegalStatus = 'hoy' | 'parcial' | 'ley';

export const LEGAL_STATUS_LABELS: Record<LegalStatus, { es: string; en: string }> = {
  hoy: { es: 'Posible hoy', en: 'Possible today' },
  parcial: { es: 'Parcialmente hoy', en: 'Partially today' },
  ley: { es: 'Requiere ley', en: 'Requires legislation' },
};

export type Jurisdiction = 'CR' | 'EE' | 'SG' | 'EU' | 'UY' | 'BR';

export interface LegalRef {
  id: string;
  jurisdiction: Jurisdiction;
  name: string; // official name
  short: string; // "Ley 8220 art. 2"
  year: number;
  url?: string;
  /** What it does, one sentence, es-CR + en. */
  what: string;
  whatEn: string;
}

export interface LegalNote {
  status: LegalStatus;
  /** What is possible today and on which basis. */
  today: string;
  todayEn: string;
  /** What is missing and which foreign instrument closes the gap. */
  gap?: string;
  gapEn?: string;
  /** Ids into LEGAL_REFS: Costa Rican basis. */
  basis: string[];
  /** Ids into LEGAL_REFS: foreign instruments that would be needed / are the model. */
  model: string[];
}

// ---------------------------------------------------------------- Workflow engine (apps/api, v2)

export type StepStatus = 'pending' | 'running' | 'done' | 'error';

export interface FormOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  labelEn: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'date' | 'textarea';
  required?: boolean;
  options?: FormOption[];
  /** Options fetched at runtime: "activities" | "cantons" | "properties" | "hospitals" | "professionals". */
  optionsFrom?: string;
  /** Default from the citizen record, e.g. "canton" or "address". */
  defaultFromCitizen?: keyof Citizen;
  placeholder?: string;
  help?: string;
  helpEn?: string;
  min?: number;
  max?: number;
}

export interface StepDefinition {
  id: string;
  agency: AgencyName;
  action: string;
  label: string;
  labelEn: string;
  purpose: string;
  legal: LegalNote;
}

export interface WorkflowDefinition {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  available: boolean;
  agencies: AgencyName[];
  /** Legal status of the whole life event as one workflow. */
  legal: LegalNote;
  fields: FormField[];
  steps: StepDefinition[];
  benefits: Benefits;
  /** Traditional process, for the benefits panel: es-CR one-liner. */
  traditional: string;
  traditionalEn: string;
  consentText: string;
}

export interface WorkflowStep {
  id: string;
  agency: AgencyName;
  label: string;
  status: StepStatus;
  /** Steps skipped by a condition (e.g. persona física needs no Registro Nacional). */
  skipped?: boolean;
  startedAt?: string;
  finishedAt?: string;
  exchangeId?: string;
  result?: unknown;
  error?: string;
  legal: LegalNote;
}

export interface Benefits {
  tripsAvoided: number;
  hoursSaved: number;
  costSavedCrc: number;
  /** Calendar days the traditional process takes vs. this one. */
  daysTraditional?: number;
  daysDigital?: number;
}

export interface ResultCard {
  title: string;
  titleEn: string;
  agency: AgencyName;
  exchangeId?: string;
  rows: Array<{ label: string; value: string }>;
}

export interface OnceOnlyEntry {
  field: string;
  label: string;
  source: AgencyName;
  exchangeId: string;
}

export interface WorkflowResult {
  headline: string;
  headlineEn: string;
  summary: string;
  cards: ResultCard[];
  onceOnly: OnceOnlyEntry[];
  benefits: Benefits;
}

export interface WorkflowTransaction {
  txnId: string;
  workflowId: string;
  workflowTitle: string;
  citizenId: string;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  /** The citizen's form input (never includes data fetched from registries). */
  input: Record<string, unknown>;
  steps: WorkflowStep[];
  result?: WorkflowResult;
}
