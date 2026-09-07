import type { CompanyResponse, Property } from '@pvg/shared';

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
];

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

  constructor() {
    this.reset();
  }

  reset(): void {
    this.properties = new Map(SEED.map((p) => [p.folio, structuredClone(p)]));
    this.companies.clear();
    this.cedulasJuridicas.clear();
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
