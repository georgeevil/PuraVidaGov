import type { JobSeekerResponse } from '@pvg/shared';

export interface JobSeeker extends JobSeekerResponse {
  citizenId: string;
  fullName: string;
  canton: string;
  lastOccupation: string;
  desiredArea: string;
  terminationDate: string;
}

class MtssStore {
  private seekers = new Map<string, JobSeeker>(); // keyed by citizenId
  private counters = new Map<number, number>(); // year -> last sequence

  reset(): void {
    this.seekers.clear();
    this.counters.clear();
  }

  find(citizenId: string): JobSeeker | undefined {
    return this.seekers.get(citizenId);
  }

  nextSequence(year: number): number {
    const next = (this.counters.get(year) ?? 0) + 1;
    this.counters.set(year, next);
    return next;
  }

  save(s: JobSeeker): JobSeeker {
    this.seekers.set(s.citizenId, s);
    return s;
  }

  list(): JobSeeker[] {
    return [...this.seekers.values()];
  }
}

export const store = new MtssStore();
