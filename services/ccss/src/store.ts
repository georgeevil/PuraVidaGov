import type { AddressUpdateResponse, CcssResponse, DependentInsuranceResponse } from '@pvg/shared';

export interface Employer extends CcssResponse {
  nite: string;
  citizenId: string;
  fullName: string;
  businessName: string;
  estimatedEmployees: number;
}

export interface Dependent extends DependentInsuranceResponse {
  insuredId: string;
  dependentId: string;
  dependentName: string;
  relationship: 'hijo' | 'hija' | 'conyuge';
  birthDate: string;
}

/** Latest address declared to SICERE by an insured person (kept for the demo list). */
export interface AddressChange extends AddressUpdateResponse {
  citizenId: string;
  address: string;
  province: string;
  canton: string;
  district: string;
}

class CcssStore {
  private employers = new Map<string, Employer>(); // keyed by NITE
  private numbers = new Set<string>();
  private dependents = new Map<string, Dependent>(); // keyed by dependentId
  private beneficiaryNumbers = new Set<string>();
  private addresses = new Map<string, AddressChange>(); // keyed by citizenId

  reset(): void {
    this.employers.clear();
    this.numbers.clear();
    this.dependents.clear();
    this.beneficiaryNumbers.clear();
    this.addresses.clear();
  }

  findDependent(dependentId: string): Dependent | undefined {
    return this.dependents.get(dependentId);
  }

  hasBeneficiaryNumber(n: string): boolean {
    return this.beneficiaryNumbers.has(n);
  }

  saveDependent(d: Dependent): Dependent {
    this.dependents.set(d.dependentId, d);
    this.beneficiaryNumbers.add(d.beneficiaryNumber);
    return d;
  }

  listDependents(): Dependent[] {
    return [...this.dependents.values()];
  }

  saveAddress(a: AddressChange): AddressChange {
    this.addresses.set(a.citizenId, a);
    return a;
  }

  listAddresses(): AddressChange[] {
    return [...this.addresses.values()];
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
