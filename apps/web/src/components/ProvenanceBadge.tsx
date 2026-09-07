import type { AgencyName } from '@pvg/shared';
import { AGENCY_SHORT, AGENCY_LABELS_EN } from '../labels';

interface Props {
  source: AgencyName;
  exchangeId?: string;
  fetchedAt?: string;
}

/** "Registro Civil · X-ABC123" — where a value on screen came from (principio «una sola vez»). */
export function ProvenanceBadge({ source, exchangeId, fetchedAt }: Props) {
  const title = `Fuente: ${AGENCY_LABELS_EN[source] ?? source}${exchangeId ? ` · exchange ${exchangeId}` : ''}${
    fetchedAt ? ` · ${fetchedAt}` : ''
  }`;
  return (
    <span
      title={title}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-primary-700"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3 shrink-0 fill-current">
        <path d="M8 1.5 2.5 4v4c0 3.2 2.3 5.6 5.5 6.5 3.2-.9 5.5-3.3 5.5-6.5V4L8 1.5Zm-1 9.2L4.8 8.5l1-1L7 8.7l3.2-3.2 1 1L7 10.7Z" />
      </svg>
      <span className="truncate">
        {AGENCY_SHORT[source] ?? source}
        {exchangeId ? <span className="text-primary-600/70"> · {exchangeId}</span> : null}
      </span>
    </span>
  );
}
