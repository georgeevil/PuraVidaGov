import type { AddressUpdateResponse, BuildingPermitResponse, LandUseResponse, MunicipalityResponse, PropertyDeclarationResponse } from '@pvg/shared';

export interface Canton {
  name: string;
  province: string;
  feeMultiplier: number;
}

/** Cantons served by this mock; the fee multiplier scales the activity's base patente fee. */
export const CANTONS: Canton[] = [
  { name: 'Montes de Oca', province: 'San José', feeMultiplier: 1.0 },
  { name: 'San José', province: 'San José', feeMultiplier: 1.2 },
  { name: 'Escazú', province: 'San José', feeMultiplier: 1.3 },
  { name: 'Curridabat', province: 'San José', feeMultiplier: 1.1 },
  { name: 'Alajuela', province: 'Alajuela', feeMultiplier: 1.0 },
  { name: 'Grecia', province: 'Alajuela', feeMultiplier: 0.9 },
  { name: 'Cartago', province: 'Cartago', feeMultiplier: 0.95 },
  { name: 'Heredia', province: 'Heredia', feeMultiplier: 1.05 },
  { name: 'Liberia', province: 'Guanacaste', feeMultiplier: 0.9 },
  { name: 'Puntarenas', province: 'Puntarenas', feeMultiplier: 0.85 },
  { name: 'Limón', province: 'Limón', feeMultiplier: 0.85 },
  { name: 'Talamanca', province: 'Limón', feeMultiplier: 0.8 },
];

const normalize = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function findCanton(name: string): Canton | undefined {
  const n = normalize(name);
  return CANTONS.find((c) => normalize(c.name) === n);
}

export interface License extends MunicipalityResponse {
  nite: string;
  citizenId: string;
  businessName: string;
  activityCode: string;
  address: string;
}

export type ProjectType = 'vivienda' | 'comercial' | 'ampliacion';

export interface LandUseCertificate extends LandUseResponse {
  citizenId: string;
  folio: string;
  projectType: ProjectType;
  landUse: string;
}

export interface BuildingPermit extends BuildingPermitResponse {
  citizenId: string;
  folio: string;
  apcNumber: string;
  landUseCertificate: string;
  declaredValueCrc: number;
  areaM2: number;
}

/** Latest address a contribuyente declared to the municipality (kept for the demo list). */
export interface AddressChange extends AddressUpdateResponse {
  citizenId: string;
  address: string;
  province: string;
  canton: string;
  district: string;
}

/** Declaración de bienes inmuebles (v4). */
export interface PropertyDeclaration extends PropertyDeclarationResponse {
  citizenId: string;
  folio: string;
  registrationNumber: string;
  declaredAt: string;
}

const landUseKeyOf = (folio: string, projectType: string) => `${folio.trim()}::${projectType}`;
const declarationKeyOf = (folio: string, citizenId: string) => `${folio.trim()}::${citizenId}`;

class MunicipalidadStore {
  private licenses = new Map<string, License>(); // keyed by NITE
  private counters = new Map<number, number>(); // year -> last patente sequence
  private landUses = new Map<string, LandUseCertificate>(); // keyed by (folio, projectType)
  private landUseCounters = new Map<number, number>();
  private permits = new Map<string, BuildingPermit>(); // keyed by apcNumber
  private permitCounters = new Map<number, number>();
  private addresses = new Map<string, AddressChange>(); // keyed by citizenId
  private declarations = new Map<string, PropertyDeclaration>(); // keyed by (folio, citizenId)
  private declarationCounters = new Map<number, number>();

  reset(): void {
    this.declarations.clear();
    this.declarationCounters.clear();
    this.licenses.clear();
    this.counters.clear();
    this.landUses.clear();
    this.landUseCounters.clear();
    this.permits.clear();
    this.permitCounters.clear();
    this.addresses.clear();
  }

  findDeclaration(folio: string, citizenId: string): PropertyDeclaration | undefined {
    return this.declarations.get(declarationKeyOf(folio, citizenId));
  }

  nextDeclarationSequence(year: number): number {
    const next = (this.declarationCounters.get(year) ?? 0) + 1;
    this.declarationCounters.set(year, next);
    return next;
  }

  saveDeclaration(d: PropertyDeclaration): PropertyDeclaration {
    this.declarations.set(declarationKeyOf(d.folio, d.citizenId), d);
    return d;
  }

  listDeclarations(): PropertyDeclaration[] {
    return [...this.declarations.values()];
  }

  findLandUse(folio: string, projectType: string): LandUseCertificate | undefined {
    return this.landUses.get(landUseKeyOf(folio, projectType));
  }

  nextLandUseSequence(year: number): number {
    const next = (this.landUseCounters.get(year) ?? 0) + 1;
    this.landUseCounters.set(year, next);
    return next;
  }

  saveLandUse(c: LandUseCertificate): LandUseCertificate {
    this.landUses.set(landUseKeyOf(c.folio, c.projectType), c);
    return c;
  }

  listLandUses(): LandUseCertificate[] {
    return [...this.landUses.values()];
  }

  findPermit(apcNumber: string): BuildingPermit | undefined {
    return this.permits.get(apcNumber);
  }

  nextPermitSequence(year: number): number {
    const next = (this.permitCounters.get(year) ?? 0) + 1;
    this.permitCounters.set(year, next);
    return next;
  }

  savePermit(p: BuildingPermit): BuildingPermit {
    this.permits.set(p.apcNumber, p);
    return p;
  }

  listPermits(): BuildingPermit[] {
    return [...this.permits.values()];
  }

  saveAddress(a: AddressChange): AddressChange {
    this.addresses.set(a.citizenId, a);
    return a;
  }

  listAddresses(): AddressChange[] {
    return [...this.addresses.values()];
  }

  findByNite(nite: string): License | undefined {
    return this.licenses.get(nite);
  }

  /** Next sequential patente number for the given year (1-based). */
  nextSequence(year: number): number {
    const next = (this.counters.get(year) ?? 0) + 1;
    this.counters.set(year, next);
    return next;
  }

  save(l: License): License {
    this.licenses.set(l.nite, l);
    return l;
  }

  list(): License[] {
    return [...this.licenses.values()];
  }
}

export const store = new MunicipalidadStore();
