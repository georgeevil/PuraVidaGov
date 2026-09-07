/**
 * Data-driven service registry (docs/CONTRACTS.md → "Bus API"). Base URLs and API keys come from
 * the environment; the action table is the only place that knows agency paths.
 */
import { AGENCY_LABELS, type AgencyName, type RegistryEntry } from '@pvg/shared';

export interface ResolvedAction {
  entry: RegistryEntry;
  method: 'GET' | 'POST';
  path: string;
  apiKey: string;
}

interface AgencyConfig {
  urlEnv: string;
  defaultUrl: string;
  keyEnv: string;
  defaultKey: string;
  actions: Record<string, { method: 'GET' | 'POST'; path: string }>;
}

const AGENCY_CONFIG: Record<AgencyName, AgencyConfig> = {
  registro: {
    urlEnv: 'REGISTRO_URL',
    defaultUrl: 'http://localhost:4001',
    keyEnv: 'REGISTRO_API_KEY',
    defaultKey: 'demo-registro-key',
    actions: { getCitizen: { method: 'GET', path: '/registro/citizen/:id' } },
  },
  tributacion: {
    urlEnv: 'TRIBUTACION_URL',
    defaultUrl: 'http://localhost:4002',
    keyEnv: 'TRIBUTACION_API_KEY',
    defaultKey: 'demo-tributacion-key',
    actions: { createTaxId: { method: 'POST', path: '/tributacion/createTaxId' } },
  },
  ccss: {
    urlEnv: 'CCSS_URL',
    defaultUrl: 'http://localhost:4003',
    keyEnv: 'CCSS_API_KEY',
    defaultKey: 'demo-ccss-key',
    actions: { registerEmployer: { method: 'POST', path: '/ccss/registerEmployer' } },
  },
  municipalidad: {
    urlEnv: 'MUNICIPALIDAD_URL',
    defaultUrl: 'http://localhost:4004',
    keyEnv: 'MUNICIPALIDAD_API_KEY',
    defaultKey: 'demo-municipalidad-key',
    actions: { issueLicense: { method: 'POST', path: '/municipalidad/issueLicense' } },
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
      actions: { ...cfg.actions },
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
  return { ok: true, resolved: { entry, method: act.method, path: act.path, apiKey: apiKeyFor(service as AgencyName) } };
}
