import type { BirthRegistrationResponse, Citizen } from '@pvg/shared';

/** Seed citizens (docs/CONTRACTS.md §"Seed data"). All data is fictitious. */
const SEED: Citizen[] = [
  {
    id: '1-2345-6789',
    fullName: 'María Fernández Gómez',
    firstName: 'María',
    lastName1: 'Fernández',
    lastName2: 'Gómez',
    dateOfBirth: '1990-05-14',
    nationality: 'CR',
    address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
    province: 'San José',
    canton: 'Montes de Oca',
    district: 'San Pedro',
    maritalStatus: 'single',
    email: 'maria.fernandez@ejemplo.cr',
    phone: '+506 8888-1234',
  },
  {
    id: '7-0123-0456',
    fullName: 'José Alberto Mora Salazar',
    firstName: 'José Alberto',
    lastName1: 'Mora',
    lastName2: 'Salazar',
    dateOfBirth: '1984-11-02',
    nationality: 'CR',
    address: '200 m sur de la escuela, Puerto Viejo, Cahuita, Talamanca, Limón',
    province: 'Limón',
    canton: 'Talamanca',
    district: 'Cahuita',
    maritalStatus: 'married',
    email: 'jose.mora@ejemplo.cr',
    phone: '+506 8777-5678',
  },
  {
    id: '2-0987-0654',
    fullName: 'Ana Lucía Chaves Rojas',
    firstName: 'Ana Lucía',
    lastName1: 'Chaves',
    lastName2: 'Rojas',
    dateOfBirth: '1996-03-27',
    nationality: 'CR',
    address: 'Frente al parque central, Grecia centro, Grecia, Alajuela',
    province: 'Alajuela',
    canton: 'Grecia',
    district: 'Grecia',
    maritalStatus: 'single',
    email: 'ana.chaves@ejemplo.cr',
    phone: '+506 8666-9012',
  },
];

export interface BirthRegistration extends BirthRegistrationResponse {
  parentId: string;
  childFirstName: string;
  birthDate: string;
  hospital: string;
}

const birthKeyOf = (parentId: string, childFirstName: string, birthDate: string) =>
  `${parentId}::${childFirstName.trim().toLowerCase()}::${birthDate}`;

class RegistroStore {
  private citizens = new Map<string, Citizen>();
  private births = new Map<string, BirthRegistration>();
  private birthCounters = new Map<number, number>(); // year -> last certificate sequence

  constructor() {
    this.reset();
  }

  reset(): void {
    this.citizens = new Map(SEED.map((c) => [c.id, structuredClone(c)]));
    this.births.clear();
    this.birthCounters.clear();
  }

  has(id: string): boolean {
    return this.citizens.has(id);
  }

  /** Adds or replaces a citizen record (used for newborns and address changes). */
  put(citizen: Citizen): Citizen {
    this.citizens.set(citizen.id, structuredClone(citizen));
    return citizen;
  }

  findBirth(parentId: string, childFirstName: string, birthDate: string): BirthRegistration | undefined {
    return this.births.get(birthKeyOf(parentId, childFirstName, birthDate));
  }

  nextBirthSequence(year: number): number {
    const next = (this.birthCounters.get(year) ?? 0) + 1;
    this.birthCounters.set(year, next);
    return next;
  }

  saveBirth(b: BirthRegistration): BirthRegistration {
    this.births.set(birthKeyOf(b.parentId, b.childFirstName, b.birthDate), b);
    return b;
  }

  listBirths(): BirthRegistration[] {
    return [...this.births.values()];
  }

  get(id: string): Citizen | undefined {
    const c = this.citizens.get(id);
    return c ? structuredClone(c) : undefined;
  }

  list(): Array<{ id: string; fullName: string; canton: string }> {
    return [...this.citizens.values()].map(({ id, fullName, canton }) => ({ id, fullName, canton }));
  }
}

export const store = new RegistroStore();
