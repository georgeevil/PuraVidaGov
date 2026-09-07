import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Citizen } from '@pvg/shared';
import { api, errorMessage, type ServiceCatalogueEntry } from '../api';
import { useAuth } from '../auth';
import { Alert } from '../components/Alert';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatDate } from '../format';
import { AGENCY_SHORT } from '../labels';

const PROFILE_FIELDS: Array<{ key: keyof Citizen; label: string; en: string; format?: (v: string) => string }> = [
  { key: 'fullName', label: 'Nombre completo', en: 'Full name' },
  { key: 'id', label: 'Cédula', en: 'National ID' },
  { key: 'dateOfBirth', label: 'Fecha de nacimiento', en: 'Date of birth', format: formatDate },
  { key: 'address', label: 'Dirección', en: 'Address' },
  { key: 'canton', label: 'Cantón', en: 'Canton (municipality)' },
];

export function Dashboard() {
  const { citizen, provenance, updateProfile } = useAuth();
  const [services, setServices] = useState<ServiceCatalogueEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .services()
      .then((s) => !cancelled && setServices(s))
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
                    <ProvenanceBadge
                      source={provenance.source}
                      exchangeId={provenance.exchangeId}
                      fetchedAt={provenance.fetchedAt}
                    />
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
        {provenance && (
          <p className="mt-4 text-xs text-slate-500">
            Consultado a {AGENCY_SHORT[provenance.source]} el {new Date(provenance.fetchedAt).toLocaleString('es-CR')} ·
            intercambio <span className="font-mono">{provenance.exchangeId}</span>. Cada consulta queda registrada en{' '}
            <Link to="/auditoria" className="text-primary-700 underline">
              Mis datos compartidos
            </Link>
            .
          </p>
        )}
      </section>

      <section aria-labelledby="eventos">
        <h2 id="eventos" className="mb-3 text-lg font-semibold text-slate-900">
          ¿Qué desea hacer hoy?
          <Tip en="Life events — services organised around what happens in your life, not around agencies" />
        </h2>
        {!services ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> Cargando servicios…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article
                key={s.id}
                className={`card flex flex-col ${s.available ? '' : 'bg-slate-50 text-slate-500'}`}
                title={s.titleEn}
              >
                <h3 className={`text-base font-semibold ${s.available ? 'text-slate-900' : 'text-slate-500'}`}>
                  {s.title}
                  {s.titleEn && <Tip en={s.titleEn} />}
                </h3>
                <p className="mt-1 flex-1 text-sm">{s.description}</p>
                {s.agencies?.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Instituciones: {s.agencies.map((a) => AGENCY_SHORT[a] ?? a).join(', ')}
                  </p>
                )}
                <div className="mt-4">
                  {s.available ? (
                    <Link to={s.id === 'start-business' ? '/negocio/nuevo' : '/'} className="btn-primary">
                      Iniciar
                    </Link>
                  ) : (
                    <span className="btn-secondary cursor-not-allowed opacity-60" aria-disabled="true">
                      Próximamente
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/auditoria" className="card block transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-900">
            Mis datos compartidos
            <Tip en="My shared data — who accessed what, when and why" />
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Vea qué institución consultó sus datos, cuándo, con qué propósito y con qué consentimiento.
          </p>
        </Link>
        <Link to="/arquitectura" className="card block transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-900">
            Cómo funciona
            <Tip en="How it works — the interoperability bus and the once-only principle" />
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            El bus de interoperabilidad, las instituciones conectadas y el principio de «una sola vez».
          </p>
        </Link>
      </section>
    </div>
  );
}
