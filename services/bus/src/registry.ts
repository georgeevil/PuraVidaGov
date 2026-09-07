/**
 * Data-driven service registry (docs/CONTRACTS.md → "Bus API"). Base URLs and API keys come from
 * the environment; the action table is the only place that knows agency paths.
 */
import { AGENCY_LABELS, type AgencyName, type RegistryEntry } from '@pvg/shared';

/**
 * One routable action. `path` may contain `:param` segments and a GET action may declare `query`;
 * the router fills both from the request's `data` (docs/CONTRACTS.md v2/v3 → "Bus registry additions").
 */
export interface ActionSpec {
  method: 'GET' | 'POST';
  path: string;
  /** Keys of `data` appended to the URL as a query string (GET actions only). */
  query?: string[];
}

export interface ResolvedAction {
  entry: RegistryEntry;
  method: 'GET' | 'POST';
  path: string;
  query: string[];
  apiKey: string;
}

interface AgencyConfig {
  urlEnv: string;
  defaultUrl: string;
  keyEnv: string;
  defaultKey: string;
  actions: Record<string, ActionSpec>;
}

const AGENCY_CONFIG: Record<AgencyName, AgencyConfig> = {
  registro: {
    urlEnv: 'REGISTRO_URL',
    defaultUrl: 'http://localhost:4001',
    keyEnv: 'REGISTRO_API_KEY',
    defaultKey: 'demo-registro-key',
    actions: {
      getCitizen: { method: 'GET', path: '/registro/citizen/:id' },
      registerBirth: { method: 'POST', path: '/registro/registerBirth' },
      updateAddress: { method: 'POST', path: '/registro/updateAddress' },
    },
  },
  tributacion: {
    urlEnv: 'TRIBUTACION_URL',
    defaultUrl: 'http://localhost:4002',
    keyEnv: 'TRIBUTACION_API_KEY',
    defaultKey: 'demo-tributacion-key',
    actions: {
      createTaxId: { method: 'POST', path: '/tributacion/createTaxId' },
      updateAddress: { method: 'POST', path: '/tributacion/updateAddress' },
    },
  },
  ccss: {
    urlEnv: 'CCSS_URL',
    defaultUrl: 'http://localhost:4003',
    keyEnv: 'CCSS_API_KEY',
    defaultKey: 'demo-ccss-key',
    actions: {
      registerEmployer: { method: 'POST', path: '/ccss/registerEmployer' },
      insureDependent: { method: 'POST', path: '/ccss/insureDependent' },
      updateAddress: { method: 'POST', path: '/ccss/updateAddress' },
      getEmployment: { method: 'GET', path: '/ccss/employment/:citizenId' },
      applyPension: { method: 'POST', path: '/ccss/applyPension' },
      enrollVoluntary: { method: 'POST', path: '/ccss/enrollVoluntary' },
    },
  },
  municipalidad: {
    urlEnv: 'MUNICIPALIDAD_URL',
    defaultUrl: 'http://localhost:4004',
    keyEnv: 'MUNICIPALIDAD_API_KEY',
    defaultKey: 'demo-municipalidad-key',
    actions: {
      issueLicense: { method: 'POST', path: '/municipalidad/issueLicense' },
      issueLandUse: { method: 'POST', path: '/municipalidad/issueLandUse' },
      issueBuildingPermit: { method: 'POST', path: '/municipalidad/issueBuildingPermit' },
      updateAddress: { method: 'POST', path: '/municipalidad/updateAddress' },
    },
  },
  'registro-nacional': {
    urlEnv: 'REGISTRO_NACIONAL_URL',
    defaultUrl: 'http://localhost:4005',
    keyEnv: 'REGISTRO_NACIONAL_API_KEY',
    defaultKey: 'demo-registro-nacional-key',
    actions: {
      listProperties: { method: 'GET', path: '/registro-nacional/properties', query: ['ownerId'] },
      getProperty: { method: 'GET', path: '/registro-nacional/property/:folio' },
      registerCompany: { method: 'POST', path: '/registro-nacional/registerCompany' },
    },
  },
  salud: {
    urlEnv: 'SALUD_URL',
    defaultUrl: 'http://localhost:4006',
    keyEnv: 'SALUD_API_KEY',
    defaultKey: 'demo-salud-key',
    actions: {
      issueSanitaryPermit: { method: 'POST', path: '/salud/issueSanitaryPermit' },
      openVaccinationRecord: { method: 'POST', path: '/salud/openVaccinationRecord' },
      medicalCertificate: { method: 'POST', path: '/salud/medicalCertificate' },
    },
  },
  cfia: {
    urlEnv: 'CFIA_URL',
    defaultUrl: 'http://localhost:4007',
    keyEnv: 'CFIA_API_KEY',
    defaultKey: 'demo-cfia-key',
    actions: {
      reviewPlans: { method: 'POST', path: '/cfia/reviewPlans' },
    },
  },
  supen: {
    urlEnv: 'SUPEN_URL',
    defaultUrl: 'http://localhost:4008',
    keyEnv: 'SUPEN_API_KEY',
    defaultKey: 'demo-supen-key',
    actions: {
      withdrawFcl: { method: 'POST', path: '/supen/withdrawFcl' },
      ropStatement: { method: 'POST', path: '/supen/ropStatement' },
    },
  },
  mtss: {
    urlEnv: 'MTSS_URL',
    defaultUrl: 'http://localhost:4009',
    keyEnv: 'MTSS_API_KEY',
    defaultKey: 'demo-mtss-key',
    actions: {
      registerJobSeeker: { method: 'POST', path: '/mtss/registerJobSeeker' },
    },
  },
  cosevi: {
    urlEnv: 'COSEVI_URL',
    defaultUrl: 'http://localhost:4010',
    keyEnv: 'COSEVI_API_KEY',
    defaultKey: 'demo-cosevi-key',
    actions: {
      checkFines: { method: 'POST', path: '/cosevi/checkFines' },
      renewLicence: { method: 'POST', path: '/cosevi/renewLicence' },
    },
  },
};

function baseUrlFor(cfg: AgencyConfig): string {
  return (process.env[cfg.urlEnv] || cfg.defaultUrl).replace(/\/+$/, '');
}

/** Registry entries, read from the environment on every call so tests can override URLs. */
export function getRegistry(): RegistryEntry[] {
  return (Object.keys(AGENCY_CONFIG) as AgencyName[]).map((service) => {
    const cfg = AGENCY_CONFIG[service];
    return {
      service,
      label: AGENCY_LABELS[service],
      baseUrl: baseUrlFor(cfg),
      actions: Object.fromEntries(Object.entries(cfg.actions).map(([name, a]) => [name, { ...a }])),
    };
  });
}

/** API key the bus presents to a given agency. */
export function apiKeyFor(service: AgencyName): string {
  const cfg = AGENCY_CONFIG[service];
  return process.env[cfg.keyEnv] || cfg.defaultKey;
}

export type ResolveResult =
  | { ok: true; resolved: ResolvedAction }
  | { ok: false; reason: 'UNKNOWN_SERVICE' | 'UNKNOWN_ACTION' };

export function resolve(service: string, action: string): ResolveResult {
  const cfg = (AGENCY_CONFIG as Record<string, AgencyConfig | undefined>)[service];
  if (!cfg) return { ok: false, reason: 'UNKNOWN_SERVICE' };
  const act = cfg.actions[action];
  if (!act) return { ok: false, reason: 'UNKNOWN_ACTION' };
  const entry = getRegistry().find((e) => e.service === service)!;
  return {
    ok: true,
    resolved: { entry, method: act.method, path: act.path, query: act.query ?? [], apiKey: apiKeyFor(service as AgencyName) },
  };
}
