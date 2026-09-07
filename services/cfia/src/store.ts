import type { PlanReviewResponse } from '@pvg/shared';

export interface Professional {
  licence: string;
  name: string;
  discipline: string;
}

/** Professionals registered with the CFIA (docs/CONTRACTS.md v2). All data is fictitious. */
export const PROFESSIONALS: Professional[] = [
  { licence: 'IC-12345', name: 'Ing. Laura Jiménez Solano', discipline: 'Ingeniería civil' },
  { licence: 'A-23456', name: 'Arq. Daniel Vargas Quesada', discipline: 'Arquitectura' },
  { licence: 'IE-34567', name: 'Ing. Carmen Ulate Brenes', discipline: 'Ingeniería eléctrica' },
];

export function findProfessional(licence: string): Professional | undefined {
  const n = licence.trim().toUpperCase();
  return PROFESSIONALS.find((p) => p.licence === n);
}

export interface PlanReview extends PlanReviewResponse {
  citizenId: string;
  folio: string;
  projectType: 'vivienda' | 'comercial' | 'ampliacion';
  areaM2: number;
  declaredValueCrc: number;
  landUseCertificate: string;
  submittedAt: string;
}

const keyOf = (folio: string, licence: string) => `${folio.trim()}::${licence.trim().toUpperCase()}`;

class CfiaStore {
  private reviews = new Map<string, PlanReview>();
  private counters = new Map<number, number>(); // year -> last sequence

  reset(): void {
    this.reviews.clear();
    this.counters.clear();
  }

  find(folio: string, licence: string): PlanReview | undefined {
    return this.reviews.get(keyOf(folio, licence));
  }

  nextSequence(year: number): number {
    const next = (this.counters.get(year) ?? 0) + 1;
    this.counters.set(year, next);
    return next;
  }

  save(r: PlanReview): PlanReview {
    this.reviews.set(keyOf(r.folio, r.professionalLicence), r);
    return r;
  }

  list(): PlanReview[] {
    return [...this.reviews.values()];
  }
}

export const store = new CfiaStore();
