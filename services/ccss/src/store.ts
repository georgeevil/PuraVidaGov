import type { CcssResponse } from '@pvg/shared';

export interface Employer extends CcssResponse {
  nite: string;
  citizenId: string;
  fullName: string;
  businessName: string;
  estimatedEmployees: number;
}

class CcssStore {
  private employers = new Map<string, Employer>(); // keyed by NITE
  private numbers = new Set<string>();

  reset(): void {
    this.employers.clear();
    this.numbers.clear();
  }

  findByNite(nite: string): Employer | undefined {
    return this.employers.get(nite);
  }

  hasNumber(n: string): boolean {
    return this.numbers.has(n);
  }

  save(e: Employer): Employer {
    this.employers.set(e.nite, e);
    this.numbers.add(e.employerNumber);
    return e;
  }

  list(): Employer[] {
    return [...this.employers.values()];
  }
}

export const store = new CcssStore();
