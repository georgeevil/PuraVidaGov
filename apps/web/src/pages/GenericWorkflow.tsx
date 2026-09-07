import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Citizen, FormField, FormOption, WorkflowDefinition } from '@pvg/shared/data';
import { api, ApiError, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Alert } from '../components/Alert';
import { LegalBadge } from '../components/LegalBadge';
import { LegalPanel } from '../components/LegalPanel';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatDate } from '../format';
import { AgencyChips } from './Dashboard';

type Values = Record<string, string>;
type Errors = Record<string, string>;
type OptionsState = Record<string, FormOption[] | 'loading' | 'error'>;

const PERSONAL: Array<{ key: keyof Citizen; label: string; en: string; format?: (v: string) => string }> = [
  { key: 'fullName', label: 'Nombre completo', en: 'Full name' },
  { key: 'id', label: 'Cédula', en: 'National ID' },
  { key: 'dateOfBirth', label: 'Fecha de nacimiento', en: 'Date of birth', format: formatDate },
  { key: 'nationality', label: 'Nacionalidad', en: 'Nationality', format: (v) => (v === 'CR' ? 'Costarricense' : v) },
  { key: 'address', label: 'Dirección', en: 'Address' },
  { key: 'canton', label: 'Cantón', en: 'Canton' },
];

function initialValues(fields: FormField[], citizen: Citizen | null): Values {
  const v: Values = {};
  for (const f of fields) {
    let d = '';
    if (f.defaultFromCitizen && citizen) d = String(citizen[f.defaultFromCitizen] ?? '');
    if (!d && f.type === 'radio' && f.options?.length && f.required) d = f.options[0].value;
    v[f.name] = d;
  }
  return v;
}

function validate(fields: FormField[], values: Values, consent: boolean): Errors {
  const e: Errors = {};
  if (!consent) e.__consent = 'Debe autorizar el intercambio de datos para continuar.';
  for (const f of fields) {
    const raw = (values[f.name] ?? '').trim();
    if (f.required && raw === '') {
      e[f.name] = f.type === 'select' || f.type === 'radio' ? 'Seleccione una opción.' : 'Este campo es obligatorio.';
      continue;
    }
    if (raw === '') continue;
    if (f.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) e[f.name] = 'Indique un número.';
      else if (f.min !== undefined && n < f.min) e[f.name] = `El mínimo es ${f.min}.`;
      else if (f.max !== undefined && n > f.max) e[f.name] = `El máximo es ${f.max}.`;
    } else if (f.type !== 'date' && f.type !== 'select' && f.type !== 'radio') {
      if (f.min !== undefined && raw.length < f.min) e[f.name] = `Mínimo ${f.min} caracteres.`;
      if (f.max !== undefined && raw.length > f.max) e[f.name] = `Máximo ${f.max} caracteres.`;
    }
  }
  return e;
}

/** Converts the string form state to the `input` object the API validates (numbers as numbers, blanks omitted). */
function toInput(fields: FormField[], values: Values): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = (values[f.name] ?? '').trim();
    if (raw === '') {
      if (f.required) out[f.name] = raw;
      continue;
    }
    out[f.name] = f.type === 'number' ? Number(raw) : raw;
  }
  return out;
}

function Field({ field, value, error, options, onChange }: {
  field: FormField;
  value: string;
  error?: string;
  options?: FormOption[] | 'loading' | 'error';
  onChange: (v: string) => void;
}) {
  const id = `f-${field.name}`;
  const invalid = Boolean(error);
  const labelNode = (
    <>
      {field.label}
      {field.required && (
        <span className="text-red-600" aria-hidden="true">
          {' '}
          *
        </span>
      )}
      <Tip en={field.labelEn} />
    </>
  );
  const help = field.help ? (
    <p className="mt-1 text-xs text-slate-500" title={field.helpEn}>
      {field.help}
    </p>
  ) : null;
  const err = error ? <p className="field-error">{error}</p> : null;
  const wide = field.type === 'textarea' || field.type === 'radio' || (field.type === 'text' && !field.max) || field.type === 'select';

  let control: JSX.Element;
  switch (field.type) {
    case 'radio':
      control = (
        <fieldset aria-invalid={invalid}>
          <legend className="label">{labelNode}</legend>
          <div className="flex flex-wrap gap-4">
            {(field.options ?? []).map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name={field.name}
                  value={o.value}
                  className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-600"
                  checked={value === o.value}
                  onChange={() => onChange(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
          {help}
          {err}
        </fieldset>
      );
      return <div className={wide ? 'sm:col-span-2' : ''}>{control}</div>;
    case 'select': {
      const list = Array.isArray(options) ? options : field.options ?? [];
      const loading = options === 'loading';
      control = (
        <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} disabled={loading} aria-invalid={invalid} required={field.required}>
          <option value="">{loading ? 'Cargando…' : options === 'error' ? 'No se pudieron cargar las opciones' : 'Seleccione…'}</option>
          {list.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }
    case 'textarea':
      control = (
        <textarea id={id} className="input min-h-[96px]" value={value} placeholder={field.placeholder} maxLength={field.max} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} required={field.required} />
      );
      break;
    case 'number':
      control = (
        <input id={id} type="number" className="input" value={value} min={field.min} max={field.max} step={1} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} required={field.required} />
      );
      break;
    case 'date':
      control = (
        <input id={id} type="date" className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} required={field.required} />
      );
      break;
    default:
      control = (
        <input id={id} type="text" className="input" value={value} placeholder={field.placeholder} maxLength={field.max} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} required={field.required} />
      );
  }
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="label">
        {labelNode}
      </label>
      {control}
      {help}
      {err}
    </div>
  );
}

export function GenericWorkflow() {
  const { id = '' } = useParams();
  const { citizen, provenance } = useAuth();
  const navigate = useNavigate();
  const [def, setDef] = useState<WorkflowDefinition | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Values>({});
  const [options, setOptions] = useState<OptionsState>({});
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Errors>({});

  // Definition
  useEffect(() => {
    let cancelled = false;
    setDef(null);
    setLoadError(null);
    api
      .workflow(id)
      .then((d) => {
        if (cancelled) return;
        setDef(d);
        setValues(initialValues(d.fields ?? [], citizen));
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
    // The citizen is stable for the session; re-running on citizen change would reset typed values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Runtime options (one request per distinct source)
  useEffect(() => {
    if (!def) return;
    let cancelled = false;
    const sources = Array.from(new Set((def.fields ?? []).map((f) => f.optionsFrom).filter((s): s is string => Boolean(s))));
    if (!sources.length) return;
    setOptions(Object.fromEntries(sources.map((s) => [s, 'loading' as const])));
    for (const s of sources) {
      api
        .options(s)
        .then((list) => !cancelled && setOptions((prev) => ({ ...prev, [s]: list })))
        .catch(() => !cancelled && setOptions((prev) => ({ ...prev, [s]: 'error' })));
    }
    return () => {
      cancelled = true;
    };
  }, [def]);

  const fields = def?.fields ?? [];
  const errors = useMemo(() => validate(fields, values, consent), [fields, values, consent]);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
    setServerErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _drop, ...rest } = prev;
      return rest;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!def || !citizen || Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      const { txnId } = await api.startWorkflow(def.id, toInput(fields, values));
      navigate(`/tramite/${encodeURIComponent(def.id)}/${encodeURIComponent(txnId)}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        const fe = err.fieldErrors();
        setServerErrors(fe);
        const form = (err.details as { formErrors?: string[] } | undefined)?.formErrors ?? [];
        setError(Object.keys(fe).length ? 'Revise los campos marcados.' : form.join(' ') || err.message);
      } else if (err instanceof ApiError && err.code === 'WORKFLOW_UNAVAILABLE') {
        setError('Este trámite todavía no está disponible en el demo.');
      } else {
        setError(errorMessage(err));
      }
      setBusy(false);
    }
  }

  if (!citizen) return null;

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert kind="error">{loadError}</Alert>
        <Link to="/" className="btn-secondary">
          ← Volver al inicio
        </Link>
      </div>
    );
  }
  if (!def) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Spinner /> Cargando trámite…
      </div>
    );
  }

  const header = (
    <div>
      <Link to="/" className="text-sm text-primary-700 hover:underline">
        ← Inicio
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {def.title}
          <Tip en={def.titleEn} />
        </h1>
        {def.legal && <LegalBadge status={def.legal.status} />}
      </div>
      <p className="mt-1 text-sm text-slate-600" title={def.descriptionEn}>
        {def.description}
      </p>
      {def.agencies?.length > 0 && (
        <div className="mt-2">
          <AgencyChips agencies={def.agencies} />
        </div>
      )}
    </div>
  );

  const legalCard = def.legal ? (
    <section className="card border-slate-200 bg-slate-50/60" aria-labelledby="legal-flujo">
      <h2 id="legal-flujo" className="mb-2 text-sm font-semibold text-slate-900">
        ¿Se puede hoy en Costa Rica?
        <Tip en="Can this be done in Costa Rica today? Legal status of the whole life event" />
      </h2>
      <LegalPanel note={def.legal} />
    </section>
  ) : null;

  if (!def.available) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {header}
        <Alert kind="info">
          Este evento de vida todavía no se puede iniciar en el demo. Abajo se explica qué existe hoy y qué haría falta.
        </Alert>
        {legalCard}
        <Link to="/" className="btn-secondary">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const show = (k: string) => serverErrors[k] ?? (touched ? errors[k] : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl space-y-6">
      {header}
      {legalCard}

      {error && <Alert kind="error">{error}</Alert>}

      <section className="card border-primary-100 bg-primary-50/40" aria-labelledby="consentimiento">
        <h2 id="consentimiento" className="text-base font-semibold text-slate-900">
          Consentimiento
          <Tip en="Consent — required before any data exchange (Ley 8968)" />
        </h2>
        <p className="mt-1 text-sm text-slate-700">{def.consentText}</p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>Autorizo el intercambio de mis datos para este trámite. Cada consulta quedará registrada.</span>
        </label>
        {show('__consent') && <p className="field-error">{errors.__consent}</p>}
      </section>

      <section className="card" aria-labelledby="datos-estado">
        <h2 id="datos-estado" className="text-base font-semibold text-slate-900">
          Sus datos (ya en poder del Estado)
          <Tip en="Your data — already held by the State; you do not type it again (once-only principle)" />
        </h2>
        <p className="mt-1 text-sm text-slate-600">No es necesario volver a escribirlos. Se toman directamente del Registro Civil.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {PERSONAL.map((p) => {
            const raw = String(citizen[p.key] ?? '');
            return (
              <div key={p.key}>
                <dt className="label !mb-0">
                  {p.label}
                  <Tip en={p.en} />
                </dt>
                <dd>
                  <input className="input" value={p.format ? p.format(raw) : raw} readOnly disabled aria-readonly="true" />
                  {provenance && (
                    <div className="mt-1">
                      <ProvenanceBadge source={provenance.source} exchangeId={provenance.exchangeId} />
                    </div>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {fields.length > 0 && (
        <section className="card" aria-labelledby="datos-tramite">
          <h2 id="datos-tramite" className="text-base font-semibold text-slate-900">
            Lo que solo usted sabe
            <Tip en="The only thing you have to type" />
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Los campos marcados con <span className="text-red-600">*</span> son obligatorios.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <Field
                key={f.name}
                field={f}
                value={values[f.name] ?? ''}
                error={show(f.name)}
                options={f.optionsFrom ? options[f.optionsFrom] : undefined}
                onChange={(v) => set(f.name, v)}
              />
            ))}
          </div>
        </section>
      )}

      {def.traditional && (
        <p className="text-xs text-slate-500" title={def.traditionalEn}>
          <strong className="font-medium text-slate-700">Hoy, sin este portal:</strong> {def.traditional}
        </p>
      )}

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
