import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AgencyName, WorkflowStep, WorkflowTransaction } from '@pvg/shared';
import { api, errorMessage } from '../api';
import { Alert } from '../components/Alert';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatCrc, formatDate, formatDecimal, formatInt, formatMs } from '../format';
import { AGENCIES, AGENCY_LABELS, AGENCY_LABELS_EN } from '../labels';

const POLL_MS = 700;

const STEP_EN: Record<AgencyName, string> = {
  registro: 'Identity re-validated against the Civil Registry',
  tributacion: 'Tax ID (NITE) issued',
  ccss: 'Employer registered with social security',
  municipalidad: 'Municipal business licence (patente) issued',
};

function elapsedMs(step: WorkflowStep, now: number): number | null {
  if (!step.startedAt) return null;
  const start = new Date(step.startedAt).getTime();
  const end = step.finishedAt ? new Date(step.finishedAt).getTime() : now;
  return Math.max(0, end - start);
}

function StepIcon({ status }: { status: WorkflowStep['status'] }) {
  switch (status) {
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

function StepTracker({ txn, now }: { txn: WorkflowTransaction; now: number }) {
  // Always render the four agencies in workflow order, even before the API reports the step.
  const rows = AGENCIES.map(
    (agency) => txn.steps.find((s) => s.agency === agency) ?? ({ agency, label: AGENCY_LABELS[agency], status: 'pending' } as WorkflowStep),
  );
  return (
    <ol className="divide-y divide-slate-100">
      {rows.map((s) => {
        const ms = elapsedMs(s, now);
        return (
          <li key={s.agency} className="flex items-center gap-3 py-3" title={STEP_EN[s.agency]}>
            <StepIcon status={s.status} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900">{AGENCY_LABELS[s.agency]}</div>
              <div className="truncate text-xs text-slate-500">
                {s.status === 'error' ? <span className="text-red-700">{s.error ?? 'Error'}</span> : s.label}
              </div>
            </div>
            <div className="w-20 text-right font-mono text-xs text-slate-500">{ms !== null ? formatMs(ms) : '—'}</div>
            <div className="hidden w-36 truncate text-right font-mono text-xs text-slate-500 sm:block">
              {s.exchangeId ?? ''}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ResultCard({ title, en, source, exchangeId, children }: {
  title: string;
  en: string;
  source: AgencyName;
  exchangeId?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
          <Tip en={en} />
        </h3>
        <ProvenanceBadge source={source} exchangeId={exchangeId} />
      </div>
      <dl className="space-y-1.5 text-sm">{children}</dl>
    </article>
  );
}

function Row({ k, v, mono = false }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`text-right text-slate-900 ${mono ? 'font-mono' : ''}`}>{v}</dd>
    </div>
  );
}

export function Transaction() {
  const { txnId = '' } = useParams();
  const [txn, setTxn] = useState<WorkflowTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const doneRef = useRef(false);

  // Poll status every 700 ms until completed/failed, then fetch the full result.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    doneRef.current = false;

    async function tick() {
      try {
        const status = await api.businessStatus(txnId);
        if (cancelled) return;
        setNow(Date.now());
        if (status.status === 'completed') {
          const full = await api.businessResult(txnId);
          if (cancelled) return;
          doneRef.current = true;
          setTxn(full);
          return;
        }
        setTxn(status);
        if (status.status === 'failed') {
          doneRef.current = true;
          return;
        }
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
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [txn]);

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const blob = await api.businessResultPdf(txnId);
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
        <Link to="/" className="btn-secondary">
          ← Volver al inicio
        </Link>
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

  const stepByAgency = (a: AgencyName) => txn.steps.find((s) => s.agency === a);
  const result = txn.result;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/" className="text-sm text-primary-700 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {txn.status === 'completed' && '¡Su negocio está inscrito!'}
          {txn.status === 'running' && 'Procesando su solicitud…'}
          {txn.status === 'failed' && 'No se pudo completar el trámite'}
          <Tip
            en={
              txn.status === 'completed'
                ? 'Your business is registered'
                : txn.status === 'running'
                  ? 'Processing your request'
                  : 'The procedure could not be completed'
            }
          />
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Trámite <span className="font-mono">{txn.txnId}</span> · {txn.request.businessName} ·{' '}
          {formatDate(txn.createdAt)}
        </p>
      </div>

      {error && <Alert kind="warning">{error}</Alert>}

      <section className="card" aria-labelledby="pasos">
        <h2 id="pasos" className="mb-1 text-base font-semibold text-slate-900">
          Intercambios con las instituciones
          <Tip en="Each row is one exchange through the interoperability bus, with its audit reference" />
        </h2>
        <p className="mb-2 text-xs text-slate-500">
          Cada fila es una consulta a través del bus de interoperabilidad; el identificador de intercambio es su
          referencia de auditoría.
        </p>
        <StepTracker txn={txn} now={now} />
      </section>

      {txn.status === 'failed' && (
        <div className="space-y-4">
          <Alert kind="error">
            {txn.steps.find((s) => s.status === 'error')?.error ??
              'Una de las instituciones no pudo procesar la solicitud. Ningún dato quedó a medias: puede intentarlo de nuevo.'}
          </Alert>
          <div className="flex gap-3">
            <Link to="/negocio/nuevo" className="btn-primary">
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
          <Alert kind="success">
            Listo. En un solo trámite obtuvo su inscripción tributaria, su registro patronal y su patente municipal, sin
            visitar ninguna oficina.
          </Alert>

          <section className="grid gap-4 sm:grid-cols-2" aria-label="Resultados">
            <ResultCard title="Inscripción tributaria" en="Tax registration (Ministry of Finance)" source="tributacion" exchangeId={stepByAgency('tributacion')?.exchangeId}>
              <Row k="NITE" v={result.tax.nite} mono />
              <Row k="Régimen" v={result.tax.taxRegime === 'simplified' ? 'Simplificado' : 'Tradicional'} />
              <Row k="Actividad" v={`${result.tax.activityCode} · ${result.tax.activityDescription}`} />
              <Row k="Inscrito el" v={formatDate(result.tax.registrationDate)} />
            </ResultCard>

            <ResultCard title="Registro patronal CCSS" en="Employer registration (social security)" source="ccss" exchangeId={stepByAgency('ccss')?.exchangeId}>
              <Row k="Número patronal" v={result.ccss.employerNumber} mono />
              <Row k="Tipo" v={result.ccss.registrationType === 'employer' ? 'Patrono' : 'Trabajador independiente'} />
              <Row k="Cuota mensual estimada" v={formatCrc(result.ccss.monthlyContributionRateCrc)} />
              <Row k="Inscrito el" v={formatDate(result.ccss.registrationDate)} />
            </ResultCard>

            <ResultCard title="Patente municipal" en="Municipal business licence" source="municipalidad" exchangeId={stepByAgency('municipalidad')?.exchangeId}>
              <Row k="Número de patente" v={result.municipality.patenteNumber} mono />
              <Row k="Municipalidad" v={result.municipality.municipality} />
              <Row k="Vence el" v={formatDate(result.municipality.expiryDate)} />
              <Row k="Monto anual" v={formatCrc(result.municipality.annualFeeCrc)} />
            </ResultCard>

            <ResultCard title="Identidad validada" en="Identity validated against the Civil Registry" source="registro" exchangeId={stepByAgency('registro')?.exchangeId}>
              <Row k="Nombre" v={result.citizen.fullName} />
              <Row k="Cédula" v={result.citizen.id} mono />
              <Row k="Cantón" v={result.citizen.canton} />
              <Row k="Estado" v={<span className="font-medium text-green-700">Verificada</span>} />
            </ResultCard>
          </section>

          <section className="card" aria-labelledby="una-sola-vez">
            <h2 id="una-sola-vez" className="text-base font-semibold text-slate-900">
              Panel «una sola vez»
              <Tip en="Once-only panel — every field you did not have to type, and where it came from" />
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Estos {result.onceOnly.length} datos no los escribió usted: el Estado ya los tenía y los compartió con su
              consentimiento.
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
                    <tr key={`${o.source}-${o.field}`} title={`${o.field} · ${AGENCY_LABELS_EN[o.source]}`}>
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

          <section className="card border-green-200 bg-green-50/50" aria-labelledby="beneficios">
            <h2 id="beneficios" className="text-base font-semibold text-slate-900">
              Beneficios de la automatización
              <Tip en="Benefits of automation — estimated savings versus the paper-based procedure" />
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-3xl font-semibold text-green-800">{formatInt(result.benefits.tripsAvoided)}</div>
                <div className="text-sm text-slate-700">
                  visitas a oficinas evitadas
                  <Tip en="Office visits avoided" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-green-800">{formatDecimal(result.benefits.hoursSaved)} h</div>
                <div className="text-sm text-slate-700">
                  de su tiempo ahorradas
                  <Tip en="Hours saved" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-green-800">{formatCrc(result.benefits.costSavedCrc)}</div>
                <div className="text-sm text-slate-700">
                  en costos evitados
                  <Tip en="Cost avoided (transport, copies, lost wages)" />
                </div>
              </div>
            </div>
          </section>

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
