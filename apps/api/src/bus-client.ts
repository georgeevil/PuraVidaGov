import type { AuditEntry, BusRequest, BusResponse, RegistryEntry } from '@pvg/shared';
import { config } from './config.js';

export const REQUESTER = 'portal-ciudadano';

function headers(): Record<string, string> {
  return { 'content-type': 'application/json', 'x-api-key': config.busApiKey };
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.busTimeoutMs);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends a request through the interoperability bus. Never throws on an agency error: the bus
 * answers with `ok:false` and we hand that back. Throws only when the bus itself is unreachable
 * or answers something that is not a BusResponse.
 */
export async function busRequest<T>(req: Omit<BusRequest, 'requester'>): Promise<BusResponse<T>> {
  const body: BusRequest = { ...req, requester: REQUESTER };
  let res: Response;
  try {
    res = await withTimeout((signal) =>
      fetch(`${config.busUrl}/bus/request`, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal }),
    );
  } catch (err) {
    throw new Error(`BUS_UNAVAILABLE: no se pudo contactar al bus de interoperabilidad (${(err as Error).message})`);
  }
  const json = (await res.json().catch(() => null)) as BusResponse<T> | { error?: { code?: string; message?: string } } | null;
  if (json && typeof json === 'object' && 'ok' in json) return json as BusResponse<T>;
  const code = (json as { error?: { code?: string } } | null)?.error?.code ?? `HTTP_${res.status}`;
  const message = (json as { error?: { message?: string } } | null)?.error?.message ?? 'Respuesta inválida del bus';
  throw new Error(`${code}: ${message}`);
}

export async function busAudit(subjectId: string, limit = 100): Promise<AuditEntry[]> {
  const url = new URL(`${config.busUrl}/bus/audit`);
  url.searchParams.set('subjectId', subjectId);
  url.searchParams.set('limit', String(limit));
  const res = await withTimeout((signal) => fetch(url, { headers: headers(), signal }));
  if (!res.ok) throw new Error(`BUS_AUDIT_FAILED: HTTP ${res.status}`);
  return (await res.json()) as AuditEntry[];
}

export async function busRegistry(): Promise<RegistryEntry[]> {
  const res = await withTimeout((signal) => fetch(`${config.busUrl}/bus/registry`, { headers: headers(), signal }));
  if (!res.ok) throw new Error(`BUS_REGISTRY_FAILED: HTTP ${res.status}`);
  return (await res.json()) as RegistryEntry[];
}

/** Asks the bus to reset itself and cascade the reset to every agency. */
export async function busReset(): Promise<void> {
  const res = await withTimeout((signal) => fetch(`${config.busUrl}/__demo/reset`, { method: 'POST', headers: headers(), signal }));
  if (!res.ok) throw new Error(`BUS_RESET_FAILED: HTTP ${res.status}`);
}
