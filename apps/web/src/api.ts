/**
 * Typed client for the Portal API (docs/CONTRACTS.md §Portal API, v2 routes).
 * Always relative `/api/...` URLs; Bearer token from localStorage "pvg.token".
 * Only `import type` from @pvg/shared so the browser bundle never pulls in Express.
 */
import type {
  Activity,
  AgencyName,
  AuditEntry,
  Benefits,
  Citizen,
  FormOption,
  LegalNote,
  LegalRef,
  RegistryEntry,
  WorkflowDefinition,
  WorkflowTransaction,
} from '@pvg/shared/data';

export const TOKEN_KEY = 'pvg.token';

/**
 * Static deployment (docs/CONTRACTS.md v4 → "Static mode in apps/web"). With `VITE_DEPLOY_MODE=static`
 * the bundle is served by a plain file host with no backend: the read-only public endpoints are answered
 * from `/api-static/*.json` (written by `scripts/build-static-api.mjs`) and everything else fails fast
 * with an `ApiError` whose code is `STATIC_MODE`.
 */
export const IS_STATIC: boolean = import.meta.env.VITE_DEPLOY_MODE === 'static';

/** Absolute URL of the interactive deployment (all-in-one), without a trailing slash; undefined when unset. */
export const PORTAL_URL: string | undefined = (() => {
  const raw = import.meta.env.VITE_PORTAL_URL;
  const trimmed = typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
  return trimmed === '' ? undefined : trimmed;
})();

export interface Provenance {
  source: AgencyName;
  exchangeId: string;
  fetchedAt: string;
}

export interface LoginResponse {
  challengeId: string;
  otp: { channel: string; maskedPhone: string; demoCode: string };
}

export interface OtpResponse {
  token: string;
  citizen: Citizen;
  provenance: Provenance;
}

export interface ProfileResponse {
  citizen: Citizen;
  provenance: Provenance;
}

/** `GET /api/legal` — every instrument plus the legal note of each workflow and step. */
export interface LegalOverview {
  refs: LegalRef[];
  workflows: Array<{
    id: string;
    title: string;
    legal: LegalNote;
    steps: Array<{ id: string; label: string; agency: AgencyName; legal: LegalNote }>;
  }>;
}

/** Shape of zod's `.flatten()` as the API returns it in `error.details` for VALIDATION_ERROR. */
export interface ValidationDetails {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Per-field messages when the server answered VALIDATION_ERROR; empty otherwise. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    const d = this.details as ValidationDetails | undefined;
    if (d && typeof d === 'object' && d.fieldErrors) {
      for (const [k, v] of Object.entries(d.fieldErrors)) if (v && v.length) out[k] = v.join(' ');
    }
    return out;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function toApiError(res: Response): Promise<ApiError> {
  let code = 'HTTP_ERROR';
  let message = `Error ${res.status}`;
  let details: unknown;
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string; details?: unknown } };
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      details = body.error.details;
    }
  } catch {
    /* body was not JSON */
  }
  return new ApiError(res.status, code, message, details);
}

const NETWORK_ERROR = () => new ApiError(0, 'NETWORK', 'No se pudo conectar con el servidor. Intente de nuevo.');

/** Message shown wherever the static build cannot answer: the interactive portal lives elsewhere. */
export const STATIC_MODE_MESSAGE =
  'Esta es la versión estática: solo incluye las páginas públicas. El portal interactivo corre en otro despliegue.';

const staticError = () => new ApiError(501, 'STATIC_MODE', STATIC_MODE_MESSAGE);

/** Read-only endpoints backed by a generated JSON file. */
const STATIC_FILES: Record<string, string> = {
  '/workflows': 'workflows.json',
  '/legal': 'legal.json',
  '/registry': 'registry.json',
  '/benefits': 'benefits.json',
  '/activities': 'activities.json',
};

async function staticJson<T>(file: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api-static/${file}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw NETWORK_ERROR();
  }
  if (!res.ok) throw new ApiError(res.status, 'STATIC_FETCH', `No se pudo cargar ${file} (${res.status}).`);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(0, 'STATIC_FETCH', `El archivo ${file} no es JSON válido.`);
  }
}

/** The static-mode half of `request`: only GETs of the public catalogue resolve. */
async function staticRequest<T>(path: string, init: RequestInit): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'GET') throw staticError();

  const file = STATIC_FILES[path];
  if (file) return staticJson<T>(file);

  // `/workflows/<id>` is resolved client-side from the generated list.
  const match = /^\/workflows\/([^/]+)$/.exec(path);
  if (match) {
    const id = decodeURIComponent(match[1]);
    const all = await staticJson<WorkflowDefinition[]>('workflows.json');
    const found = all.find((w) => w.id === id);
    if (!found) throw new ApiError(404, 'WORKFLOW_NOT_FOUND', 'No existe ese trámite');
    return found as T;
  }

  throw staticError();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (IS_STATIC) return staticRequest<T>(path, init);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw NETWORK_ERROR();
  }
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const enc = encodeURIComponent;

export const api = {
  // ---- session
  login: (id: string, password: string) => post<LoginResponse>('/login', { id, password }),
  loginOtp: (challengeId: string, code: string) => post<OtpResponse>('/login/otp', { challengeId, code }),
  logout: () => post<void>('/logout'),
  profile: () => get<ProfileResponse>('/profile'),

  // ---- catalogue and forms (v2)
  workflows: () => get<WorkflowDefinition[]>('/workflows'),
  workflow: (id: string) => get<WorkflowDefinition>(`/workflows/${enc(id)}`),
  options: (source: string) => get<FormOption[]>(`/options/${enc(source)}`),
  activities: () => get<Activity[]>('/activities'),

  // ---- transactions (v2)
  startWorkflow: (id: string, input: Record<string, unknown>) =>
    post<{ txnId: string }>(`/workflows/${enc(id)}/start`, { input, consent: true }),
  transactions: () => get<WorkflowTransaction[]>('/transactions'),
  transaction: (txnId: string) => get<WorkflowTransaction>(`/transactions/${enc(txnId)}`),
  transactionResult: (txnId: string) => get<WorkflowTransaction>(`/transactions/${enc(txnId)}/result`),
  /** Fetches the PDF with the Bearer header and returns it as a Blob. */
  transactionPdf: async (txnId: string): Promise<Blob> => {
    if (IS_STATIC) throw staticError();
    let res: Response;
    try {
      res = await fetch(`/api/transactions/${enc(txnId)}/pdf`, {
        headers: { Accept: 'application/pdf', ...authHeaders() },
      });
    } catch {
      throw NETWORK_ERROR();
    }
    if (!res.ok) throw await toApiError(res);
    return res.blob();
  },

  // ---- transparency
  legal: () => get<LegalOverview>('/legal'),
  audit: () => get<AuditEntry[]>('/audit'),
  registry: () => get<RegistryEntry[]>('/registry'),
  benefits: () => get<Benefits>('/benefits'),
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
