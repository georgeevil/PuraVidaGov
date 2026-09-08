import type { FinesCheckResponse, LicenceRenewalResponse, VehicleFinesResponse } from '@pvg/shared';

/** COSEVI's own table of pending fines and marchamo per driver (fictional seed, docs/CONTRACTS.md v3). */
export interface DriverRecord extends FinesCheckResponse {
  citizenId: string;
}

const SEED_DRIVERS: DriverRecord[] = [
  { citizenId: '1-2345-6789', pendingFines: 0, pendingAmountCrc: 0, marchamoPaid: true }, // María
  { citizenId: '7-0123-0456', pendingFines: 1, pendingAmountCrc: 55000, marchamoPaid: true }, // José
  { citizenId: '2-0987-0654', pendingFines: 0, pendingAmountCrc: 0, marchamoPaid: false }, // Ana
];

/** Pending fines per plate (v4, docs/CONTRACTS.md v4 → COSEVI). Fictional seed. */
const SEED_VEHICLE_FINES: VehicleFinesResponse[] = [
  { plate: 'SJB-456', pendingFines: 1, pendingAmountCrc: 55000 }, // José's Tucson
];

export const normalizePlate = (plate: string) => plate.trim().toUpperCase();

/** A driver with no record in the table has nothing pending (and no vehicle to pay the marchamo for). */
export const CLEAN_RECORD: FinesCheckResponse = { pendingFines: 0, pendingAmountCrc: 0, marchamoPaid: true };

export interface Licence extends LicenceRenewalResponse {
  citizenId: string;
  fullName: string;
  medicalCertificate: string;
  validityYears: number;
}

class CoseviStore {
  private drivers = new Map<string, DriverRecord>();
  private licences = new Map<string, Licence>(); // keyed by citizenId
  private vehicleFines = new Map<string, VehicleFinesResponse>(); // keyed by plate

  constructor() {
    this.reset();
  }

  reset(): void {
    this.drivers = new Map(SEED_DRIVERS.map((d) => [d.citizenId, { ...d }]));
    this.licences.clear();
    this.vehicleFines = new Map(SEED_VEHICLE_FINES.map((f) => [f.plate, { ...f }]));
  }

  /** A plate without a record is clean (v4). */
  vehicleFinesFor(plate: string): VehicleFinesResponse {
    const p = normalizePlate(plate);
    const f = this.vehicleFines.get(p);
    return f ? { ...f } : { plate: p, pendingFines: 0, pendingAmountCrc: 0 };
  }

  listVehicleFines(): VehicleFinesResponse[] {
    return [...this.vehicleFines.values()];
  }

  finesFor(citizenId: string): FinesCheckResponse {
    const d = this.drivers.get(citizenId);
    if (!d) return { ...CLEAN_RECORD };
    const { pendingFines, pendingAmountCrc, marchamoPaid } = d;
    return { pendingFines, pendingAmountCrc, marchamoPaid };
  }

  listDrivers(): DriverRecord[] {
    return [...this.drivers.values()];
  }

  findLicence(citizenId: string): Licence | undefined {
    return this.licences.get(citizenId);
  }

  saveLicence(l: Licence): Licence {
    this.licences.set(l.citizenId, l);
    return l;
  }

  listLicences(): Licence[] {
    return [...this.licences.values()];
  }
}

export const store = new CoseviStore();
