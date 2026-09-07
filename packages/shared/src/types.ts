/**
 * Domain types shared by every service. These mirror docs/CONTRACTS.md — change both together.
 * Spanish domain nouns (cédula, patente, NITE) are kept as-is; identifiers are English.
 */

export type AgencyName = 'registro' | 'tributacion' | 'ccss' | 'municipalidad';

export const AGENCIES: AgencyName[] = ['registro', 'tributacion', 'ccss', 'municipalidad'];

export const AGENCY_LABELS: Record<AgencyName, string> = {
  registro: 'Registro Civil (TSE)',
  tributacion: 'Tributación (Ministerio de Hacienda)',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
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

// ---------------------------------------------------------------- Workflow (apps/api)

export type StepStatus = 'pending' | 'running' | 'done' | 'error';

export interface WorkflowStep {
  agency: AgencyName;
  label: string;
  status: StepStatus;
  startedAt?: string;
  finishedAt?: string;
  exchangeId?: string;
  /** Agency-specific payload; typed by agency. */
  result?: TaxResponse | CcssResponse | MunicipalityResponse | Citizen;
  error?: string;
}

export interface Benefits {
  tripsAvoided: number;
  hoursSaved: number;
  costSavedCrc: number;
}

export interface WorkflowTransaction {
  txnId: string;
  citizenId: string;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  request: BusinessRegistrationRequest;
  steps: WorkflowStep[];
  result?: {
    citizen: Citizen;
    tax: TaxResponse;
    ccss: CcssResponse;
    municipality: MunicipalityResponse;
    benefits: Benefits;
    /** Which fields were filled from which agency, for the once-only dashboard. */
    onceOnly: Array<{ field: string; label: string; source: AgencyName; exchangeId: string }>;
  };
}
