import type { MunicipalityResponse } from '@pvg/shared';

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

class MunicipalidadStore {
  private licenses = new Map<string, License>(); // keyed by NITE
  private counters = new Map<number, number>(); // year -> last sequence

  reset(): void {
    this.licenses.clear();
    this.counters.clear();
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
