/**
 * Option sources for form fields (`FormField.optionsFrom`), served by GET /api/options/:source.
 * Static lists are data; `properties` goes through the bus so the lookup is consented and audited.
 */
import { ACTIVITIES, HttpError, type Citizen, type FormOption, type Property } from '@pvg/shared';
import { busRequest } from './bus-client.js';

/** The 12 cantons served by the municipal mock (services/municipalidad/src/store.ts). */
export const CANTONS: Array<{ name: string; province: string }> = [
  { name: 'Montes de Oca', province: 'San José' },
  { name: 'San José', province: 'San José' },
  { name: 'Escazú', province: 'San José' },
  { name: 'Curridabat', province: 'San José' },
  { name: 'Alajuela', province: 'Alajuela' },
  { name: 'Grecia', province: 'Alajuela' },
  { name: 'Cartago', province: 'Cartago' },
  { name: 'Heredia', province: 'Heredia' },
  { name: 'Liberia', province: 'Guanacaste' },
  { name: 'Puntarenas', province: 'Puntarenas' },
  { name: 'Limón', province: 'Limón' },
  { name: 'Talamanca', province: 'Limón' },
];

export const HOSPITALS: string[] = [
  'Hospital Calderón Guardia',
  'Hospital México',
  'Hospital San Juan de Dios',
  'Hospital de las Mujeres',
  'Hospital Tony Facio (Limón)',
  'Hospital San Rafael de Alajuela',
];

/** Static copy of the CFIA seed (`GET /cfia/professionals` is not a bus action). */
export const PROFESSIONALS: Array<{ licence: string; name: string; discipline: string }> = [
  { licence: 'IC-12345', name: 'Ing. Carlos Rojas Vargas', discipline: 'Ingeniería civil' },
  { licence: 'A-23456', name: 'Arq. Laura Jiménez Solano', discipline: 'Arquitectura' },
  { licence: 'IE-34567', name: 'Ing. Marco Solís Quesada', discipline: 'Ingeniería eléctrica' },
];

/** Static copy of the MEP seed (services/mep/src/store.ts). */
export const SCHOOLS: Array<{ name: string; canton: string; circuit: string }> = [
  { name: 'Escuela Roosevelt', canton: 'Montes de Oca', circuit: '01' },
  { name: 'Escuela Dante Alighieri', canton: 'Montes de Oca', circuit: '01' },
  { name: 'Escuela José Figueres Ferrer', canton: 'Curridabat', circuit: '02' },
  { name: 'Escuela Líder de Cahuita', canton: 'Talamanca', circuit: '07' },
  { name: 'Escuela Central de Grecia', canton: 'Grecia', circuit: '03' },
];

export const GRADES: Array<{ value: string; label: string }> = [
  { value: 'materno', label: 'Materno infantil (4 años)' },
  { value: 'transicion', label: 'Transición (5 años)' },
  { value: 'primero', label: 'Primer grado (6 años)' },
  { value: 'septimo', label: 'Sétimo año (12 años)' },
];

/** Demo listings: what the seed citizens are "selling" (Registro Nacional seed). */
export const VEHICLES_FOR_SALE: Array<{ plate: string; label: string; priceCrc: number }> = [
  { plate: 'BCR-123', label: 'BCR-123 · Toyota Yaris 2019 · vende Ana Lucía Chaves · ₡8 500 000', priceCrc: 8_500_000 },
  { plate: 'LAV-777', label: 'LAV-777 · Nissan Frontier 2015 · vende Luis Ángel Vargas · ₡6 900 000', priceCrc: 6_900_000 },
  { plate: 'SJB-456', label: 'SJB-456 · Hyundai Tucson 2021 · vende José Mora · ₡15 000 000 (con prenda)', priceCrc: 15_000_000 },
];
export const PROPERTIES_FOR_SALE: Array<{ folio: string; label: string; priceCrc: number }> = [
  { folio: '2-111222-000', label: '2-111222-000 · Grecia centro · 300 m² residencial · vende Ana Lucía Chaves · ₡62 000 000', priceCrc: 62_000_000 },
  { folio: '7-077888-000', label: '7-077888-000 · Cahuita · 2 000 m² mixto · vende Luis Ángel Vargas · ₡48 000 000', priceCrc: 48_000_000 },
];

export const OPTION_SOURCES = [
  'activities',
  'cantons',
  'hospitals',
  'professionals',
  'properties',
  'children',
  'schools',
  'grades',
  'vehicles-for-sale',
  'properties-for-sale',
] as const;
export type OptionSource = (typeof OPTION_SOURCES)[number];

export function isOptionSource(s: string): s is OptionSource {
  return (OPTION_SOURCES as readonly string[]).includes(s);
}

export async function loadOptions(source: OptionSource, citizenId: string): Promise<FormOption[]> {
  switch (source) {
    case 'activities':
      return ACTIVITIES.map((a) => ({ value: a.code, label: `${a.code} · ${a.description}` }));
    case 'cantons':
      return CANTONS.map((c) => ({ value: c.name, label: `${c.name} (${c.province})` }));
    case 'hospitals':
      return HOSPITALS.map((h) => ({ value: h, label: h }));
    case 'professionals':
      return PROFESSIONALS.map((p) => ({ value: p.licence, label: `${p.licence} · ${p.name} · ${p.discipline}` }));
    case 'properties': {
      const res = await busRequest<Property[]>({
        service: 'registro-nacional',
        action: 'listProperties',
        data: { ownerId: citizenId },
        subjectId: citizenId,
        consent: { granted: true, reference: `options:${citizenId}` },
        purpose: 'Listar propiedades de la persona',
      });
      if (!res.ok) throw new HttpError(502, res.error.code, res.error.message);
      return res.data.map((p) => ({
        value: p.folio,
        label: `${p.folio} · ${p.canton} · ${p.areaM2.toLocaleString('es-CR')} m² · ${p.landUse}`,
      }));
    }
    case 'children': {
      const res = await busRequest<{ spouse?: Citizen; children: Citizen[] }>({
        service: 'registro',
        action: 'getDependants',
        data: { id: citizenId },
        subjectId: citizenId,
        consent: { granted: true, reference: `options:${citizenId}` },
        purpose: 'Listar hijos menores de la persona',
      });
      if (!res.ok) throw new HttpError(502, res.error.code, res.error.message);
      return res.data.children.map((c) => ({ value: c.id, label: `${c.fullName} · nació ${c.dateOfBirth}` }));
    }
    case 'schools':
      return SCHOOLS.map((s) => ({ value: s.name, label: `${s.name} · ${s.canton} · circuito ${s.circuit}` }));
    case 'grades':
      return GRADES;
    case 'vehicles-for-sale':
      return VEHICLES_FOR_SALE.map((v) => ({ value: v.plate, label: v.label }));
    case 'properties-for-sale':
      return PROPERTIES_FOR_SALE.map((p) => ({ value: p.folio, label: p.label }));
  }
}
