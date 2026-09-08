import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkflowDefinition } from '@pvg/shared/data';
import { api, IS_STATIC } from '../api';
import { useAuth } from '../auth';
import { LegalBadge } from '../components/LegalBadge';
import { ColdStartNote, NO_PORTAL, PortalLink, PortalUnavailable } from '../components/Portal';
import { Tip } from '../components/Tip';
import { CASE, type CaseContent } from '../content/case';
import { formatCrc, formatDecimal } from '../format';

/** ₡ amounts in the billions read better as "mil millones" / "billones" than as 13-digit numbers. */
function formatCrcCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `₡${formatDecimal(value / 1e12)} billones`;
  if (abs >= 1e9) return `₡${formatDecimal(value / 1e9)} mil millones`;
  if (abs >= 1e6) return `₡${formatDecimal(value / 1e6)} millones`;
  return formatCrc(value);
}

const BAR_COLORS = ['bg-primary-600', 'bg-green-600', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500', 'bg-cyan-600'];

function Section({ id, title, en, children }: { id: string; title: string; en: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-semibold text-slate-900">
        {title}
        <Tip en={en} />
      </h2>
      {children}
    </section>
  );
}

function Calculator({ calc, rule }: { calc: CaseContent['calculator']; rule: CaseContent['dividend']['rule'] | undefined }) {
  const min = calc.minPct ?? 0;
  const max = calc.maxPct ?? 5;
  const [pct, setPct] = useState(() => Math.min(max, Math.max(min, calc.defaultSavingsPct ?? min)));
  // `gdpCrcBillions` is in Spanish billones (10¹² CRC): Costa Rica's GDP is ≈ ₡50 billones.
  const gdp = (calc.gdpCrcBillions ?? 0) * 1e12;
  const savings = (gdp * pct) / 100;

  // Shares may come as fractions (0.4) or percentages (40); normalise to fractions.
  const split = useMemo(() => {
    const r = rule ?? [];
    const total = r.reduce((s, x) => s + (x.share ?? 0), 0);
    const scale = total > 1.0001 ? 100 : 1;
    return r.map((x) => ({ ...x, fraction: (x.share ?? 0) / scale }));
  }, [rule]);

  const step = max - min > 2 ? 0.05 : 0.01;

  return (
    <div className="card space-y-5 border-primary-100">
      <p className="text-sm text-slate-600">{calc.intro}</p>
      <div>
        <label htmlFor="pct" className="label flex items-center justify-between">
          <span>
            Ahorro estimado como % del PIB
            <Tip en="Estimated savings as a share of GDP" />
          </span>
          <span className="font-mono text-base text-primary-700">{formatDecimal(pct)} %</span>
        </label>
        <input
          id="pct"
          type="range"
          min={min}
          max={max}
          step={step}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-full accent-primary-600"
          aria-valuetext={`${formatDecimal(pct)} por ciento`}
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-500">
          <span>{formatDecimal(min)} %</span>
          <span>PIB de referencia: {formatCrcCompact(gdp)}</span>
          <span>{formatDecimal(max)} %</span>
        </div>
      </div>
      <div className="rounded-md bg-primary-50 px-4 py-3">
        <div className="text-xs font-medium uppercase tracking-wide text-primary-800">
          Ahorro anual
          <Tip en="Annual savings" />
        </div>
        <div className="text-2xl font-semibold text-primary-800 sm:text-3xl">{formatCrcCompact(savings)}</div>
        <div className="text-xs text-primary-700/80">{formatCrc(Math.round(savings))} al año</div>
      </div>
      {split.length > 0 && (
        <>
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Reparto del dividendo digital">
            {split.map((s, i) => (
              <div key={s.destination} className={`${BAR_COLORS[i % BAR_COLORS.length]} h-full`} style={{ width: `${s.fraction * 100}%` }} title={`${s.destination}: ${formatDecimal(s.fraction * 100)} %`} />
            ))}
          </div>
          <div className={`grid gap-3 sm:grid-cols-2 ${split.length >= 4 ? 'lg:grid-cols-4' : split.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {split.map((s, i) => (
              <div key={s.destination} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${BAR_COLORS[i % BAR_COLORS.length]}`} aria-hidden="true" />
                  {formatDecimal(s.fraction * 100)} %
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatCrcCompact(savings * s.fraction)}</div>
                <div className="text-xs text-slate-600">{s.destination}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The life events as a compact strip of links. Signed in → the trámite itself; anonymous → /login (the page is
 * public, the trámites are not). In the static build they point at the interactive deployment, or are plain
 * labels when none is configured. Fetched from the public /api/workflows; silently omitted if it fails.
 */
function LifeEventsStrip({ workflows, isAuthenticated }: { workflows: WorkflowDefinition[]; isAuthenticated: boolean }) {
  if (!workflows.length) return null;
  return (
    <nav aria-label="Eventos de vida" className="card !p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Eventos de vida en el demo
        <Tip en="Life events in the demo — sign in to try one" />
      </p>
      <ul className="flex flex-wrap gap-2">
        {workflows.map((w) => {
          const cls = `inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            w.available
              ? 'border-slate-200 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50'
              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`;
          const inner = (
            <>
              {w.title}
              {w.legal && <LegalBadge status={w.legal.status} size="xs" />}
            </>
          );
          const path = `/tramite/${encodeURIComponent(w.id)}`;
          return (
            <li key={w.id}>
              {NO_PORTAL ? (
                // Static build with no interactive deployment: show the life event, but never a dead link.
                <span className={cls.replace('transition-colors', '')} title={w.titleEn}>
                  {inner}
                </span>
              ) : isAuthenticated && !IS_STATIC ? (
                <Link to={path} title={w.titleEn} className={cls}>
                  {inner}
                </Link>
              ) : (
                <PortalLink path={IS_STATIC ? path : '/login'} title={`${w.titleEn} — sign in to try it`} className={cls}>
                  {inner}
                </PortalLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DemoCta() {
  return (
    <section aria-labelledby="pruebe-demo" className="card border-primary-200 bg-gradient-to-br from-primary-50 to-white">
      <h2 id="pruebe-demo" className="text-lg font-semibold text-slate-900">
        Pruebe el demo como María
        <Tip en="Try the demo as María — the fictional citizen of this proof of concept" />
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-700">
        Inicie sesión con la cédula <code className="font-mono">1-2345-6789</code>, contraseña{' '}
        <code className="font-mono">demo</code>, y abra un negocio, inscriba un nacimiento o pida un permiso de construcción
        en segundos.
      </p>
      <div className="mt-4">
        {NO_PORTAL ? (
          <PortalUnavailable />
        ) : (
          <PortalLink className="btn-primary inline-flex" title="Try the demo">
            Probar el demo
          </PortalLink>
        )}
        <ColdStartNote className="mt-2" />
      </div>
    </section>
  );
}

export function Case() {
  const c = (CASE ?? {}) as Partial<CaseContent>;
  const { isAuthenticated } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .workflows()
      .then((w) => !cancelled && setWorkflows(w))
      .catch(() => {
        /* the strip is decorative on this page; the argument reads fine without it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      {c.hero && (
        <header className="rounded-lg border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
            {c.hero.title}
            <Tip en="Why — the case for a once-only government in Costa Rica" />
          </h1>
          {c.hero.subtitle && <p className="mt-3 max-w-3xl text-base text-slate-700">{c.hero.subtitle}</p>}
          {c.hero.disclaimer && <p className="mt-4 text-xs italic text-slate-500">{c.hero.disclaimer}</p>}
        </header>
      )}

      <LifeEventsStrip workflows={workflows} isAuthenticated={isAuthenticated} />

      {c.problem && (
        <Section id="problema" title={c.problem.title} en="The problem">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {c.problem.paragraphs?.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-700">
                  {p}
                </p>
              ))}
            </div>
            {c.problem.stats?.length ? (
              <dl className="space-y-3">
                {c.problem.stats.map((s) => (
                  <div key={s.label} className="card !p-4">
                    <dd className="text-2xl font-semibold text-primary-700">{s.value}</dd>
                    <dt className="text-sm text-slate-800">{s.label}</dt>
                    <div className="mt-1 text-[11px] text-slate-500">Fuente: {s.source}</div>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </Section>
      )}

      {c.foundations && (
        <Section id="cimientos" title={c.foundations.title} en="The foundations">
          {c.foundations.intro && <p className="max-w-3xl text-sm text-slate-600">{c.foundations.intro}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.foundations.items?.map((it) => (
              <article key={it.name} className="card flex flex-col !p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{it.name}</h3>
                  {it.status && <LegalBadge status={it.status} size="xs" />}
                </div>
                <p className="mt-1 text-xs text-slate-600">{it.what}</p>
              </article>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Detalle instrumento por instrumento en{' '}
            <Link to="/marco-legal" className="text-primary-700 hover:underline">
              Marco legal
            </Link>
            .
          </p>
        </Section>
      )}

      {c.roadmap && (
        <Section id="ruta" title={c.roadmap.title} en="Roadmap">
          {c.roadmap.intro && <p className="max-w-3xl text-sm text-slate-600">{c.roadmap.intro}</p>}
          <ol className="space-y-3">
            {c.roadmap.steps?.map((s) => (
              <li key={s.n} className="card flex gap-4 !p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white" aria-hidden="true">
                  {s.n}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-700">{s.summary}</p>
                  {s.actions?.length ? (
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-slate-600">
                      {s.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  ) : null}
                  {s.lawNeeded && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-800">
                      <span className="font-semibold">Requiere ley:</span> {s.lawNeeded}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {c.dividend && (
        <Section id="dividendo" title={c.dividend.title} en="The digital dividend">
          {c.dividend.intro && <p className="max-w-3xl text-sm text-slate-600">{c.dividend.intro}</p>}
          {c.dividend.rule?.length ? (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {c.dividend.rule.map((r, i) => {
                const total = c.dividend!.rule.reduce((s, x) => s + (x.share ?? 0), 0);
                const pct = (r.share ?? 0) / (total > 1.0001 ? 1 : 0.01);
                return (
                  <li key={r.destination} className="card flex items-center gap-3 !p-3">
                    <span className={`inline-block h-3 w-3 shrink-0 rounded-sm ${BAR_COLORS[i % BAR_COLORS.length]}`} aria-hidden="true" />
                    <span className="text-lg font-semibold text-slate-900">{formatDecimal(pct)} %</span>
                    <span className="text-xs text-slate-600">{r.destination}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {c.dividend.caveats?.length ? (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-500">
              {c.dividend.caveats.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : null}
        </Section>
      )}

      {c.calculator && (
        <Section id="calculadora" title={c.calculator.title} en="Interactive calculator">
          <Calculator calc={c.calculator} rule={c.dividend?.rule} />
        </Section>
      )}

      {c.evidence && (
        <Section id="evidencia" title={c.evidence.title} en="Evidence">
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {c.evidence.items?.map((e, i) => (
              <li key={i} className="px-4 py-3">
                <p className="text-sm text-slate-800">{e.claim}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
                      {e.source} ↗
                    </a>
                  ) : (
                    e.source
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {c.asks && (
        <Section id="pedimos" title={c.asks.title} en="What we ask for">
          <ol className="space-y-2">
            {c.asks.items?.map((a, i) => (
              <li key={i} className="flex gap-3 rounded-md border border-green-200 bg-green-50/60 px-4 py-3 text-sm text-slate-800">
                <span className="font-semibold text-green-800" aria-hidden="true">
                  {i + 1}.
                </span>
                {a}
              </li>
            ))}
          </ol>
        </Section>
      )}

      <DemoCta />

      <p className="text-xs text-slate-500">
        Vea cómo se traduce esto en un trámite real:{' '}
        {NO_PORTAL ? (
          <span className="text-slate-600">eventos de vida</span>
        ) : isAuthenticated && !IS_STATIC ? (
          <Link to="/" className="text-primary-700 hover:underline">
            eventos de vida
          </Link>
        ) : (
          <PortalLink path={IS_STATIC ? '/' : '/login'} className="text-primary-700 hover:underline">
            eventos de vida
          </PortalLink>
        )}{' '}
        ·{' '}
        <Link to="/arquitectura" className="text-primary-700 hover:underline">
          cómo funciona
        </Link>
        .
      </p>
    </div>
  );
}
