import type { SanitaryPermitResponse, VaccinationRecordResponse } from '@pvg/shared';

export interface SanitaryPermit extends SanitaryPermitResponse {
  citizenId: string;
  taxId: string;
  businessName: string;
  activityCode: string;
  address: string;
  municipality: string;
}

export interface VaccinationRecord extends VaccinationRecordResponse {
  childId: string;
  childName: string;
  birthDate: string;
  edusId: string;
}

class SaludStore {
  private permits = new Map<string, SanitaryPermit>(); // keyed by taxId
  private records = new Map<string, VaccinationRecord>(); // keyed by childId
  private permitCounters = new Map<number, number>(); // year -> last sequence
  private recordCounters = new Map<number, number>();

  reset(): void {
    this.permits.clear();
    this.records.clear();
    this.permitCounters.clear();
    this.recordCounters.clear();
  }

  findPermit(taxId: string): SanitaryPermit | undefined {
    return this.permits.get(taxId);
  }

  nextPermitSequence(year: number): number {
    const next = (this.permitCounters.get(year) ?? 0) + 1;
    this.permitCounters.set(year, next);
    return next;
  }

  savePermit(p: SanitaryPermit): SanitaryPermit {
    this.permits.set(p.taxId, p);
    return p;
  }

  listPermits(): SanitaryPermit[] {
    return [...this.permits.values()];
  }

  findRecord(childId: string): VaccinationRecord | undefined {
    return this.records.get(childId);
  }

  nextRecordSequence(year: number): number {
    const next = (this.recordCounters.get(year) ?? 0) + 1;
    this.recordCounters.set(year, next);
    return next;
  }

  saveRecord(r: VaccinationRecord): VaccinationRecord {
    this.records.set(r.childId, r);
    return r;
  }

  listRecords(): VaccinationRecord[] {
    return [...this.records.values()];
  }
}

export const store = new SaludStore();
