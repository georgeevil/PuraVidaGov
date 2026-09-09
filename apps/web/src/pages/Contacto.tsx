import { useSearchParams } from 'react-router-dom';
import { Tip } from '../components/Tip';
import { CONTACTO } from '../content/contacto';
import { MOTIVOS, enlaceDe } from '../content/contacto-motivos';

/**
 * /contacto — four reasons to write, each composing a message worth reading.
 *
 * Reached from the footer of every page, not from the navigation: `rutas-publicas.ts` keeps it out of the nav
 * on purpose, because a sixth nav item costs every reader attention to serve the few who write.
 *
 * `?desde=` carries the page the reader came from, so a message about a confusing table says which table.
 * Wording rules and the reason there is no form: `content/contacto-motivos.ts`.
 */
export function Contacto() {
  const [params] = useSearchParams();
  const desde = params.get('desde') ?? undefined;
  // A path from the query string ends up in a mailto and on screen. Accept only something that looks like
  // one of this site's own routes; anything else is dropped rather than shown.
  const pagina = desde && /^\/[a-z0-9/-]{0,60}$/i.test(desde) ? desde : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">
          Escríbame
          <Tip en="Write to me" />
        </h1>
        <p className="text-slate-700">
          Este demo está hecho con datos inventados. Lo que no puedo inventar es lo que a usted le pasa en una
          ventanilla, ni los errores que yo no veo. Para eso está esta página.
        </p>
        {pagina && <p className="text-sm text-slate-500">Viene de {pagina}. Lo incluyo en el mensaje.</p>}
      </header>

      <ul className="space-y-4">
        {MOTIVOS.map((m) => (
          <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">
              {m.titulo}
              <Tip en={m.en} />
            </h2>
            <p className="mt-1 text-sm text-slate-600">{m.para}</p>
            <a
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
              href={enlaceDe(m, pagina)}
            >
              Escribir sobre esto ↗
            </a>
          </li>
        ))}
      </ul>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">Qué pasa con lo que me escriba</h2>
        <p>
          Llega a un correo, y nada más: este sitio no guarda nada, no tiene analítica y no hay formulario que
          almacene su mensaje. Los enlaces de arriba abren su programa de correo con las preguntas ya escritas;
          usted decide qué manda y qué borra.
        </p>
        <p>
          Si algo de lo que me cuente termina publicado en el sitio, se lo pregunto antes y usted decide si va con
          su nombre, sin él, o no va. Las correcciones de datos sí se aplican de una vez, con su fuente.
        </p>
        <p>
          La dirección es <span className="font-mono">{CONTACTO}</span> si prefiere escribir por su cuenta.
        </p>
      </section>
    </div>
  );
}
