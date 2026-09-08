import type { BirthRegistrationResponse, Citizen, DeathRegistrationResponse, MarriageRegistrationResponse } from '@pvg/shared';

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
    children: ['1-9999-0001'],
  },
  {
    id: '7-0123-0456',
    fullName: 'José Alberto Mora Salazar',
    firstName: 'José Alberto',
    lastName1: 'Mora',
    lastName2: 'Salazar',
    dateOfBirth: '1961-06-01',
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
  // ---- v4 seeds (docs/CONTRACTS.md v4 → "Seed changes"). Passwords live in apps/api, not here.
  {
    id: '1-9999-0001', // María's son; a minor, cannot log in
    fullName: 'Lucas Fernández Gómez',
    firstName: 'Lucas',
    lastName1: 'Fernández',
    lastName2: 'Gómez',
    dateOfBirth: '2020-03-10',
    nationality: 'CR',
    address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
    province: 'San José',
    canton: 'Montes de Oca',
    district: 'San Pedro',
    maritalStatus: 'single',
    email: '',
    phone: '',
  },
  {
    id: '1-1111-2222',
    fullName: 'Diego Alonso Solano Vega',
    firstName: 'Diego Alonso',
    lastName1: 'Solano',
    lastName2: 'Vega',
    dateOfBirth: '1988-07-22',
    nationality: 'CR',
    address: 'Curridabat centro, 50 m este del parque',
    province: 'San José',
    canton: 'Curridabat',
    district: 'Curridabat',
    maritalStatus: 'single',
    email: 'diego.solano@ejemplo.cr',
    phone: '+506 8444-3344',
  },
  {
    id: '7-0111-0222',
    fullName: 'Rosa María Brenes Castro',
    firstName: 'Rosa María',
    lastName1: 'Brenes',
    lastName2: 'Castro',
    dateOfBirth: '1963-02-14',
    nationality: 'CR',
    address: 'Cahuita centro, frente a la plaza',
    province: 'Limón',
    canton: 'Talamanca',
    district: 'Cahuita',
    maritalStatus: 'married',
    spouseId: '7-0100-0300',
    email: 'rosa.brenes@ejemplo.cr',
    phone: '+506 8555-1122',
  },
  {
    id: '7-0100-0300', // Rosa's husband; dies in the bereavement demo, cannot log in
    fullName: 'Luis Ángel Vargas Mora',
    firstName: 'Luis Ángel',
    lastName1: 'Vargas',
    lastName2: 'Mora',
    dateOfBirth: '1958-09-30',
    nationality: 'CR',
    address: 'Cahuita centro, frente a la plaza',
    province: 'Limón',
    canton: 'Talamanca',
    district: 'Cahuita',
    maritalStatus: 'married',
    spouseId: '7-0111-0222',
    email: '',
    phone: '',
  },
];

export interface BirthRegistration extends BirthRegistrationResponse {
  parentId: string;
  childFirstName: string;
  birthDate: string;
  hospital: string;
}

export interface DeathRegistration extends DeathRegistrationResponse {
  declarantId: string;
  hospital: string;
}

export interface MarriageRegistration extends MarriageRegistrationResponse {
  notary: string;
  registeredAt: string;
}

/** Order-independent key for a couple. */
export const marriageKeyOf = (a: string, b: string) => [a, b].sort().join('::');

const birthKeyOf = (parentId: string, childFirstName: string, birthDate: string) =>
  `${parentId}::${childFirstName.trim().toLowerCase()}::${birthDate}`;

class RegistroStore {
  private citizens = new Map<string, Citizen>();
  private births = new Map<string, BirthRegistration>();
  private birthCounters = new Map<number, number>(); // year -> last certificate sequence
  private deaths = new Map<string, DeathRegistration>(); // keyed by deceasedId
  private deathCounters = new Map<number, number>();
  private marriages = new Map<string, MarriageRegistration>(); // keyed by sorted pair
  private marriageCounters = new Map<number, number>();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.citizens = new Map(SEED.map((c) => [c.id, structuredClone(c)]));
    this.births.clear();
    this.birthCounters.clear();
    this.deaths.clear();
    this.deathCounters.clear();
    this.marriages.clear();
    this.marriageCounters.clear();
  }

  // ---- v4: deaths and marriages

  findDeath(deceasedId: string): DeathRegistration | undefined {
    return this.deaths.get(deceasedId);
  }

  nextDeathSequence(year: number): number {
    const next = (this.deathCounters.get(year) ?? 0) + 1;
    this.deathCounters.set(year, next);
    return next;
  }

  saveDeath(d: DeathRegistration): DeathRegistration {
    this.deaths.set(d.deceasedId, d);
    return d;
  }

  listDeaths(): DeathRegistration[] {
    return [...this.deaths.values()];
  }

  findMarriage(a: string, b: string): MarriageRegistration | undefined {
    return this.marriages.get(marriageKeyOf(a, b));
  }

  nextMarriageSequence(year: number): number {
    const next = (this.marriageCounters.get(year) ?? 0) + 1;
    this.marriageCounters.set(year, next);
    return next;
  }

  saveMarriage(m: MarriageRegistration): MarriageRegistration {
    this.marriages.set(marriageKeyOf(m.spouseAId, m.spouseBId), m);
    return m;
  }

  listMarriages(): MarriageRegistration[] {
    return [...this.marriages.values()];
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
