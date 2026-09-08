import type {
  AddressUpdateResponse,
  CcssResponse,
  DependentInsuranceResponse,
  EmploymentRecord,
  PensionApplicationResponse,
  SurvivorPensionResponse,
  VoluntaryInsuranceResponse,
} from '@pvg/shared';

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

/** Employment records reported by employers to SICERE (fictional seed, docs/CONTRACTS.md v3 → CCSS). */
const SEED_EMPLOYMENT: EmploymentRecord[] = [
  {
    citizenId: '1-2345-6789', // María
    employerName: 'Consultores Tica S.A.',
    employerNumber: 'E-30001',
    startDate: '2015-03-01',
    endDate: '2026-08-31',
    lastSalaryCrc: 950000,
    contributions: 138,
    status: 'cesado',
  },
  {
    citizenId: '7-0123-0456', // José
    employerName: 'Hotel Cahuita Ltda.',
    employerNumber: 'E-30002',
    startDate: '1990-06-01',
    lastSalaryCrc: 720000,
    contributions: 434,
    status: 'activo',
  },
  {
    citizenId: '2-0987-0654', // Ana
    employerName: 'Café Grecia S.A.',
    employerNumber: 'E-30003',
    startDate: '2020-01-15',
    lastSalaryCrc: 610000,
    contributions: 80,
    status: 'activo',
  },
  {
    citizenId: '7-0100-0300', // Luis (v4) — dies in the bereavement demo; his record backs the survivor pension
    employerName: 'Cooperativa de Cacao Talamanca R.L.',
    employerNumber: 'E-30004',
    startDate: '1985-01-15',
    lastSalaryCrc: 680000,
    contributions: 480,
    status: 'activo',
  },
];

/** Pensión por viudez/orfandad (v4). */
export interface SurvivorPension extends SurvivorPensionResponse {
  survivorId: string;
  deceasedId: string;
  relationship: 'conyuge' | 'hijo';
  deathCertificate: string;
  iban: string;
  applicationDate: string;
}

const survivorKeyOf = (survivorId: string, deceasedId: string) => `${survivorId}::${deceasedId}`;

export interface PensionApplication extends PensionApplicationResponse {
  citizenId: string;
  fullName: string;
  dateOfBirth: string;
  modality: 'vejez' | 'anticipada';
  iban: string;
  applicationDate: string;
}

export interface VoluntaryInsurance extends VoluntaryInsuranceResponse {
  citizenId: string;
  fullName: string;
  declaredIncomeCrc: number;
}

class CcssStore {
  private employment = new Map<string, EmploymentRecord>(); // keyed by citizenId
  private pensions = new Map<string, PensionApplication>(); // keyed by citizenId
  private pensionCounters = new Map<number, number>(); // year -> last sequence
  private voluntary = new Map<string, VoluntaryInsurance>(); // keyed by citizenId
  private voluntaryCounters = new Map<number, number>();
  private survivorPensions = new Map<string, SurvivorPension>(); // keyed by (survivorId, deceasedId)
  private survivorCounters = new Map<number, number>();
  private employers = new Map<string, Employer>(); // keyed by NITE
  private numbers = new Set<string>();
  private dependents = new Map<string, Dependent>(); // keyed by dependentId
  private beneficiaryNumbers = new Set<string>();
  private addresses = new Map<string, AddressChange>(); // keyed by citizenId

  constructor() {
    this.reset();
  }

  reset(): void {
    this.employment = new Map(SEED_EMPLOYMENT.map((e) => [e.citizenId, { ...e }]));
    this.pensions.clear();
    this.pensionCounters.clear();
    this.voluntary.clear();
    this.voluntaryCounters.clear();
    this.survivorPensions.clear();
    this.survivorCounters.clear();
    this.employers.clear();
    this.numbers.clear();
    this.dependents.clear();
    this.beneficiaryNumbers.clear();
    this.addresses.clear();
  }

  findEmployment(citizenId: string): EmploymentRecord | undefined {
    return this.employment.get(citizenId);
  }

  listEmployment(): EmploymentRecord[] {
    return [...this.employment.values()];
  }

  findPension(citizenId: string): PensionApplication | undefined {
    return this.pensions.get(citizenId);
  }

  nextPensionSequence(year: number): number {
    const next = (this.pensionCounters.get(year) ?? 0) + 1;
    this.pensionCounters.set(year, next);
    return next;
  }

  savePension(p: PensionApplication): PensionApplication {
    this.pensions.set(p.citizenId, p);
    return p;
  }

  listPensions(): PensionApplication[] {
    return [...this.pensions.values()];
  }

  findSurvivorPension(survivorId: string, deceasedId: string): SurvivorPension | undefined {
    return this.survivorPensions.get(survivorKeyOf(survivorId, deceasedId));
  }

  nextSurvivorSequence(year: number): number {
    const next = (this.survivorCounters.get(year) ?? 0) + 1;
    this.survivorCounters.set(year, next);
    return next;
  }

  saveSurvivorPension(p: SurvivorPension): SurvivorPension {
    this.survivorPensions.set(survivorKeyOf(p.survivorId, p.deceasedId), p);
    return p;
  }

  listSurvivorPensions(): SurvivorPension[] {
    return [...this.survivorPensions.values()];
  }

  findVoluntary(citizenId: string): VoluntaryInsurance | undefined {
    return this.voluntary.get(citizenId);
  }

  nextVoluntarySequence(year: number): number {
    const next = (this.voluntaryCounters.get(year) ?? 0) + 1;
    this.voluntaryCounters.set(year, next);
    return next;
  }

  saveVoluntary(v: VoluntaryInsurance): VoluntaryInsurance {
    this.voluntary.set(v.citizenId, v);
    return v;
  }

  listVoluntary(): VoluntaryInsurance[] {
    return [...this.voluntary.values()];
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
