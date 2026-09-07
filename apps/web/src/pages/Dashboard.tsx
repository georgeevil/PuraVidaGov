import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AGENCY_SHORT, type Citizen, type WorkflowDefinition } from '@pvg/shared/data';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Alert } from '../components/Alert';
import { LegalBadge } from '../components/LegalBadge';
import { LegalPanel } from '../components/LegalPanel';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatDate } from '../format';
import { agencyLabelEn } from '../labels';

const PROFILE_FIELDS: Array<{ key: keyof Citizen; label: string; en: string; format?: (v: string) => string }> = [
  { key: 'fullName', label: 'Nombre completo', en: 'Full name' },
  { key: 'id', label: 'Cédula', en: 'National ID' },
  { key: 'dateOfBirth', label: 'Fecha de nacimiento', en: 'Date of birth', format: formatDate },
  { key: 'address', label: 'Dirección', en: 'Address' },
  { key: 'canton', label: 'Cantón', en: 'Canton (municipality)' },
];

export function AgencyChips({ agencies }: { agencies: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Instituciones">
      {agencies.map((a) => (
        <li
          key={a}
          title={agencyLabelEn(a)}
          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
        >
          {(AGENCY_SHORT as Record<string, string>)[a] ?? a}
        </li>
      ))}
    </ul>
  );
}

function WorkflowCard({ w }: { w: WorkflowDefinition }) {
  const [why, setWhy] = useState(false);
  return (
    <article className={`card flex flex-col ${w.available ? '' : 'bg-slate-50'}`} title={w.titleEn}>
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-base font-semibold ${w.available ? 'text-slate-900' : 'text-slate-600'}`}>
          {w.title}
          {w.titleEn && <Tip en={w.titleEn} />}
        </h3>
        {w.legal && <LegalBadge status={w.legal.status} />}
      </div>
      <p className={`mt-1 flex-1 text-sm ${w.available ? 'text-slate-700' : 'text-slate-500'}`} title={w.descriptionEn}>
        {w.description}
      </p>
      {w.agencies?.length > 0 && (
        <div className="mt-3">
          <AgencyChips agencies={w.agencies} />
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {w.available ? (
          <Link to={`/tramite/${encodeURIComponent(w.id)}`} className="btn-primary">
            Iniciar
          </Link>
        ) : (
          <>
            <span className="btn-secondary cursor-not-allowed opacity-60" aria-disabled="true">
              Próximamente
            </span>
            {w.legal && (
              <button
                type="button"
                className="text-sm text-primary-700 hover:underline"
                aria-expanded={why}
                onClick={() => setWhy((v) => !v)}
                title="Why not today?"
              >
                {why ? 'Ocultar' : '¿Por qué no hoy?'}
              </button>
            )}
          </>
        )}
      </div>
      {!w.available && why && w.legal && (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
          <LegalPanel note={w.legal} compact />
        </div>
      )}
    </article>
  );
}

export function Dashboard() {
  const { citizen, provenance, updateProfile } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .workflows()
      .then((w) => !cancelled && setWorkflows(w))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshProfile() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await api.profile();
      updateProfile(res.citizen, res.provenance);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  if (!citizen) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Hola, {citizen.firstName}
          <Tip en="Hello" />
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sus datos ya están en poder del Estado. Aquí puede usarlos sin volver a escribirlos.
        </p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <section className="card" aria-labelledby="perfil">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="perfil" className="text-lg font-semibold text-slate-900">
            Mi perfil
            <Tip en="My profile — every value shows the agency it came from" />
          </h2>
          <button type="button" className="btn-secondary !py-1 text-xs" onClick={refreshProfile} disabled={refreshing}>
            {refreshing ? <Spinner className="h-3 w-3" /> : null}
            Actualizar desde Registro Civil
          </button>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          {PROFILE_FIELDS.map((f) => {
            const raw = String(citizen[f.key] ?? '');
            return (
              <div key={f.key} className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {f.label}
                  <Tip en={f.en} />
                </dt>
                <dd className="mt-0.5 text-sm text-slate-900">{f.format ? f.format(raw) : raw}</dd>
                {provenance && (
                  <dd className="mt-1">
                    <ProvenanceBadge source={provenance.source} exchangeId={provenance.exchangeId} fetchedAt={provenance.fetchedAt} />
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
        {provenance && (
          <p className="mt-4 text-xs text-slate-500">
            Consultado a {AGENCY_SHORT[provenance.source] ?? provenance.source} el{' '}
            {new Date(provenance.fetchedAt).toLocaleString('es-CR')} · intercambio{' '}
            <span className="font-mono">{provenance.exchangeId}</span>. Cada consulta queda registrada en{' '}
            <Link to="/auditoria" className="text-primary-700 underline">
              Mis datos compartidos
            </Link>
            .
          </p>
        )}
      </section>

      <section aria-labelledby="eventos">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="eventos" className="text-lg font-semibold text-slate-900">
            ¿Qué desea hacer hoy?
            <Tip en="Life events — services organised around what happens in your life, not around agencies" />
          </h2>
          <Link to="/marco-legal" className="text-sm text-primary-700 hover:underline" title="What does each badge mean?">
            ¿Qué significa cada etiqueta?
          </Link>
        </div>
        {!workflows ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> Cargando eventos de vida…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((w) => (
              <WorkflowCard key={w.id} w={w} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/mis-tramites" className="card block transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-900">
            Mis trámites
            <Tip en="My procedures — everything you have started here" />
          </h3>
          <p className="mt-1 text-sm text-slate-600">Los trámites que ha iniciado, su estado y sus constancias.</p>
        </Link>
        <Link to="/auditoria" className="card block transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-900">
            Mis datos compartidos
            <Tip en="My shared data — who accessed what, when and why" />
          </h3>
          <p className="mt-1 text-sm text-slate-600">Qué institución consultó sus datos, cuándo, con qué propósito y consentimiento.</p>
        </Link>
        <Link to="/marco-legal" className="card block transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-900">
            Marco legal
            <Tip en="Legal framework — what is possible in Costa Rica today" />
          </h3>
          <p className="mt-1 text-sm text-slate-600">Qué de todo esto se puede hacer hoy y qué necesita una ley.</p>
        </Link>
        <Link to="/arquitectura" className="card block transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-900">
            Cómo funciona
            <Tip en="How it works — the interoperability bus and the once-only principle" />
          </h3>
          <p className="mt-1 text-sm text-slate-600">El bus de interoperabilidad, las instituciones y «una sola vez».</p>
        </Link>
      </section>
    </div>
  );
}
