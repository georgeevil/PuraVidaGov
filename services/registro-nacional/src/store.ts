import type { CompanyResponse, Property, PropertyTransferResponse, Vehicle, VehicleTransferResponse } from '@pvg/shared';

/** Seed properties (docs/CONTRACTS.md v2 → "Registro Nacional"). All data is fictitious. */
const SEED: Property[] = [
  {
    folio: '1-123456-000',
    ownerId: '1-2345-6789',
    province: 'San José',
    canton: 'Montes de Oca',
    district: 'San Pedro',
    areaM2: 250,
    landUse: 'residencial',
    address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
    encumbrances: [],
  },
  {
    folio: '1-654321-000',
    ownerId: '1-2345-6789',
    province: 'San José',
    canton: 'Montes de Oca',
    district: 'San Pedro',
    areaM2: 400,
    landUse: 'comercial',
    address: 'Calle de la Amargura, San Pedro, Montes de Oca, San José',
    encumbrances: ['Hipoteca Banco Nacional'],
  },
  {
    folio: '7-045678-000',
    ownerId: '7-0123-0456',
    province: 'Limón',
    canton: 'Talamanca',
    district: 'Cahuita',
    areaM2: 1200,
    landUse: 'mixto',
    address: '200 m sur de la escuela, Puerto Viejo, Cahuita, Talamanca, Limón',
    encumbrances: [],
  },
  {
    folio: '2-111222-000',
    ownerId: '2-0987-0654',
    province: 'Alajuela',
    canton: 'Grecia',
    district: 'Grecia',
    areaM2: 300,
    landUse: 'residencial',
    address: 'Frente al parque central, Grecia centro, Grecia, Alajuela',
    encumbrances: [],
  },
  {
    folio: '7-077888-000', // v4: Luis, part of the estate in the bereavement demo
    ownerId: '7-0100-0300',
    province: 'Limón',
    canton: 'Talamanca',
    district: 'Cahuita',
    areaM2: 2000,
    landUse: 'mixto',
    address: 'Cahuita centro, frente a la plaza',
    encumbrances: [],
  },
];

/** Seed vehicles (docs/CONTRACTS.md v4 → "Registro Nacional additions"). All data is fictitious. */
const SEED_VEHICLES: Vehicle[] = [
  { plate: 'BCR-123', ownerId: '2-0987-0654', make: 'Toyota', model: 'Yaris', year: 2019, fiscalValueCrc: 7500000, encumbrances: [] }, // Ana
  { plate: 'SJB-456', ownerId: '7-0123-0456', make: 'Hyundai', model: 'Tucson', year: 2021, fiscalValueCrc: 14000000, encumbrances: ['Prenda Banco Popular'] }, // José
  { plate: 'LAV-777', ownerId: '7-0100-0300', make: 'Nissan', model: 'Frontier', year: 2015, fiscalValueCrc: 6200000, encumbrances: [] }, // Luis
];

export interface VehicleTransfer extends VehicleTransferResponse {
  sellerId: string;
  taxReceipt: string;
  priceCrc: number;
}

export interface PropertyTransfer extends PropertyTransferResponse {
  sellerId: string;
  taxReceipt: string;
  priceCrc: number;
}

export const normalizePlate = (plate: string) => plate.trim().toUpperCase();
const transferKeyOf = (reference: string, taxReceipt: string) => `${reference.trim()}::${taxReceipt.trim()}`;

export interface Company extends CompanyResponse {
  citizenId: string;
  fullName: string;
  activityCode: string;
  address: string;
}

const keyOf = (citizenId: string, legalName: string) => `${citizenId}::${legalName.trim().toLowerCase()}`;

class RegistroNacionalStore {
  private properties = new Map<string, Property>();
  private companies = new Map<string, Company>();
  private cedulasJuridicas = new Set<string>();
  private vehicles = new Map<string, Vehicle>();
  private vehicleTransfers = new Map<string, VehicleTransfer>(); // keyed by (plate, taxReceipt)
  private vehicleCounters = new Map<number, number>(); // year -> last BM sequence
  private propertyTransfers = new Map<string, PropertyTransfer>(); // keyed by (folio, taxReceipt)
  private propertyCounters = new Map<number, number>(); // year -> last BI sequence

  constructor() {
    this.reset();
  }

  reset(): void {
    this.properties = new Map(SEED.map((p) => [p.folio, structuredClone(p)]));
    this.companies.clear();
    this.cedulasJuridicas.clear();
    this.vehicles = new Map(SEED_VEHICLES.map((v) => [v.plate, structuredClone(v)]));
    this.vehicleTransfers.clear();
    this.vehicleCounters.clear();
    this.propertyTransfers.clear();
    this.propertyCounters.clear();
  }

  // ---- v4: vehicles, transfers, estates

  getVehicle(plate: string): Vehicle | undefined {
    const v = this.vehicles.get(normalizePlate(plate));
    return v ? structuredClone(v) : undefined;
  }

  vehiclesOf(ownerId: string): Vehicle[] {
    return [...this.vehicles.values()].filter((v) => v.ownerId === ownerId).map((v) => structuredClone(v));
  }

  listVehicles(): Vehicle[] {
    return [...this.vehicles.values()].map((v) => structuredClone(v));
  }

  putVehicle(v: Vehicle): Vehicle {
    this.vehicles.set(normalizePlate(v.plate), structuredClone(v));
    return v;
  }

  putProperty(p: Property): Property {
    this.properties.set(p.folio, structuredClone(p));
    return p;
  }

  companiesOf(citizenId: string): Company[] {
    return [...this.companies.values()].filter((c) => c.citizenId === citizenId);
  }

  findVehicleTransfer(plate: string, taxReceipt: string): VehicleTransfer | undefined {
    return this.vehicleTransfers.get(transferKeyOf(normalizePlate(plate), taxReceipt));
  }

  nextVehicleTransferSequence(year: number): number {
    const next = (this.vehicleCounters.get(year) ?? 0) + 1;
    this.vehicleCounters.set(year, next);
    return next;
  }

  saveVehicleTransfer(t: VehicleTransfer): VehicleTransfer {
    this.vehicleTransfers.set(transferKeyOf(normalizePlate(t.plate), t.taxReceipt), t);
    return t;
  }

  listVehicleTransfers(): VehicleTransfer[] {
    return [...this.vehicleTransfers.values()];
  }

  findPropertyTransfer(folio: string, taxReceipt: string): PropertyTransfer | undefined {
    return this.propertyTransfers.get(transferKeyOf(folio, taxReceipt));
  }

  nextPropertyTransferSequence(year: number): number {
    const next = (this.propertyCounters.get(year) ?? 0) + 1;
    this.propertyCounters.set(year, next);
    return next;
  }

  savePropertyTransfer(t: PropertyTransfer): PropertyTransfer {
    this.propertyTransfers.set(transferKeyOf(t.folio, t.taxReceipt), t);
    return t;
  }

  listPropertyTransfers(): PropertyTransfer[] {
    return [...this.propertyTransfers.values()];
  }

  getProperty(folio: string): Property | undefined {
    const p = this.properties.get(folio);
    return p ? structuredClone(p) : undefined;
  }

  propertiesOf(ownerId: string): Property[] {
    return [...this.properties.values()].filter((p) => p.ownerId === ownerId).map((p) => structuredClone(p));
  }

  findCompany(citizenId: string, legalName: string): Company | undefined {
    return this.companies.get(keyOf(citizenId, legalName));
  }

  hasCedulaJuridica(id: string): boolean {
    return this.cedulasJuridicas.has(id);
  }

  saveCompany(c: Company): Company {
    this.companies.set(keyOf(c.citizenId, c.legalName), c);
    this.cedulasJuridicas.add(c.cedulaJuridica);
    return c;
  }

  listCompanies(): Company[] {
    return [...this.companies.values()];
  }
}

export const store = new RegistroNacionalStore();
