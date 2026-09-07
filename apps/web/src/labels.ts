/**
 * Plain-data copies of the agency constants from @pvg/shared. The shared package's index also
 * exports Express helpers, so the browser bundle only uses `import type` from it and keeps
 * these constants locally (kept in sync with packages/shared/src/types.ts).
 */
import type { AgencyName } from '@pvg/shared';

export const AGENCIES: AgencyName[] = ['registro', 'tributacion', 'ccss', 'municipalidad'];

export const AGENCY_LABELS: Record<AgencyName, string> = {
  registro: 'Registro Civil (TSE)',
  tributacion: 'Tributación (Ministerio de Hacienda)',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
};

/** Short labels for badges and step trackers. */
export const AGENCY_SHORT: Record<AgencyName, string> = {
  registro: 'Registro Civil',
  tributacion: 'Tributación',
  ccss: 'CCSS',
  municipalidad: 'Municipalidad',
};

export const AGENCY_LABELS_EN: Record<AgencyName, string> = {
  registro: 'Civil Registry (TSE)',
  tributacion: 'Tax Administration (Ministry of Finance)',
  ccss: 'Social Security (CCSS)',
  municipalidad: 'Municipality',
};

/** Cantons served by the municipal mock (CONTRACTS.md §Municipalidad). */
export const MUNICIPALITIES = ['Montes de Oca', 'San José', 'Talamanca', 'Grecia', 'Alajuela'];

export function agencyLabel(agency: string): string {
  return (AGENCY_LABELS as Record<string, string>)[agency] ?? agency;
}
