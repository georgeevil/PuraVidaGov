import type { ScholarshipResponse } from '@pvg/shared';

export type Grade = 'materno' | 'transicion' | 'primero' | 'septimo';

export interface ScholarshipApplication extends ScholarshipResponse {
  guardianId: string;
  studentId: string;
  enrolmentNumber: string;
  grade: Grade;
  householdMonthlyIncomeCrc: number;
  householdSize: number;
  perCapitaIncomeCrc: number;
  appliedAt: string;
}

class ImasStore {
  private applications = new Map<string, ScholarshipApplication>(); // keyed by studentId
  private counters = new Map<number, number>(); // year -> last application sequence

  reset(): void {
    this.applications.clear();
    this.counters.clear();
  }

  findApplication(studentId: string): ScholarshipApplication | undefined {
    return this.applications.get(studentId);
  }

  nextSequence(year: number): number {
    const next = (this.counters.get(year) ?? 0) + 1;
    this.counters.set(year, next);
    return next;
  }

  saveApplication(a: ScholarshipApplication): ScholarshipApplication {
    this.applications.set(a.studentId, a);
    return a;
  }

  listApplications(): ScholarshipApplication[] {
    return [...this.applications.values()];
  }
}

export const store = new ImasStore();
