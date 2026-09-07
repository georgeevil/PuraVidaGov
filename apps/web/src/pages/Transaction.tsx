import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AGENCY_LABELS, type Benefits, type ResultCard as ResultCardData, type WorkflowStep, type WorkflowTransaction } from '@pvg/shared/data';
import { api, errorMessage } from '../api';
import { Alert } from '../components/Alert';
import { LegalBadge } from '../components/LegalBadge';
import { LegalPanel } from '../components/LegalPanel';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatCrc, formatDateTime, formatDecimal, formatInt, formatMs } from '../format';
import { agencyLabelEn } from '../labels';

const POLL_MS = 700;

function elapsedMs(step: WorkflowStep, now: number): number | null {
  if (!step.startedAt) return null;
  const start = new Date(step.startedAt).getTime();
  const end = step.finishedAt ? new Date(step.finishedAt).getTime() : now;
  return Math.max(0, end - start);
}

function StepIcon({ step }: { step: WorkflowStep }) {
  if (step.skipped) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300 text-[10px] font-bold text-slate-400" aria-label="Omitido">
        –
      </span>
    );
  }
  switch (step.status) {
    case 'running':
      return <Spinner className="h-5 w-5" />;
    case 'done':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white" aria-label="Completado">
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden="true">
            <path d="M6.5 11.5 3 8l1.2-1.2 2.3 2.3 5.3-5.3L13 5z" />
          </svg>
        </span>
      );
    case 'error':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white" aria-label="Error">
          !
        </span>
      );
    default:
      return <span className="block h-5 w-5 rounded-full border-2 border-slate-300" aria-label="Pendiente" />;
  }
}

function StepRow({ step, now }: { step: WorkflowStep; now: number }) {
  const [open, setOpen] = useState(false);
  const ms = elapsedMs(step, now);
  const agency = (AGENCY_LABELS as Record<string, string>)[step.agency] ?? step.agency;
  return (
    <li className="py-3" title={agencyLabelEn(step.agency)}>
      <div className="flex items-center gap-3">
        <StepIcon step={step} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-slate-900">{agency}</span>
            {step.legal && <LegalBadge status={step.legal.status} size="xs" />}
          </div>
          <div className="truncate text-xs text-slate-500">
            {step.status === 'error' ? (
              <span className="text-red-700">{step.error ?? 'Error'}</span>
            ) : step.skipped ? (
              <span className="italic">Omitido — {step.label}</span>
            ) : (
              step.label
            )}
          </div>
        </div>
        <div className="w-20 text-right font-mono text-xs text-slate-500">{step.skipped ? 'omitido' : ms !== null ? formatMs(ms) : '—'}</div>
        <div className="hidden w-36 truncate text-right font-mono text-xs text-slate-500 sm:block">{step.exchangeId ?? ''}</div>
        {step.legal && (
          <button
            type="button"
            className="shrink-0 text-xs text-primary-700 hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            title="Can this step be done in Costa Rica today?"
          >
            {open ? 'Cerrar' : '¿Se puede hoy?'}
          </button>
        )}
      </div>
      {open && step.legal && (
        <div className="ml-8 mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <LegalPanel note={step.legal} compact />
        </div>
      )}
    </li>
  );
}

function ResultCard({ card }: { card: ResultCardData }) {
  return (
    <article className="card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          {card.title}
          <Tip en={card.titleEn} />
        </h3>
        <ProvenanceBadge source={card.agency} exchangeId={card.exchangeId} />
      </div>
      <dl className="space-y-1.5 text-sm">
        {card.rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className="flex justify-between gap-3">
            <dt className="text-slate-500">{r.label}</dt>
            <dd className="min-w-0 break-words text-right text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function BenefitsPanel({ b }: { b: Benefits }) {
  const hasDays = b.daysTraditional !== undefined && b.daysDigital !== undefined;
  return (
    <section className="card border-green-200 bg-green-50/50" aria-labelledby="beneficios">
      <h2 id="beneficios" className="text-base font-semibold text-slate-900">
        Beneficios
        <Tip en="Benefits — estimated savings versus the paper-based procedure" />
      </h2>
      <div className={`mt-3 grid gap-4 sm:grid-cols-3 ${hasDays ? 'lg:grid-cols-4' : ''}`}>
        <div>
          <div className="text-3xl font-semibold text-green-800">{formatInt(b.tripsAvoided)}</div>
          <div className="text-sm text-slate-700">
            visitas a oficinas evitadas
            <Tip en="Office visits avoided" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-semibold text-green-800">{formatDecimal(b.hoursSaved)} h</div>
          <div className="text-sm text-slate-700">
            de su tiempo ahorradas
            <Tip en="Hours saved" />
          </div>
        </div>
        <div>
          <div className="text-3xl font-semibold text-green-800">{formatCrc(b.costSavedCrc)}</div>
          <div className="text-sm text-slate-700">
            en costos evitados
            <Tip en="Cost avoided (transport, copies, lost wages)" />
          </div>
        </div>
        {hasDays && (
          <div>
            <div className="text-3xl font-semibold text-green-800">
              {formatInt(b.daysTraditional!)} {b.daysTraditional === 1 ? 'día' : 'días'} <span className="text-slate-400">→</span>{' '}
              {formatInt(b.daysDigital!)} {b.daysDigital === 1 ? 'día' : 'días'}
            </div>
            <div className="text-sm text-slate-700">
              plazo tradicional → digital
              <Tip en="Calendar days: traditional process → this one" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Transaction() {
  const { id = '', txnId = '' } = useParams();
  const [txn, setTxn] = useState<WorkflowTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Poll status every 700 ms until completed/failed, then fetch the full result.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const status = await api.transaction(txnId);
        if (cancelled) return;
        setNow(Date.now());
        if (status.status === 'completed') {
          const full = await api.transactionResult(txnId);
          if (cancelled) return;
          setTxn(full);
          return;
        }
        setTxn(status);
        if (status.status === 'failed') return;
        timer = setTimeout(tick, POLL_MS);
      } catch (err) {
        if (cancelled) return;
        setError(errorMessage(err));
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [txnId]);

  // Keep the elapsed column ticking while a step is running.
  useEffect(() => {
    if (!txn || txn.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [txn]);

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const blob = await api.transactionPdf(txnId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PuraVidaGov-${txnId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      setPdfError(errorMessage(err));
    } finally {
      setPdfBusy(false);
    }
  }

  if (error && !txn) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert kind="error">{error}</Alert>
        <div className="flex gap-3">
          <Link to="/mis-tramites" className="btn-secondary">
            ← Mis trámites
          </Link>
          <Link to="/" className="btn-secondary">
            Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Spinner /> Cargando trámite…
      </div>
    );
  }

  const workflowId = txn.workflowId || id;
  const result = txn.result;
  const failedStep = txn.steps.find((s) => s.status === 'error');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/mis-tramites" className="text-sm text-primary-700 hover:underline">
          ← Mis trámites
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {txn.status === 'completed' && (result?.headline ?? 'Trámite completado')}
          {txn.status === 'running' && 'Procesando su solicitud…'}
          {txn.status === 'failed' && 'No se pudo completar el trámite'}
          <Tip
            en={
              txn.status === 'completed'
                ? result?.headlineEn ?? 'Procedure completed'
                : txn.status === 'running'
                  ? 'Processing your request'
                  : 'The procedure could not be completed'
            }
          />
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {txn.workflowTitle} · trámite <span className="font-mono">{txn.txnId}</span> · {formatDateTime(txn.createdAt)}
        </p>
      </div>

      {error && <Alert kind="warning">{error}</Alert>}

      <section className="card" aria-labelledby="pasos">
        <h2 id="pasos" className="mb-1 text-base font-semibold text-slate-900">
          Intercambios con las instituciones
          <Tip en="Each row is one exchange through the interoperability bus, with its audit reference and its legal status today" />
        </h2>
        <p className="mb-2 text-xs text-slate-500">
          Cada fila es una consulta a través del bus de interoperabilidad; el identificador de intercambio es su referencia de
          auditoría. La etiqueta indica si ese paso se puede hacer hoy en Costa Rica.
        </p>
        <ol className="divide-y divide-slate-100">
          {txn.steps.map((s) => (
            <StepRow key={s.id} step={s} now={now} />
          ))}
        </ol>
      </section>

      {txn.status === 'failed' && (
        <div className="space-y-4">
          <Alert kind="error">
            {failedStep?.error ??
              'Una de las instituciones no pudo procesar la solicitud. Ningún dato quedó a medias: puede intentarlo de nuevo.'}
          </Alert>
          <div className="flex gap-3">
            <Link to={`/tramite/${encodeURIComponent(workflowId)}`} className="btn-primary">
              Intentar de nuevo
            </Link>
            <Link to="/" className="btn-secondary">
              Volver al inicio
            </Link>
          </div>
        </div>
      )}

      {txn.status === 'completed' && result && (
        <>
          <Alert kind="success">{result.summary}</Alert>

          {result.cards.length > 0 && (
            <section className="grid gap-4 sm:grid-cols-2" aria-label="Resultados">
              {result.cards.map((c, i) => (
                <ResultCard key={`${c.agency}-${i}`} card={c} />
              ))}
            </section>
          )}

          <section className="card" aria-labelledby="una-sola-vez">
            <h2 id="una-sola-vez" className="text-base font-semibold text-slate-900">
              Panel «una sola vez»
              <Tip en="Once-only panel — every field you did not have to type, and where it came from" />
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Estos {result.onceOnly.length} datos no los escribió usted: el Estado ya los tenía y los compartió con su consentimiento.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-medium">Dato</th>
                    <th className="py-2 pr-3 font-medium">Fuente</th>
                    <th className="py-2 font-medium">Intercambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.onceOnly.map((o) => (
                    <tr key={`${o.source}-${o.field}`} title={`${o.field} · ${agencyLabelEn(o.source)}`}>
                      <td className="py-2 pr-3 text-slate-900">{o.label}</td>
                      <td className="py-2 pr-3">
                        <ProvenanceBadge source={o.source} />
                      </td>
                      <td className="py-2 font-mono text-xs text-slate-500">{o.exchangeId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <BenefitsPanel b={result.benefits} />

          {pdfError && <Alert kind="error">{pdfError}</Alert>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" className="btn-primary" onClick={downloadPdf} disabled={pdfBusy} title="Download certificate (PDF)">
              {pdfBusy ? <Spinner className="h-4 w-4 text-white" /> : <span aria-hidden="true">⤓</span>}
              Descargar constancia (PDF)
            </button>
            <Link to="/auditoria" className="btn-secondary">
              Ver mis datos compartidos
            </Link>
            <Link to="/" className="text-sm text-primary-700 hover:underline">
              Volver al inicio
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
