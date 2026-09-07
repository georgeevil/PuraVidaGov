/** Append-only in-memory audit log. Application code never deletes; `reset()` is for demo/tests only. */
import type { AuditEntry } from '@pvg/shared';

const entries: AuditEntry[] = [];

export function append(entry: AuditEntry): void {
  entries.push(entry);
}

export interface AuditQuery {
  subjectId?: string;
  limit?: number;
}

/** Newest first. Default limit 100. */
export function query(q: AuditQuery = {}): AuditEntry[] {
  const limit = q.limit && q.limit > 0 ? Math.floor(q.limit) : 100;
  const filtered = q.subjectId ? entries.filter((e) => e.subjectId === q.subjectId) : entries;
  return filtered.slice(-limit).reverse();
}

export function size(): number {
  return entries.length;
}

export function reset(): void {
  entries.length = 0;
}
