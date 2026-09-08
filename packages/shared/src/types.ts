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
  | 'cfia'
  | 'supen'
  | 'mtss'
  | 'cosevi'
  | 'ins'
  | 'mep'
  | 'imas';

export const AGENCIES: AgencyName[] = [
  'registro',
  'tributacion',
  'ccss',
  'municipalidad',
  'registro-nacional',
  'salud',
  'cfia',
  'supen',
  'mtss',
  'cosevi',
  'ins',
  'mep',
  'imas',
];

export const AGENCY_LABELS: Record<AgencyName, string> = {
  registro: 'Registro Civil (TSE)',
  tributacion: 'Tributación (Ministerio de Hacienda)',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
  'registro-nacional': 'Registro Nacional',
  salud: 'Ministerio de Salud',
  cfia: 'CFIA (APC)',
  supen: 'Operadora de pensiones (SUPEN)',
  mtss: 'Ministerio de Trabajo (ANE)',
  cosevi: 'COSEVI (MOPT)',
  ins: 'INS (marchamo y SOA)',
  mep: 'Ministerio de Educación Pública',
  imas: 'IMAS (SINIRUBE)',
};

export const AGENCY_SHORT: Record<AgencyName, string> = {
  registro: 'Registro Civil',
  tributacion: 'Tributación',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
  'registro-nacional': 'Registro Nacional',
  salud: 'Salud',
  cfia: 'CFIA',
  supen: 'Operadora (SUPEN)',
  mtss: 'MTSS',
  cosevi: 'COSEVI',
  ins: 'INS',
  mep: 'MEP',
  imas: 'IMAS',
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
  /** Cédula of the spouse, when married (v4). */
  spouseId?: string;
  /** Cédulas of minor children (v4). */
  children?: string[];
  /** Set by the Registro Civil when a death is inscribed (v4). */
  deceased?: { date: string; certificateNumber: string };
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
  actions: Record<string, { method: 'GET' | 'POST'; path: string; query?: string[] }>;
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

// ---------------------------------------------------------------- v3 payloads (job loss, retirement, licence)

/** CCSS employment / contribution record of a worker. */
export interface EmploymentRecord {
  citizenId: string;
  employerName: string;
  employerNumber: string;
  startDate: string;
  endDate?: string; // set when the employer reported the termination
  lastSalaryCrc: number;
  /** IVM contributions (cuotas) on record. */
  contributions: number;
  status: 'activo' | 'cesado';
}

export interface PensionApplicationResponse {
  applicationNumber: string; // "IVM-2026-000123"
  regime: 'IVM';
  contributions: number;
  monthlyPensionCrc: number;
  firstPaymentDate: string;
  status: 'aprobada' | 'en-estudio';
}

export interface VoluntaryInsuranceResponse {
  policyNumber: string; // "AV-2026-000123"
  monthlyPremiumCrc: number;
  coveredFrom: string;
}

export interface FclWithdrawalResponse {
  requestNumber: string; // "FCL-2026-000123"
  balanceCrc: number;
  paymentDate: string;
  operator: string;
}

export interface RopStatementResponse {
  operator: string;
  balanceCrc: number;
  modality: 'retiro-programado' | 'renta-permanente';
  monthlyPaymentCrc: number;
  firstPaymentDate: string;
}

export interface JobSeekerResponse {
  registrationNumber: string; // "ANE-2026-000123"
  platform: string;
  trainingOffer: string; // INA course suggestion
  firstAppointment: string;
}

export interface MedicalCertificateResponse {
  certificateNumber: string; // "SEDIMEC-2026-000123"
  result: 'apto' | 'apto-con-restricciones';
  restrictions: string[];
  validUntil: string;
}

export interface FinesCheckResponse {
  pendingFines: number;
  pendingAmountCrc: number;
  marchamoPaid: boolean;
}

export interface LicenceRenewalResponse {
  licenceNumber: string;
  categories: string[];
  issueDate: string;
  expiryDate: string;
  points: number;
  feeCrc: number;
}

// ---------------------------------------------------------------- v4 payloads (death, vehicle, home, marriage, school)

export interface Vehicle {
  plate: string; // "BCR-123"
  ownerId: string;
  make: string;
  model: string;
  year: number;
  fiscalValueCrc: number;
  encumbrances: string[];
}

export interface DeathRegistrationResponse {
  certificateNumber: string; // "DEF-2026-000123"
  deceasedId: string;
  deceasedName: string;
  date: string;
  registeredAt: string;
  /** SEDIMEC electronic certificate id from the hospital. */
  medicalCertificate: string;
}

export interface SurvivorPensionResponse {
  applicationNumber: string; // "IVM-SV-2026-000123"
  beneficiary: 'viudez' | 'orfandad';
  monthlyPensionCrc: number;
  firstPaymentDate: string;
  status: 'aprobada' | 'en-estudio';
}

export interface BeneficiaryPayoutResponse {
  requestNumber: string; // "ROP-BEN-2026-000123"
  operator: string;
  ropBalanceCrc: number;
  fclBalanceCrc: number;
  paymentDate: string;
}

export interface EstateResponse {
  properties: Array<{ folio: string; canton: string; areaM2: number }>;
  vehicles: Array<{ plate: string; make: string; model: string; year: number }>;
  companies: Array<{ cedulaJuridica: string; legalName: string }>;
  /** Annotation placed on every asset: "sucesión abierta". */
  annotation: string;
}

export interface VehicleFinesResponse {
  plate: string;
  pendingFines: number;
  pendingAmountCrc: number;
}

export interface MarchamoStatusResponse {
  plate: string;
  year: number;
  paid: boolean;
  amountCrc: number;
  soaPolicy: string; // "SOA-2026-000123"
}

export interface TransferTaxResponse {
  receiptNumber: string; // "HAC-2026-000123"
  taxableBaseCrc: number;
  ratePct: number;
  taxCrc: number;
  stampsCrc: number;
  totalCrc: number;
}

export interface VehicleTransferResponse {
  plate: string;
  newOwnerId: string;
  registrationNumber: string; // "BM-2026-000123"
  registeredAt: string;
}

export interface PropertyTransferResponse {
  folio: string;
  newOwnerId: string;
  registrationNumber: string; // "BI-2026-000123"
  registeredAt: string;
}

export interface PropertyDeclarationResponse {
  municipality: string;
  declarationNumber: string; // "DBI-2026-00012"
  declaredValueCrc: number;
  annualTaxCrc: number; // 0.25 %
  validUntil: string; // + 5 years
}

export interface MarriageRegistrationResponse {
  certificateNumber: string; // "MAT-2026-000123"
  spouseAId: string;
  spouseBId: string;
  date: string;
  regime: 'gananciales' | 'separacion';
}

export interface CivilStatusUpdateResponse {
  updated: true;
  registry: string;
  maritalStatus: string;
}

export interface SchoolEnrolmentResponse {
  enrolmentNumber: string; // "MEP-2026-000123"
  school: string;
  grade: string;
  circuit: string;
  startDate: string;
  services: string[]; // e.g. ["Comedor (PANEA)", "Transporte estudiantil"]
}

export interface ScholarshipResponse {
  applicationNumber: string; // "IMAS-2026-000123"
  programme: 'Crecemos' | 'Avancemos';
  eligible: boolean;
  monthlyAmountCrc: number;
  basis: string; // "SINIRUBE: ingreso per cápita bajo la línea de pobreza"
}

// ---------------------------------------------------------------- Legal status (v2)

/** Can this interaction happen in Costa Rica today? */
export type LegalStatus = 'hoy' | 'parcial' | 'ley';

export const LEGAL_STATUS_LABELS: Record<LegalStatus, { es: string; en: string }> = {
  hoy: { es: 'Posible hoy', en: 'Possible today' },
  parcial: { es: 'Parcialmente hoy', en: 'Partially today' },
  ley: { es: 'Requiere ley', en: 'Requires legislation' },
};

export type Jurisdiction = 'CR' | 'EE' | 'SG' | 'EU' | 'UY' | 'BR' | 'RU' | 'NO' | 'DK' | 'SE' | 'FI';

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
