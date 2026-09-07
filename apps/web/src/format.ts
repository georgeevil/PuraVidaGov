const crc = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
const int = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 });

export function formatCrc(value: number): string {
  return crc.format(value);
}

export function formatInt(value: number): string {
  return int.format(value);
}

export function formatDecimal(value: number): string {
  return dec.format(value);
}

/** ISO date (or datetime) → "14 de mayo de 1990". */
export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'medium' });
}

export function formatMs(ms: number): string {
  return `${int.format(Math.round(ms))} ms`;
}
