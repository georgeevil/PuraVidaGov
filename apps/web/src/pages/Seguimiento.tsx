import { Link } from 'react-router-dom';
import { Tip } from '../components/Tip';
import { SEGUIMIENTO } from '../content/seguimiento';
import { CONTACTO } from '../content/contacto';

/**
 * /seguimiento — where the reform stands, who would have to move, and what a resident can already do.
 * Public like the rest of the case pages. Wording rationale and the posture rules: `content/seguimiento.ts`.
 */
export function Seguimiento() {
  const s = SEGUIMIENTO;
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {s.title}
          <Tip en="Where this stands, and what you can do" />
        </h1>
        <p className="text-slate-700">{s.lead}</p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{s.disclaimer}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{s.estado.heading}</h2>
        {s.estado.paragraphs.map((p, i) => (
          <p key={i} className="text-slate-700">
            {p}
          </p>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{s.actores.heading}</h2>
        <p className="text-slate-700">{s.actores.intro}</p>
        {/*
          Measured at 390px this table was 640px wide inside a 326px viewport — two screens of sideways
          scrolling, which is where a reader on a phone gives up. Below `sm:` the same `filas` array renders as
          stacked blocks instead. Both renderings map the SAME array: never fork the content to suit a layout,
          or the two will drift and one of them will start lying.
        */}
        <ul className="space-y-3 sm:hidden">
          {s.actores.filas.map((f) => (
            <li key={f.quien} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{f.quien}</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Base</dt>
                  <dd className="text-slate-700">{f.base}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Qué le toca</dt>
                  <dd className="text-slate-700">{f.deber}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Dónde está</dt>
                  <dd className="text-slate-700">{f.donde}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-2 pr-3 font-semibold text-slate-900">Quién</th>
                <th className="py-2 pr-3 font-semibold text-slate-900">Base</th>
                <th className="py-2 pr-3 font-semibold text-slate-900">Qué le toca</th>
                <th className="py-2 font-semibold text-slate-900">Dónde está</th>
              </tr>
            </thead>
            <tbody>
              {s.actores.filas.map((f) => (
                <tr key={f.quien} className="border-b border-slate-200 align-top">
                  <td className="py-2 pr-3 font-medium text-slate-900">{f.quien}</td>
                  <td className="py-2 pr-3 text-slate-600">{f.base}</td>
                  <td className="py-2 pr-3 text-slate-700">{f.deber}</td>
                  <td className="py-2 text-slate-700">{f.donde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{s.derechos.heading}</h2>
        <p className="text-slate-700">{s.derechos.intro}</p>
        <dl className="space-y-3">
          {s.derechos.filas.map((f) => (
            <div key={f.via}>
              <dt className="text-sm font-semibold text-slate-900">
                {f.via}
                {f.base !== '—' ? <span className="font-normal text-slate-600"> · {f.base}</span> : null}
              </dt>
              <dd className="text-sm text-slate-700">{f.sirve}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-900">{s.derechos.precedente.heading}</h3>
          {s.derechos.precedente.paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-slate-700">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{s.pendiente.heading}</h2>
        {s.pendiente.paragraphs.map((p, i) => (
          <p key={i} className="text-slate-700">
            {p}
          </p>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{s.seguir.heading}</h2>
        {s.seguir.paragraphs.map((p, i) => (
          <p key={i} className="text-slate-700">
            {p}
          </p>
        ))}
        <p className="text-slate-700">
          {s.seguir.contactoNota}{' '}
          <a className="text-primary-700 underline" href={`mailto:${CONTACTO}`}>
            {CONTACTO}
          </a>
        </p>
      </section>

      <p className="text-sm text-slate-600">
        <Link to="/por-que" className="text-primary-700 underline">
          ← Volver al argumento
        </Link>
      </p>
    </div>
  );
}
