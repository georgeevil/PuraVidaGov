import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RUTAS_PUBLICAS } from './content/rutas-publicas';

/** What a page with nothing better to say calls itself. Matches the `<title>` shipped in index.html. */
export const TITULO_BASE = 'PuraVidaGov — Portal ciudadano';
export const DESCRIPCION_BASE = 'Portal ciudadano de demostración PuraVidaGov — datos ficticios.';

/**
 * Keeps `<title>` and the meta description matching the route.
 *
 * Why this is only half the fix, and the half that matters least. Googlebot renders JavaScript, so it will
 * see what this sets. Social scrapers — WhatsApp, Slack, Twitter, iMessage — do not: they read the raw HTML
 * and stop. Anything set here is invisible to them. The other half is in `scripts/build-static-api.mjs`,
 * which writes a real HTML file per public route with these same strings already in the head. This hook
 * exists for what that cannot cover: navigation *inside* the app, where no new document is ever fetched and
 * the title would otherwise keep describing the page the reader arrived on.
 *
 * Only public routes have their own metadata, on purpose: everything else is behind `requireAuth`, is
 * disallowed in robots.txt, and has no business being described to a crawler.
 */
export function useMetaDeRuta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const ruta = RUTAS_PUBLICAS.find((r) => r.to === pathname);
    document.title = ruta?.titulo ?? TITULO_BASE;

    const etiqueta = document.querySelector('meta[name="description"]');
    if (etiqueta) etiqueta.setAttribute('content', ruta?.descripcion ?? DESCRIPCION_BASE);
  }, [pathname]);
}
