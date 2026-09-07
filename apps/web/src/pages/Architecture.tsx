import { useEffect, useState } from 'react';
import { AGENCIES, AGENCY_SHORT, type RegistryEntry } from '@pvg/shared/data';
import { api, errorMessage } from '../api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { agencyLabel, agencyLabelEn } from '../labels';

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

const shortLabel = (service: string, label?: string) => (AGENCY_SHORT as Record<string, string>)[service] ?? label ?? service;

/**
 * Portal → API → Bus → agencies, as inline SVG (scales with its container). The agency boxes come from the
 * registry when loaded (whatever the bus reports), otherwise from the shared AGENCIES list; two columns.
 */
function Diagram({ registry }: { registry: RegistryEntry[] | null }) {
  const box = 'fill-white stroke-slate-300';
  const text = 'fill-slate-800 text-[12px] font-medium';
  const agencies: Array<{ key: string; label: string; healthy?: boolean }> = registry?.length
    ? registry.map((r) => ({ key: r.service, label: shortLabel(r.service, r.label), healthy: r.healthy }))
    : AGENCIES.map((a) => ({ key: a, label: AGENCY_SHORT[a] }));

  const cols = 2;
  const rows = Math.ceil(agencies.length / cols);
  const boxW = 118;
  const boxH = 44;
  const gapY = 18;
  const gapX = 14;
  const colX = [556, 556 + boxW + gapX];
  const gridH = rows * boxH + (rows - 1) * gapY;
  const height = Math.max(300, gridH + 80);
  const top = (height - 40 - gridH) / 2;
  const midY = height / 2 - 20;
  const width = colX[1] + boxW + 20;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Diagrama: Portal, API, Bus y ${agencies.length} instituciones`} className="h-auto w-full">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-slate-400" />
        </marker>
      </defs>
      {/* Portal */}
      <rect x="20" y={midY - 30} width="130" height="60" rx="8" className="fill-primary-600 stroke-primary-700" />
      <text x="85" y={midY - 5} textAnchor="middle" className="fill-white text-[12px] font-semibold">
        Portal ciudadano
      </text>
      <text x="85" y={midY + 13} textAnchor="middle" className="fill-white/80 text-[10px]">
        React · una sola identidad
      </text>
      {/* API */}
      <rect x="200" y={midY - 30} width="130" height="60" rx="8" className={box} />
      <text x="265" y={midY - 5} textAnchor="middle" className={text}>
        API / orquestador
      </text>
      <text x="265" y={midY + 13} textAnchor="middle" className="fill-slate-500 text-[10px]">
        consentimiento · flujos
      </text>
      {/* Bus */}
      <rect x="380" y={midY - 50} width="130" height="100" rx="8" className="fill-amber-50 stroke-amber-400" />
      <text x="445" y={midY - 10} textAnchor="middle" className={text}>
        Bus de
      </text>
      <text x="445" y={midY + 6} textAnchor="middle" className={text}>
        interoperabilidad
      </text>
      <text x="445" y={midY + 26} textAnchor="middle" className="fill-slate-500 text-[10px]">
        registro · auditoría
      </text>
      {/* Agencies in two columns */}
      {agencies.map((a, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = colX[col];
        const y = top + row * (boxH + gapY);
        const dot = a.healthy === undefined ? 'fill-slate-300' : a.healthy ? 'fill-green-500' : 'fill-red-500';
        return (
          <g key={a.key}>
            <title>{agencyLabelEn(a.key)}</title>
            <rect x={x} y={y} width={boxW} height={boxH} rx="8" className={box} />
            <text x={x + boxW / 2} y={y + boxH / 2 + 4} textAnchor="middle" className="fill-slate-800 text-[11px] font-medium">
              {a.label}
            </text>
            <circle cx={x + boxW - 9} cy={y + 9} r="3" className={dot} />
            <line x1="510" y1={midY} x2={x} y2={y + boxH / 2} className="stroke-slate-400" strokeWidth="1.25" markerEnd="url(#arrow)" opacity={col === 0 ? 1 : 0.35} />
          </g>
        );
      })}
      <line x1="150" y1={midY} x2="200" y2={midY} className="stroke-slate-400" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <line x1="330" y1={midY} x2="380" y2={midY} className="stroke-slate-400" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="175" y={midY - 10} textAnchor="middle" className="fill-slate-500 text-[9px]">
        /api
      </text>
      <text x="355" y={midY - 10} textAnchor="middle" className="fill-slate-500 text-[9px]">
        x-api-key
      </text>
      <text x={width / 2} y={height - 12} textAnchor="middle" className="fill-slate-500 text-[10px]">
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
  {
    title: 'Eventos de vida, no ministerios',
    en: 'Life events, not ministries',
    body:
      'Cada trámite es una definición de datos: campos, pasos y la institución de cada paso. El motor los ejecuta en orden por el bus, omite los que no aplican y entrega una constancia única. Añadir un evento de vida es añadir una definición, no una pantalla.',
  },
  {
    title: 'Etiqueta legal en cada paso',
    en: 'Legal status on every step',
    body:
      'Cada paso declara si se puede hacer hoy en Costa Rica, con qué base legal, y qué instrumento extranjero cerraría la brecha. La demostración no vende tecnología: muestra qué decisión legal falta.',
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
          Una prueba de concepto de gobierno digital centrado en la persona, inspirada en X-Road (Estonia) y LifeSG (Singapur).
        </p>
      </div>

      <section className="card" aria-labelledby="diagrama">
        <h2 id="diagrama" className="mb-3 text-base font-semibold text-slate-900">
          Arquitectura
          <Tip en="Portal → API → Bus → agencies" />
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <Diagram registry={registry} />
          </div>
        </div>
      </section>

      <section aria-labelledby="registro-servicios">
        <h2 id="registro-servicios" className="mb-3 text-base font-semibold text-slate-900">
          Instituciones conectadas al bus
          {registry && <span className="ml-2 text-sm font-normal text-slate-500">{registry.length}</span>}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registry.map((r) => (
              <article key={r.service} className="card" title={agencyLabelEn(r.service)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{r.label || agencyLabel(r.service)}</h3>
                    <div className="mt-0.5 truncate font-mono text-xs text-slate-500">{r.baseUrl}</div>
                  </div>
                  <HealthDot healthy={r.healthy} />
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-700">
                  {Object.entries(r.actions ?? {}).map(([name, a]) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 rounded bg-slate-100 px-1 text-center font-mono text-[10px] text-slate-600">{a.method}</span>
                      <span className="font-medium">{name}</span>
                      <span className="truncate font-mono text-slate-400">{a.path}</span>
                    </li>
                  ))}
                </ul>
                {r.lastChecked && (
                  <div className="mt-2 text-[11px] text-slate-400">Verificado: {new Date(r.lastChecked).toLocaleTimeString('es-CR')}</div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Principios">
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
