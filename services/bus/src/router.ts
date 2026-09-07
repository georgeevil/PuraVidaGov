/** Forwards a BusRequest to the agency that owns it, mapping errors and auditing every exchange. */
import { createLogger, exchangeId, type AuditEntry, type BusRequest, type BusResponse } from '@pvg/shared';
import { append } from './audit.js';
import { resolve } from './registry.js';

const log = createLogger('bus');

export interface ForwardOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface AgencyErrorBody {
  error?: { code?: string; message?: string };
}

function statusFromReason(reason: 'UNKNOWN_SERVICE' | 'UNKNOWN_ACTION'): { status: number; message: string } {
  return reason === 'UNKNOWN_SERVICE'
    ? { status: 404, message: 'Servicio no registrado en el bus' }
    : { status: 404, message: 'Acción no registrada para este servicio' };
}

function field(data: unknown, key: string): unknown {
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>)[key] : undefined;
}

/**
 * Fills `:param` segments (e.g. `/registro/citizen/:id`, `/registro-nacional/property/:folio`) and the
 * declared `query` keys (e.g. `?ownerId=`) from `data`. Only GET actions carry data in the URL; POST
 * actions send it as the JSON body.
 */
export function buildUrl(baseUrl: string, path: string, method: 'GET' | 'POST', data: unknown, query: string[] = []): string {
  let p = path;
  if (method === 'GET') {
    p = p.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => encodeURIComponent(String(field(data, name) ?? '')));
    const qs = new URLSearchParams();
    for (const key of query) {
      const v = field(data, key);
      if (v !== undefined && v !== null) qs.set(key, String(v));
    }
    const encoded = qs.toString();
    if (encoded) p += (p.includes('?') ? '&' : '?') + encoded;
  }
  return baseUrl + p;
}

function topLevelKeys(payload: unknown): string[] {
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? Object.keys(payload as object) : [];
}

export async function forward(req: BusRequest, opts: ForwardOptions = {}): Promise<BusResponse> {
  const id = exchangeId();
  const started = Date.now();
  const timeoutMs = opts.timeoutMs ?? 5000;
  const fetchImpl = opts.fetchImpl ?? fetch;

  const finish = (
    result:
      | { ok: true; data: unknown; status: number }
      | { ok: false; status: number; code: string; message: string },
  ): BusResponse => {
    const latencyMs = Date.now() - started;
    const timestamp = new Date().toISOString();
    const entry: AuditEntry = {
      id,
      timestamp,
      requester: req.requester,
      service: req.service,
      action: req.action,
      subjectId: req.subjectId,
      purpose: req.purpose,
      consent: { granted: req.consent.granted, reference: req.consent.reference },
      status: result.ok ? 'ok' : 'error',
      latencyMs,
      fieldsReturned: result.ok ? topLevelKeys(result.data) : [],
    };
    if (!result.ok) entry.errorCode = result.code;
    append(entry);
    log.info('exchange', { exchangeId: id, service: req.service, action: req.action, status: entry.status, code: entry.errorCode, latencyMs });

    if (result.ok) {
      return { ok: true, exchangeId: id, service: req.service, action: req.action, data: result.data, latencyMs, timestamp };
    }
    return {
      ok: false,
      exchangeId: id,
      service: req.service,
      action: req.action,
      error: { code: result.code, message: result.message, status: result.status },
      latencyMs,
      timestamp,
    };
  };

  const r = resolve(req.service, req.action);
  if (!r.ok) {
    const { status, message } = statusFromReason(r.reason);
    return finish({ ok: false, status, code: r.reason, message });
  }

  if (!req.consent.granted) {
    return finish({
      ok: false,
      status: 403,
      code: 'CONSENT_REQUIRED',
      message: 'El intercambio requiere el consentimiento de la persona titular de los datos',
    });
  }

  const { entry, method, path, query, apiKey } = r.resolved;
  const url = buildUrl(entry.baseUrl, path, method, req.data, query);
  const headers: Record<string, string> = { 'x-api-key': apiKey, accept: 'application/json' };
  const init: RequestInit = { method, headers, signal: AbortSignal.timeout(timeoutMs) };
  if (method === 'POST') {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(req.data ?? {});
  }

  let res: Response;
  try {
    res = await fetchImpl(url, init);
  } catch (err) {
    log.warn('agency unreachable', { service: req.service, url, error: (err as Error)?.message });
    return finish({ ok: false, status: 502, code: 'AGENCY_UNAVAILABLE', message: 'La institución no está disponible en este momento' });
  }

  let body: unknown = null;
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (res.ok) {
    return finish({ ok: true, status: res.status, data: body });
  }
  const errBody = (body ?? {}) as AgencyErrorBody;
  return finish({
    ok: false,
    status: res.status,
    code: errBody.error?.code ?? 'AGENCY_ERROR',
    message: errBody.error?.message ?? `La institución respondió con estado ${res.status}`,
  });
}
