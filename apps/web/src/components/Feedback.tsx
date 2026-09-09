import { Link, useLocation } from 'react-router-dom';

/**
 * The footer link, on every page.
 *
 * It used to compose a `mailto:` directly with three fixed questions. That was right while the only expected
 * reader was someone confused by a page, and it is wrong now that four different kinds of person might write:
 * a `mailto:` asking "¿qué le resultó confuso?" is the wrong opening for somebody reporting what a ventanilla
 * did to them, and no opening at all for an institution. So the link now leads to /contacto, which asks the
 * reader why they are writing before putting words in their mouth.
 *
 * `?desde=` preserves what the direct `mailto:` had and the page would otherwise lose: which page they were on
 * when they decided to write. "Esta tabla no se entiende" is unanswerable without knowing which table.
 *
 * The reasons, the wording rules and the reason there is still no form: `content/contacto-motivos.ts`.
 */
export function Feedback() {
  const { pathname } = useLocation();

  return (
    <Link
      className="underline decoration-slate-300 underline-offset-2 hover:text-primary-700"
      to={`/contacto?desde=${encodeURIComponent(pathname)}`}
    >
      ¿Algo confuso, algo mal, o algo que contar? Escríbame
    </Link>
  );
}
