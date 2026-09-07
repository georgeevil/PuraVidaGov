import { useEffect, useState } from 'react';
import type { RegistryEntry } from '@pvg/shared';
import { api, errorMessage } from '../api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { AGENCY_LABELS_EN, AGENCY_SHORT, agencyLabel } from '../labels';

function HealthDot({ healthy }: { healthy?: boolean }) {
  const cls = healthy === undefined ? 'bg-slate-300' : healthy ? 'bg-green-500' : 'bg-red-500';
  const label = healthy === undefined ? 'Sin verificar' : healthy ? 'En línea' : 'Sin respuesta';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600" title={healthy ? 'healthy' : 'unhealthy'}>
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls} ${healthy ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Portal → API → Bus → four agencies, as inline SVG (scales with its container). */
function Diagram() {
  const box = 'fill-white stroke-slate-300';
  const text = 'fill-slate-800 text-[12px] font-medium';
  const agencies = [
    ['Registro Civil', 'registro'],
    ['Tributación', 'tributacion'],
    ['CCSS', 'ccss'],
    ['Municipalidad', 'municipalidad'],
  ];
  return (
    <svg viewBox="0 0 720 300" role="img" aria-label="Diagrama: Portal, API, Bus y cuatro instituciones" className="h-auto w-full">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-slate-400" />
        </marker>
      </defs>
      {/* Portal */}
      <rect x="20" y="120" width="130" height="60" rx="8" className="fill-primary-600 stroke-primary-700" />
      <text x="85" y="145" textAnchor="middle" className="fill-white text-[12px] font-semibold">Portal ciudadano</text>
      <text x="85" y="163" textAnchor="middle" className="fill-white/80 text-[10px]">React · una sola identidad</text>
      {/* API */}
      <rect x="200" y="120" width="130" height="60" rx="8" className={box} />
      <text x="265" y="145" textAnchor="middle" className={text}>API / orquestador</text>
      <text x="265" y="163" textAnchor="middle" className="fill-slate-500 text-[10px]">consentimiento · flujo</text>
      {/* Bus */}
      <rect x="380" y="100" width="130" height="100" rx="8" className="fill-amber-50 stroke-amber-400" />
      <text x="445" y="140" textAnchor="middle" className={text}>Bus de</text>
      <text x="445" y="156" textAnchor="middle" className={text}>interoperabilidad</text>
      <text x="445" y="176" textAnchor="middle" className="fill-slate-500 text-[10px]">registro · auditoría</text>
      {/* Agencies */}
      {agencies.map(([label, key], i) => {
        const y = 20 + i * 70;
        return (
          <g key={key}>
            <rect x="570" y={y} width="130" height="46" rx="8" className={box} />
            <text x="635" y={y + 28} textAnchor="middle" className={text}>{label}</text>
            <line x1="510" y1="150" x2="570" y2={y + 23} className="stroke-slate-400" strokeWidth="1.5" markerEnd="url(#arrow)" />
          </g>
        );
      })}
      <line x1="150" y1="150" x2="200" y2="150" className="stroke-slate-400" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <line x1="330" y1="150" x2="380" y2="150" className="stroke-slate-400" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="175" y="140" textAnchor="middle" className="fill-slate-500 text-[9px]">/api</text>
      <text x="355" y="140" textAnchor="middle" className="fill-slate-500 text-[9px]">x-api-key</text>
      <text x="360" y="285" textAnchor="middle" className="fill-slate-500 text-[10px]">
        El portal nunca habla con una institución; las instituciones nunca hablan entre sí. Todo pasa por el bus y queda auditado.
      </text>
    </svg>
  );
}

const PRINCIPLES: Array<{ title: string; en: string; body: string }> = [
  {
    title: 'Identidad única',
    en: 'Single digital identity',
    body:
      'Usted ingresa una sola vez con su cédula y un segundo factor (aquí, un SMS simulado en lugar de la firma digital). Esa identidad vale para todas las instituciones conectadas: no hay un usuario por ministerio.',
  },
  {
    title: 'Principio de «una sola vez»',
    en: 'Once-only principle',
    body:
      'Lo que el Estado ya sabe de usted —nombre, fecha de nacimiento, dirección— no se vuelve a pedir. Cada dato en pantalla muestra de qué institución salió y con qué intercambio, para que usted pueda verificarlo.',
  },
  {
    title: 'Bus de interoperabilidad',
    en: 'Interoperability bus (X-Road style)',
    body:
      'Las instituciones no se conectan entre sí ni comparten bases de datos: publican servicios en un bus que enruta cada consulta, la autentica y la registra. Es el modelo de X-Road, que Estonia usa desde 2001.',
  },
  {
    title: 'Auditoría y consentimiento',
    en: 'Audit trail and consent',
    body:
      'Ningún intercambio ocurre sin un propósito declarado y una referencia de consentimiento. El registro anota qué campos se entregaron —nunca sus valores— y usted puede consultarlo en cualquier momento.',
  },
];

export function Architecture() {
  const [registry, setRegistry] = useState<RegistryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .registry()
        .then((r) => !cancelled && setRegistry(r))
        .catch((err) => !cancelled && setError(errorMessage(err)));
    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Cómo funciona
          <Tip en="How it works — architecture of the demo" />
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Una prueba de concepto de gobierno digital centrado en la persona, inspirada en X-Road (Estonia) y LifeSG
          (Singapur).
        </p>
      </div>

      <section className="card" aria-labelledby="diagrama">
        <h2 id="diagrama" className="mb-3 text-base font-semibold text-slate-900">
          Arquitectura
          <Tip en="Portal → API → Bus → agencies" />
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <Diagram />
          </div>
        </div>
      </section>

      <section aria-labelledby="registro-servicios">
        <h2 id="registro-servicios" className="mb-3 text-base font-semibold text-slate-900">
          Instituciones conectadas al bus
          <Tip en="Service registry with live health checks" />
        </h2>
        {error && (
          <div className="mb-3">
            <Alert kind="error">{error}</Alert>
          </div>
        )}
        {!registry ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> Consultando el registro…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {registry.map((r) => (
              <article key={r.service} className="card" title={AGENCY_LABELS_EN[r.service] ?? r.service}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{r.label || AGENCY_SHORT[r.service] || agencyLabel(r.service)}</h3>
                    <div className="mt-0.5 font-mono text-xs text-slate-500">{r.baseUrl}</div>
                  </div>
                  <HealthDot healthy={r.healthy} />
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-700">
                  {Object.entries(r.actions).map(([name, a]) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="w-10 rounded bg-slate-100 px-1 text-center font-mono text-[10px] text-slate-600">{a.method}</span>
                      <span className="font-medium">{name}</span>
                      <span className="truncate font-mono text-slate-400">{a.path}</span>
                    </li>
                  ))}
                </ul>
                {r.lastChecked && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    Verificado: {new Date(r.lastChecked).toLocaleTimeString('es-CR')}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Principios">
        {PRINCIPLES.map((p) => (
          <article key={p.title} className="card">
            <h3 className="font-semibold text-slate-900">
              {p.title}
              <Tip en={p.en} />
            </h3>
            <p className="mt-1 text-sm text-slate-600">{p.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
