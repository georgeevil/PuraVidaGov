import { JURISDICTION_LABELS, LEGAL_REFS, type LegalNote, type LegalRef } from '@pvg/shared/data';
import { Tip } from './Tip';

function refsOf(ids: string[] | undefined): LegalRef[] {
  return (ids ?? []).map((id) => LEGAL_REFS[id]).filter((r): r is LegalRef => Boolean(r));
}

/** One instrument as a small chip: `short`, link to `url` (new tab), tooltip = `what`. */
export function LegalChip({ refId, withFlag = false }: { refId: string; withFlag?: boolean }) {
  const ref = LEGAL_REFS[refId];
  if (!ref) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-500">
        {refId}
      </span>
    );
  }
  const j = JURISDICTION_LABELS[ref.jurisdiction];
  const cls =
    'inline-flex min-h-6 max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:border-primary-600 hover:text-primary-700';
  const body = (
    <>
      {withFlag && j ? <span aria-hidden="true">{j.flag}</span> : null}
      <span className="truncate">{ref.short}</span>
    </>
  );
  const title = `${ref.name} (${ref.year}) — ${ref.what}`;
  return ref.url ? (
    <a href={ref.url} target="_blank" rel="noopener noreferrer" title={title} className={cls}>
      {body}
    </a>
  ) : (
    <span title={title} className={cls}>
      {body}
    </span>
  );
}

export function ChipRow({ label, en, ids, withFlag, empty }: { label: string; en: string; ids: string[]; withFlag?: boolean; empty: string }) {
  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        <Tip en={en} />
      </span>
      <span className="flex min-w-0 flex-wrap gap-1">
        {ids.length ? ids.map((id) => <LegalChip key={id} refId={id} withFlag={withFlag} />) : <span className="text-[11px] italic text-slate-400">{empty}</span>}
      </span>
    </div>
  );
}

/**
 * Explains a LegalNote: what is possible today, what is missing, and the instruments behind both.
 * `compact` drops the headings and tightens spacing for use inside cards and table rows.
 */
export function LegalPanel({ note, compact = false }: { note: LegalNote; compact?: boolean }) {
  const basis = refsOf(note.basis).map((r) => r.id);
  const model = refsOf(note.model).map((r) => r.id);
  return (
    <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'} text-slate-700`}>
      <p title={note.todayEn}>
        {!compact && <strong className="font-semibold text-slate-900">Hoy: </strong>}
        {note.today}
      </p>
      {note.gap && (
        <p title={note.gapEn} className={compact ? 'text-slate-600' : ''}>
          <strong className="font-semibold text-rose-800">Lo que falta: </strong>
          {note.gap}
        </p>
      )}
      <div className="space-y-1 pt-0.5">
        <ChipRow label="Base en Costa Rica" en="Legal basis in Costa Rica today" ids={basis} withFlag={false} empty="sin base específica" />
        <ChipRow label="Modelo de referencia" en="Reference model abroad (what would close the gap)" ids={model} withFlag empty="no hace falta un modelo externo" />
      </div>
    </div>
  );
}
