/**
 * Typed client for the Portal API (docs/CONTRACTS.md §Portal API).
 * Always relative `/api/...` URLs; Bearer token from localStorage "pvg.token".
 * Only `import type` from @pvg/shared so the browser bundle never pulls in Express.
 */
import type {
  Activity,
  AgencyName,
  AuditEntry,
  Benefits,
  BusinessRegistrationRequest,
  Citizen,
  RegistryEntry,
  WorkflowTransaction,
} from '@pvg/shared';

export const TOKEN_KEY = 'pvg.token';

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

export interface ServiceCatalogueEntry {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn?: string;
  available: boolean;
  agencies: AgencyName[];
}

export type RegisterBusinessBody = BusinessRegistrationRequest & { consent: true };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
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
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
    }
  } catch {
    /* body was not JSON */
  }
  return new ApiError(res.status, code, message);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new ApiError(0, 'NETWORK', 'No se pudo conectar con el servidor. Intente de nuevo.');
  }
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  login: (id: string, password: string) => post<LoginResponse>('/login', { id, password }),
  loginOtp: (challengeId: string, code: string) => post<OtpResponse>('/login/otp', { challengeId, code }),
  logout: () => post<void>('/logout'),
  profile: () => get<ProfileResponse>('/profile'),
  services: () => get<ServiceCatalogueEntry[]>('/services'),
  activities: () => get<Activity[]>('/activities'),
  registerBusiness: (body: RegisterBusinessBody) => post<{ txnId: string }>('/business/register', body),
  businessStatus: (txnId: string) => get<WorkflowTransaction>(`/business/status/${encodeURIComponent(txnId)}`),
  businessResult: (txnId: string) => get<WorkflowTransaction>(`/business/result/${encodeURIComponent(txnId)}`),
  /** Fetches the PDF with the Bearer header and returns it as a Blob. */
  businessResultPdf: async (txnId: string): Promise<Blob> => {
    let res: Response;
    try {
      res = await fetch(`/api/business/result/${encodeURIComponent(txnId)}/pdf`, {
        headers: { Accept: 'application/pdf', ...authHeaders() },
      });
    } catch {
      throw new ApiError(0, 'NETWORK', 'No se pudo conectar con el servidor. Intente de nuevo.');
    }
    if (!res.ok) throw await toApiError(res);
    return res.blob();
  },
  audit: () => get<AuditEntry[]>('/audit'),
  registry: () => get<RegistryEntry[]>('/registry'),
  benefits: () => get<Benefits>('/benefits'),
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
