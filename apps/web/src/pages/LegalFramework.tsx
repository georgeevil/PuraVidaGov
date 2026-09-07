import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AGENCY_SHORT, JURISDICTION_LABELS, LEGAL_REFS, LEGAL_STATUS_LABELS, type LegalNote, type LegalRef, type LegalStatus } from '@pvg/shared/data';
import { api, errorMessage, type LegalOverview } from '../api';
import { Alert } from '../components/Alert';
import { LegalBadge } from '../components/LegalBadge';
import { LegalChip, LegalPanel } from '../components/LegalPanel';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { LEGAL_MATRIX, MATRIX_COLUMNS, MATRIX_VALUE_LABELS, type MatrixValue } from '../content/legal-matrix';
import { agencyLabelEn } from '../labels';

const STATUS_ORDER: LegalStatus[] = ['hoy', 'parcial', 'ley'];

function Chips({ ids, withFlag }: { ids: string[]; withFlag?: boolean }) {
  if (!ids.length) return <span className="text-[11px] text-slate-400">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <LegalChip key={id} refId={id} withFlag={withFlag} />
      ))}
    </span>
  );
}

function ExpandableRow({ cells, note, indent, className = '' }: { cells: ReactNode[]; note: LegalNote; indent?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className={`align-top ${className}`}>
        {cells.map((c, i) => (
          <td key={i} className={`px-3 py-2 ${i === 0 && indent ? 'pl-8' : ''}`}>
            {c}
          </td>
        ))}
        <td className="px-3 py-2 text-right">
          <button type="button" className="whitespace-nowrap text-xs text-primary-700 hover:underline" aria-expanded={open} onClick={() => setOpen((v) => !v)} title="Details">
            {open ? 'Cerrar' : 'Detalle'}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/70">
          <td colSpan={cells.length + 1} className={`px-3 py-3 ${indent ? 'pl-8' : ''}`}>
            <LegalPanel note={note} compact />
          </td>
        </tr>
      )}
    </>
  );
}

function WorkflowTable({ w }: { w: LegalOverview['workflows'][number] }) {
  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium" title="Workflow / step">Trámite · paso</th>
            <th className="px-3 py-2 font-medium" title="Agency">Institución</th>
            <th className="px-3 py-2 font-medium" title="Status today">Hoy</th>
            <th className="px-3 py-2 font-medium" title="Costa Rican legal basis">Base en Costa Rica</th>
            <th className="px-3 py-2 font-medium" title="Reference model">Modelo de referencia</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <ExpandableRow
            className="bg-primary-50/40"
            note={w.legal}
            cells={[
              <Link key="t" to={`/tramite/${encodeURIComponent(w.id)}`} className="font-semibold text-slate-900 hover:text-primary-700 hover:underline">
                {w.title}
              </Link>,
              <span key="a" className="text-xs text-slate-500">
                todo el evento
              </span>,
              <LegalBadge key="b" status={w.legal.status} />,
              <Chips key="c" ids={w.legal.basis} />,
              <Chips key="d" ids={w.legal.model} withFlag />,
            ]}
          />
          {w.steps.map((s) => (
            <ExpandableRow
              key={s.id}
              indent
              note={s.legal}
              cells={[
                <span key="t" className="text-slate-800">
                  {s.label}
                </span>,
                <span key="a" className="text-xs text-slate-600" title={agencyLabelEn(s.agency)}>
                  {(AGENCY_SHORT as Record<string, string>)[s.agency] ?? s.agency}
                </span>,
                <LegalBadge key="b" status={s.legal.status} size="xs" />,
                <Chips key="c" ids={s.legal.basis} />,
                <Chips key="d" ids={s.legal.model} withFlag />,
              ]}
            />
          ))}
          {w.steps.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-2 pl-8 text-xs italic text-slate-500">
                Sin pasos definidos todavía: el evento no está disponible en el demo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RefCard({ r }: { r: LegalRef }) {
  return (
    <article className="card flex flex-col !p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{r.short}</span>
        <span className="text-xs text-slate-500">{r.year}</span>
      </div>
      <h4 className="mt-2 text-sm font-semibold text-slate-900">{r.name}</h4>
      <p className="mt-1 flex-1 text-xs text-slate-600" title={r.whatEn}>
        {r.what}
      </p>
      {r.url && (
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-primary-700 hover:underline">
          Ver texto ↗
        </a>
      )}
    </article>
  );
}

function MatrixCell({ value, note }: { value: MatrixValue; note: string }) {
  const v = MATRIX_VALUE_LABELS[value];
  const cls = value === 'si' ? 'text-green-700' : value === 'parcial' ? 'text-amber-700' : 'text-rose-700';
  return (
    <td className="px-3 py-2 align-top">
      <div className={`text-sm font-semibold ${cls}`} title={v.en}>
        {v.glyph}
      </div>
      <div className="mt-0.5 text-[11px] leading-snug text-slate-600">{note}</div>
    </td>
  );
}

export function LegalFramework() {
  const [data, setData] = useState<LegalOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .legal()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  // Catalogue: prefer the API's refs (same data), fall back to the shared constant so the section renders offline.
  const byJurisdiction = useMemo(() => {
    const refs = data?.refs?.length ? data.refs : Object.values(LEGAL_REFS);
    const groups = new Map<string, LegalRef[]>();
    for (const r of refs) groups.set(r.jurisdiction, [...(groups.get(r.jurisdiction) ?? []), r]);
    const order = ['CR', 'EE', 'SG', 'EU', 'UY', 'BR'];
    const rank = (j: string) => (order.includes(j) ? order.indexOf(j) : order.length);
    return Array.from(groups.entries()).sort(([a], [b]) => rank(a) - rank(b));
  }, [data]);

  const counts = useMemo(() => {
    const c: Record<LegalStatus, number> = { hoy: 0, parcial: 0, ley: 0 };
    for (const w of data?.workflows ?? []) for (const s of w.steps) c[s.legal.status] = (c[s.legal.status] ?? 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Marco legal
          <Tip en="Legal framework — what of this can be done in Costa Rica today?" />
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          <strong className="text-slate-900">¿Qué de esto se puede hacer hoy en Costa Rica?</strong> Más de lo que parece. La Ley 8220
          prohíbe desde 2002 pedirle a la persona lo que otra institución ya tiene; la Ley 8454 da validez a la firma digital desde
          2005; la Ley 8968 exige consentimiento y finalidad. Lo que no existe es la pieza que lo hace cumplir: una plataforma de
          interoperabilidad obligatoria, registros base designados y una identidad digital que ninguna institución pueda rechazar.
          Cada paso de este demo lleva una etiqueta: <span className="whitespace-nowrap">verde si ya es posible,</span> ámbar si lo es a
          medias, roja si requiere una ley. Los chips enlazan al texto de cada instrumento.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5" title={LEGAL_STATUS_LABELS[s].en}>
              <LegalBadge status={s} size="xs" />
              {data && <span className="text-slate-500">{counts[s]} pasos</span>}
            </span>
          ))}
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <section aria-labelledby="por-tramite" className="space-y-4">
        <h2 id="por-tramite" className="text-lg font-semibold text-slate-900">
          Estado por trámite y por paso
          <Tip en="Per workflow and per step: status today, Costa Rican basis, reference model" />
        </h2>
        {!data ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> Cargando el marco legal…
          </div>
        ) : (
          data.workflows.map((w) => <WorkflowTable key={w.id} w={w} />)
        )}
      </section>

      <section aria-labelledby="catalogo" className="space-y-4">
        <h2 id="catalogo" className="text-lg font-semibold text-slate-900">
          Catálogo de instrumentos
          <Tip en="Catalogue of legal instruments, grouped by jurisdiction" />
        </h2>
        {byJurisdiction.map(([j, refs]) => {
          const label = JURISDICTION_LABELS[j] ?? { es: j, en: j, flag: '' };
          return (
            <div key={j}>
              <h3 className="mb-2 text-sm font-semibold text-slate-800" title={label.en}>
                <span aria-hidden="true">{label.flag}</span> {label.es}
                <span className="ml-2 text-xs font-normal text-slate-500">{refs.length}</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {refs.map((r) => (
                  <RefCard key={r.id} r={r} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="matriz" className="space-y-3">
        <h2 id="matriz" className="text-lg font-semibold text-slate-900">
          Matriz comparativa
          <Tip en="Comparative matrix: the six legal foundations of once-only government" />
        </h2>
        <p className="max-w-3xl text-sm text-slate-600">
          Seis cimientos que todo gobierno digital maduro tiene por ley, comparados con lo que Costa Rica tiene hoy.
        </p>
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Cimiento</th>
                {MATRIX_COLUMNS.map((c) => (
                  <th key={c.id} className="px-3 py-2 font-medium">
                    <span aria-hidden="true">{c.flag}</span> {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LEGAL_MATRIX.map((row) => (
                <tr key={row.id} className="align-top">
                  <th scope="row" className="px-3 py-2 text-left text-sm font-medium text-slate-900" title={row.labelEn}>
                    {row.label}
                  </th>
                  {MATRIX_COLUMNS.map((c) => (
                    <MatrixCell key={c.id} value={row.cells[c.id].value} note={row.cells[c.id].note} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          ✔ existe por ley · parcial existe sin fuerza plena · ✘ no existe.{' '}
          <Link to="/por-que" className="text-primary-700 hover:underline">
            Por qué importa →
          </Link>
        </p>
      </section>
    </div>
  );
}
