import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Activity, BusinessType } from '@pvg/shared';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Alert } from '../components/Alert';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatDate } from '../format';
import { MUNICIPALITIES } from '../labels';

interface FormState {
  businessName: string;
  businessType: BusinessType;
  activityCode: string;
  address: string;
  municipality: string;
  estimatedEmployees: string;
  consent: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.consent) e.consent = 'Debe autorizar el intercambio de datos para continuar.';
  if (f.businessName.trim().length < 3) e.businessName = 'Indique el nombre del negocio (mínimo 3 caracteres).';
  if (f.businessName.trim().length > 120) e.businessName = 'El nombre es demasiado largo (máximo 120 caracteres).';
  if (!f.activityCode) e.activityCode = 'Seleccione la actividad económica.';
  if (f.address.trim().length < 5) e.address = 'Indique la dirección del negocio.';
  if (!f.municipality) e.municipality = 'Seleccione la municipalidad.';
  const n = Number(f.estimatedEmployees);
  if (f.estimatedEmployees === '' || !Number.isInteger(n) || n < 0 || n > 10000) {
    e.estimatedEmployees = 'Indique un número entero de 0 a 10 000.';
  }
  return e;
}

export function NewBusiness() {
  const { citizen, provenance } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [form, setForm] = useState<FormState>({
    businessName: '',
    businessType: 'natural',
    activityCode: '',
    address: '',
    municipality: citizen?.canton ?? '',
    estimatedEmployees: '0',
    consent: false,
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .activities()
      .then((a) => !cancelled && setActivities(a))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(() => validate(form), [form]);
  const municipalityOptions = useMemo(() => {
    const list = [...MUNICIPALITIES];
    if (citizen?.canton && !list.includes(citizen.canton)) list.unshift(citizen.canton);
    return list;
  }, [citizen?.canton]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!citizen || Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      const { txnId } = await api.registerBusiness({
        citizenId: citizen.id,
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        activityCode: form.activityCode,
        address: form.address.trim(),
        municipality: form.municipality,
        estimatedEmployees: Number(form.estimatedEmployees),
        consent: true,
      });
      navigate(`/negocio/${encodeURIComponent(txnId)}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (!citizen) return null;
  const show = (k: keyof FormState) => (touched ? errors[k] : undefined);

  const personal: Array<{ label: string; en: string; value: string }> = [
    { label: 'Nombre completo', en: 'Full name', value: citizen.fullName },
    { label: 'Cédula', en: 'National ID', value: citizen.id },
    { label: 'Fecha de nacimiento', en: 'Date of birth', value: formatDate(citizen.dateOfBirth) },
    { label: 'Nacionalidad', en: 'Nationality', value: citizen.nationality === 'CR' ? 'Costarricense' : citizen.nationality },
    { label: 'Dirección', en: 'Address', value: citizen.address },
    { label: 'Cantón', en: 'Canton', value: citizen.canton },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/" className="text-sm text-primary-700 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Iniciar un negocio
          <Tip en="Start a business — one form, four agencies" />
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Un solo formulario: Tributación, CCSS y la Municipalidad reciben lo que necesitan a través del bus de
          interoperabilidad.
        </p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <section className="card border-primary-100 bg-primary-50/40" aria-labelledby="consentimiento">
        <h2 id="consentimiento" className="text-base font-semibold text-slate-900">
          Consentimiento
          <Tip en="Consent — required before any data exchange (Ley 8968)" />
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          Al continuar, usted autoriza compartir sus datos con las instituciones involucradas: Registro Civil,
          Tributación, CCSS y Municipalidad.
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
          />
          <span>Autorizo el intercambio de mis datos para este trámite. Cada consulta quedará registrada.</span>
        </label>
        {show('consent') && <p className="field-error">{errors.consent}</p>}
      </section>

      <section className="card" aria-labelledby="datos-estado">
        <h2 id="datos-estado" className="text-base font-semibold text-slate-900">
          Sus datos (ya en poder del Estado)
          <Tip en="Your data — already held by the State; you do not type it again (once-only principle)" />
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          No es necesario volver a escribirlos. Se toman directamente del Registro Civil.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {personal.map((p) => (
            <div key={p.label}>
              <dt className="label !mb-0">
                {p.label}
                <Tip en={p.en} />
              </dt>
              <dd>
                <input className="input" value={p.value} readOnly disabled aria-readonly="true" />
                {provenance && (
                  <div className="mt-1">
                    <ProvenanceBadge source={provenance.source} exchangeId={provenance.exchangeId} />
                  </div>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card" aria-labelledby="datos-negocio">
        <h2 id="datos-negocio" className="text-base font-semibold text-slate-900">
          Datos del negocio
          <Tip en="Business details — the only thing you have to type" />
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="businessName" className="label">
              Nombre del negocio
              <Tip en="Business name" />
            </label>
            <input
              id="businessName"
              className="input"
              maxLength={120}
              placeholder="Ej.: Soda La Esquina"
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
              aria-invalid={Boolean(show('businessName'))}
            />
            {show('businessName') && <p className="field-error">{errors.businessName}</p>}
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="label">
              Tipo de contribuyente
              <Tip en="Business type: natural person or company" />
            </legend>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ['natural', 'Persona física', 'Natural person (simplified tax regime)'],
                  ['legal', 'Sociedad', 'Legal entity / company (traditional regime)'],
                ] as Array<[BusinessType, string, string]>
              ).map(([value, label, en]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800" title={en}>
                  <input
                    type="radio"
                    name="businessType"
                    className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-600"
                    checked={form.businessType === value}
                    onChange={() => set('businessType', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="sm:col-span-2">
            <label htmlFor="activityCode" className="label">
              Actividad económica
              <Tip en="Economic activity (CIIU-like code)" />
            </label>
            <select
              id="activityCode"
              className="input"
              value={form.activityCode}
              onChange={(e) => set('activityCode', e.target.value)}
              disabled={!activities}
              aria-invalid={Boolean(show('activityCode'))}
            >
              <option value="">{activities ? 'Seleccione una actividad…' : 'Cargando…'}</option>
              {activities?.map((a) => (
                <option key={a.code} value={a.code} title={a.descriptionEn}>
                  {a.code} · {a.description}
                </option>
              ))}
            </select>
            {show('activityCode') && <p className="field-error">{errors.activityCode}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="label">
              Dirección del negocio
              <Tip en="Business address" />
            </label>
            <input
              id="address"
              className="input"
              placeholder="Ej.: 100 m norte de la iglesia, San Pedro"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              aria-invalid={Boolean(show('address'))}
            />
            {show('address') && <p className="field-error">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="municipality" className="label">
              Municipalidad
              <Tip en="Municipality that issues the patente (defaults to your canton)" />
            </label>
            <select
              id="municipality"
              className="input"
              value={form.municipality}
              onChange={(e) => set('municipality', e.target.value)}
              aria-invalid={Boolean(show('municipality'))}
            >
              <option value="">Seleccione…</option>
              {municipalityOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m === citizen.canton ? ' (su cantón)' : ''}
                </option>
              ))}
            </select>
            {show('municipality') && <p className="field-error">{errors.municipality}</p>}
          </div>

          <div>
            <label htmlFor="estimatedEmployees" className="label">
              Empleados estimados
              <Tip en="Estimated employees (0 = self-employed)" />
            </label>
            <input
              id="estimatedEmployees"
              type="number"
              min={0}
              max={10000}
              step={1}
              className="input"
              value={form.estimatedEmployees}
              onChange={(e) => set('estimatedEmployees', e.target.value)}
              aria-invalid={Boolean(show('estimatedEmployees'))}
            />
            {show('estimatedEmployees') && <p className="field-error">{errors.estimatedEmployees}</p>}
            <p className="mt-1 text-xs text-slate-500">Con 0 empleados se inscribe como trabajador independiente.</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link to="/" className="btn-secondary">
          Cancelar
        </Link>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy && <Spinner className="h-4 w-4 text-white" />}
          Enviar solicitud
        </button>
      </div>
    </form>
  );
}
