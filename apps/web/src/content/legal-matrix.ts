/**
 * Comparative matrix for /marco-legal: which foundations of once-only government exist as law in
 * Costa Rica today versus the reference jurisdictions. Plain data; edit here, not in the page.
 */
export type MatrixValue = 'si' | 'parcial' | 'no';

export interface MatrixCell {
  value: MatrixValue;
  note: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  labelEn: string;
  cells: Record<MatrixColumnId, MatrixCell>;
}

export type MatrixColumnId = 'CR' | 'EE' | 'SG' | 'EU';

export const MATRIX_COLUMNS: Array<{ id: MatrixColumnId; label: string; flag: string }> = [
  { id: 'CR', label: 'Costa Rica hoy', flag: '🇨🇷' },
  { id: 'EE', label: 'Estonia', flag: '🇪🇪' },
  { id: 'SG', label: 'Singapur', flag: '🇸🇬' },
  { id: 'EU', label: 'Unión Europea', flag: '🇪🇺' },
];

export const MATRIX_VALUE_LABELS: Record<MatrixValue, { glyph: string; es: string; en: string }> = {
  si: { glyph: '✔', es: 'Sí', en: 'Yes' },
  parcial: { glyph: 'parcial', es: 'Parcial', en: 'Partial' },
  no: { glyph: '✘', es: 'No', en: 'No' },
};

export const LEGAL_MATRIX: MatrixRow[] = [
  {
    id: 'identity',
    label: 'Identidad digital que todos deben aceptar',
    labelEn: 'A digital identity every institution must accept',
    cells: {
      CR: { value: 'parcial', note: 'Ley 8454 da validez a la firma digital; ninguna norma obliga a aceptar Pase Digital.' },
      EE: { value: 'si', note: 'Identity Documents Act: cédula electrónica obligatoria y aceptada por toda institución.' },
      SG: { value: 'si', note: 'Singpass es la identidad única para todo servicio público.' },
      EU: { value: 'si', note: 'eIDAS 2 (2024): billetera de identidad que los servicios públicos deben aceptar.' },
    },
  },
  {
    id: 'interoperability',
    label: 'Plataforma de interoperabilidad obligatoria',
    labelEn: 'Mandatory interoperability platform',
    cells: {
      CR: { value: 'no', note: 'No existe un bus obligatorio; cada institución integra por convenio o no integra.' },
      EE: { value: 'si', note: 'X-Road, por reglamento del Gobierno, para toda base de datos estatal.' },
      SG: { value: 'si', note: 'APEX y la infraestructura de GovTech, bajo la PSGA 2018.' },
      EU: { value: 'si', note: 'Interoperable Europe Act (2024) y el sistema técnico OOTS.' },
    },
  },
  {
    id: 'once-only',
    label: '«Una sola vez» con fuerza de ley',
    labelEn: 'Once-only principle with the force of law',
    cells: {
      CR: { value: 'parcial', note: 'Ley 8220 art. 2 lo enuncia, sin plataforma ni sanción que lo haga cumplir.' },
      EE: { value: 'si', note: 'Public Information Act §43: prohibido recolectar datos que ya existen en otra base.' },
      SG: { value: 'si', note: 'MyInfo («Tell us once») respaldado por la PSGA 2018.' },
      EU: { value: 'si', note: 'Reglamento 2018/1724 art. 14: intercambio de evidencias a petición de la persona.' },
    },
  },
  {
    id: 'base-registries',
    label: 'Registros base designados',
    labelEn: 'Designated base registries',
    cells: {
      CR: { value: 'no', note: 'Ninguna norma designa qué registro es la fuente autoritativa de cada dato.' },
      EE: { value: 'si', note: 'Registro de bases de datos estatales; cada dato tiene un dueño único.' },
      SG: { value: 'si', note: 'Fuentes autoritativas definidas para MyInfo (ICA, IRAS, HDB, CPF…).' },
      EU: { value: 'parcial', note: 'Depende de cada Estado; la UE solo fija el intercambio transfronterizo.' },
    },
  },
  {
    id: 'consent-audit',
    label: 'Consentimiento y auditoría visible para la persona',
    labelEn: 'Consent and an audit trail the person can see',
    cells: {
      CR: { value: 'parcial', note: 'Ley 8968 da derechos de acceso y consentimiento, pero no hay visor de auditoría.' },
      EE: { value: 'si', note: 'El portal eesti.ee muestra a cada persona quién consultó sus datos.' },
      SG: { value: 'parcial', note: 'Consentimiento por transacción en MyInfo; el historial de accesos no es completo.' },
      EU: { value: 'si', note: 'OOTS exige vista previa y consentimiento explícito antes de cada intercambio.' },
    },
  },
  {
    id: 'authority',
    label: 'Autoridad de gobierno digital con presupuesto',
    labelEn: 'Digital government authority with budget power',
    cells: {
      CR: { value: 'no', note: 'MICITT rectora sin potestad presupuestaria sobre las instituciones autónomas.' },
      EE: { value: 'si', note: 'RIA (Autoridad del Sistema de Información) con presupuesto y potestad normativa.' },
      SG: { value: 'si', note: 'GovTech bajo la Oficina del Primer Ministro, con presupuesto central.' },
      EU: { value: 'parcial', note: 'Interoperable Europe Board coordina; el presupuesto sigue en cada Estado.' },
    },
  },
];
