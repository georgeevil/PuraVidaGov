import { randomBytes, randomInt } from 'node:crypto';

export function exchangeId(): string {
  return 'X-' + randomBytes(6).toString('hex').toUpperCase();
}

export function txnId(): string {
  return 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + randomBytes(3).toString('hex').toUpperCase();
}

/** "3-101-123456" for sociedades, "3-102-…" not used; natural persons get "1-0000-…"-style NITE. */
export function niteFor(businessType: 'natural' | 'legal'): string {
  const seq = String(randomInt(100000, 999999));
  return businessType === 'legal' ? `3-101-${seq}` : `3-002-${seq}`;
}

export function employerNumber(): string {
  return 'E-' + String(randomInt(10000, 99999));
}

export function patenteNumber(year: number, seq: number): string {
  return `P-${year}-${String(seq).padStart(5, '0')}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addYearsIso(iso: string, years: number): string {
  const d = new Date(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}
