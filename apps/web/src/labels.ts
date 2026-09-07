/**
 * Browser-side labels that do not exist in @pvg/shared (English tooltips) plus small helpers.
 * Spanish agency labels come from `@pvg/shared/data` (AGENCY_LABELS, AGENCY_SHORT) — do not copy them here.
 */
import { AGENCY_LABELS, type AgencyName } from '@pvg/shared/data';

export const AGENCY_LABELS_EN: Record<AgencyName, string> = {
  registro: 'Civil Registry (TSE)',
  tributacion: 'Tax Administration (Ministry of Finance)',
  ccss: 'Social Security (CCSS)',
  municipalidad: 'Municipality',
  'registro-nacional': 'National Registry (property and companies)',
  salud: 'Ministry of Health',
  cfia: 'Engineers and Architects Federation (plan review, APC)',
  supen: 'Pension fund operator (ROP/FCL, supervised by SUPEN)',
  mtss: 'Ministry of Labour (National Employment Agency)',
  cosevi: 'Road Safety Council (COSEVI, MOPT): licences and fines',
};

export function agencyLabel(agency: string): string {
  return (AGENCY_LABELS as Record<string, string>)[agency] ?? agency;
}

export function agencyLabelEn(agency: string): string {
  return (AGENCY_LABELS_EN as Record<string, string>)[agency] ?? agency;
}
