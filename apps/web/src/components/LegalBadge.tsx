import { LEGAL_STATUS_LABELS, type LegalStatus } from '@pvg/shared/data';

const STYLES: Record<LegalStatus, string> = {
  hoy: 'border-green-200 bg-green-50 text-green-800',
  parcial: 'border-amber-200 bg-amber-50 text-amber-900',
  ley: 'border-rose-200 bg-rose-50 text-rose-800',
};

const DOT: Record<LegalStatus, string> = {
  hoy: 'bg-green-500',
  parcial: 'bg-amber-500',
  ley: 'bg-rose-500',
};

/** "¿Se puede hoy en Costa Rica?" pill: green (hoy), amber (parcial) or rose (requiere ley). */
export function LegalBadge({ status, size = 'sm' }: { status: LegalStatus; size?: 'xs' | 'sm' }) {
  const label = LEGAL_STATUS_LABELS[status] ?? { es: status, en: status };
  const sizing = size === 'xs' ? 'px-1.5 py-0 text-[10px] leading-4' : 'px-2 py-0.5 text-[11px] leading-4';
  return (
    <span
      title={`Legal status in Costa Rica today: ${label.en}`}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border font-medium ${sizing} ${STYLES[status] ?? STYLES.parcial}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[status] ?? DOT.parcial}`} aria-hidden="true" />
      {label.es}
    </span>
  );
}
