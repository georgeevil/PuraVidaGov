import type { AddressUpdateResponse, TaxResponse } from '@pvg/shared';

export interface Taxpayer extends TaxResponse {
  citizenId: string;
  fullName: string;
  businessName: string;
  businessType: 'natural' | 'legal';
  address: string;
}

/** Latest domicilio fiscal declared by a taxpayer (kept for the demo list; the response never echoes it). */
export interface AddressChange extends AddressUpdateResponse {
  citizenId: string;
  address: string;
  province: string;
  canton: string;
  district: string;
}

const keyOf = (citizenId: string, businessName: string) => `${citizenId}::${businessName.trim().toLowerCase()}`;

class TributacionStore {
  private taxpayers = new Map<string, Taxpayer>();
  private byNite = new Set<string>();
  private addresses = new Map<string, AddressChange>(); // keyed by citizenId

  reset(): void {
    this.taxpayers.clear();
    this.byNite.clear();
    this.addresses.clear();
  }

  saveAddress(a: AddressChange): AddressChange {
    this.addresses.set(a.citizenId, a);
    return a;
  }

  listAddresses(): AddressChange[] {
    return [...this.addresses.values()];
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
