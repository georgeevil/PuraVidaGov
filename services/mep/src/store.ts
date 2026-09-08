import type { SchoolEnrolmentResponse } from '@pvg/shared';

/** Public schools known to this mock (docs/CONTRACTS.md v4 → MEP). Circuit = circuito escolar. */
export interface School {
  name: string;
  canton: string;
  circuit: string;
}

export const SCHOOLS: School[] = [
  { name: 'Escuela Roosevelt', canton: 'Montes de Oca', circuit: '01' },
  { name: 'Escuela Dante Alighieri', canton: 'Montes de Oca', circuit: '01' },
  { name: 'Escuela José Figueres Ferrer', canton: 'Curridabat', circuit: '02' },
  { name: 'Escuela Líder de Cahuita', canton: 'Talamanca', circuit: '07' },
  { name: 'Escuela Central de Grecia', canton: 'Grecia', circuit: '03' },
];

const normalize = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function findSchool(name: string): School | undefined {
  const n = normalize(name);
  return SCHOOLS.find((s) => normalize(s.name) === n);
}

export type Grade = 'materno' | 'transicion' | 'primero' | 'septimo';

export interface Enrolment extends SchoolEnrolmentResponse {
  guardianId: string;
  studentId: string;
  studentName: string;
  birthDate: string;
  vaccinationRecord: string;
  canton: string;
  needsTransport: boolean;
  enrolledAt: string;
}

class MepStore {
  private enrolments = new Map<string, Enrolment>(); // keyed by studentId
  private counters = new Map<number, number>(); // year -> last enrolment sequence

  reset(): void {
    this.enrolments.clear();
    this.counters.clear();
  }

  findEnrolment(studentId: string): Enrolment | undefined {
    return this.enrolments.get(studentId);
  }

  nextSequence(year: number): number {
    const next = (this.counters.get(year) ?? 0) + 1;
    this.counters.set(year, next);
    return next;
  }

  saveEnrolment(e: Enrolment): Enrolment {
    this.enrolments.set(e.studentId, e);
    return e;
  }

  listEnrolments(): Enrolment[] {
    return [...this.enrolments.values()];
  }
}

export const store = new MepStore();
