import type { MarchamoStatusResponse } from '@pvg/shared';

/**
 * INS's own plate → fiscal value table for the marchamo (derechos de circulación). Fictional seed,
 * docs/CONTRACTS.md v4 → "Other new actions → INS". Values mirror the Registro Nacional vehicle seed.
 */
export interface InsuredVehicle {
  plate: string;
  fiscalValueCrc: number;
}

const SEED_VEHICLES: InsuredVehicle[] = [
  { plate: 'BCR-123', fiscalValueCrc: 7500000 }, // Ana — Toyota Yaris 2019
  { plate: 'SJB-456', fiscalValueCrc: 14000000 }, // José — Hyundai Tucson 2021
  { plate: 'LAV-777', fiscalValueCrc: 6200000 }, // Luis — Nissan Frontier 2015
];

/** A marchamo status issued by this instance, with the SOA policy it carries. */
export interface MarchamoPolicy extends MarchamoStatusResponse {
  fiscalValueCrc: number;
  issuedAt: string;
}

const normalizePlate = (plate: string) => plate.trim().toUpperCase();

class InsStore {
  private vehicles = new Map<string, InsuredVehicle>();
  private policies = new Map<string, MarchamoPolicy>(); // keyed by plate
  private policyCounters = new Map<number, number>(); // year -> last SOA sequence

  constructor() {
    this.reset();
  }

  reset(): void {
    this.vehicles = new Map(SEED_VEHICLES.map((v) => [v.plate, { ...v }]));
    this.policies.clear();
    this.policyCounters.clear();
  }

  findVehicle(plate: string): InsuredVehicle | undefined {
    return this.vehicles.get(normalizePlate(plate));
  }

  listVehicles(): InsuredVehicle[] {
    return [...this.vehicles.values()];
  }

  findPolicy(plate: string): MarchamoPolicy | undefined {
    return this.policies.get(normalizePlate(plate));
  }

  nextPolicySequence(year: number): number {
    const next = (this.policyCounters.get(year) ?? 0) + 1;
    this.policyCounters.set(year, next);
    return next;
  }

  savePolicy(p: MarchamoPolicy): MarchamoPolicy {
    this.policies.set(normalizePlate(p.plate), p);
    return p;
  }

  listPolicies(): MarchamoPolicy[] {
    return [...this.policies.values()];
  }
}

export const store = new InsStore();
