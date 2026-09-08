import { Link } from 'react-router-dom';
import { Tip } from '../components/Tip';
import { AUTHOR } from '../content/author';

/**
 * /quien-lo-hace — who built the demo, on what basis, and with which disclaimers.
 * Public like the rest of the case pages. Wording rationale: `apps/web/src/content/author.ts`.
 */
export function Author() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {AUTHOR.title}
          <Tip en="Who builds this, and why" />
        </h1>
        <p className="text-slate-700">{AUTHOR.lead}</p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{AUTHOR.disclaimer}</p>
      </header>

      <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        {AUTHOR.facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</dt>
            <dd className="break-words text-sm text-slate-800">{f.value}</dd>
          </div>
        ))}
      </dl>

      {AUTHOR.sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{s.heading}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i} className="text-slate-700">
              {p}
            </p>
          ))}
        </section>
      ))}

      <section className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{AUTHOR.invite.heading}</h2>
        <p className="text-slate-700">{AUTHOR.invite.body}</p>
        <ul className="space-y-1">
          {AUTHOR.invite.links.map((l) => (
            <li key={l.href} className="text-sm">
              <a className="text-primary-700 underline" href={l.href} target="_blank" rel="noreferrer noopener">
                {l.label}
              </a>
              {l.note ? <span className="text-slate-600"> · {l.note}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">{AUTHOR.support.heading}</h2>
        {AUTHOR.support.paragraphs.map((s, i) => (
          <p key={i} className="text-slate-700">
            {s}
          </p>
        ))}
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          {AUTHOR.support.exclusion}
        </p>
        <p>
          <a
            className="inline-block rounded-lg bg-primary-700 px-4 py-2 font-semibold text-white"
            href={AUTHOR.support.link.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {AUTHOR.support.link.label}
          </a>
        </p>
        <p className="text-sm text-slate-600">{AUTHOR.support.note}</p>
      </section>

      <p className="text-sm text-slate-600">
        <Link to="/por-que" className="text-primary-700 underline">
          ← Volver al argumento
        </Link>
      </p>
    </div>
  );
}
