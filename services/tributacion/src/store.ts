import type { TaxResponse } from '@pvg/shared';

export interface Taxpayer extends TaxResponse {
  citizenId: string;
  fullName: string;
  businessName: string;
  businessType: 'natural' | 'legal';
  address: string;
}

const keyOf = (citizenId: string, businessName: string) => `${citizenId}::${businessName.trim().toLowerCase()}`;

class TributacionStore {
  private taxpayers = new Map<string, Taxpayer>();
  private byNite = new Set<string>();

  reset(): void {
    this.taxpayers.clear();
    this.byNite.clear();
  }

  find(citizenId: string, businessName: string): Taxpayer | undefined {
    return this.taxpayers.get(keyOf(citizenId, businessName));
  }

  hasNite(nite: string): boolean {
    return this.byNite.has(nite);
  }

  save(t: Taxpayer): Taxpayer {
    this.taxpayers.set(keyOf(t.citizenId, t.businessName), t);
    this.byNite.add(t.nite);
    return t;
  }

  list(): Taxpayer[] {
    return [...this.taxpayers.values()];
  }
}

export const store = new TributacionStore();
