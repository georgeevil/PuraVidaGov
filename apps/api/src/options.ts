/**
 * Option sources for form fields (`FormField.optionsFrom`), served by GET /api/options/:source.
 * Static lists are data; `properties` goes through the bus so the lookup is consented and audited.
 */
import { ACTIVITIES, HttpError, type FormOption, type Property } from '@pvg/shared';
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

export const OPTION_SOURCES = ['activities', 'cantons', 'hospitals', 'professionals', 'properties'] as const;
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
  }
}
