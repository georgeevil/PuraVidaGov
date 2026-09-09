/**
 * Every URL an anonymous visitor can reach, as data.
 *
 * Two things read this list and they must not drift apart: the public navigation in `components/Layout.tsx`,
 * and the `sitemap.xml` written by `scripts/build-static-api.mjs`. A sitemap hand-written next to a nav
 * hand-written next to a router is three lists that agree only until someone adds a page.
 *
 * **`/login` is deliberately absent.** It is a real route, but on the static host there is no backend behind
 * it: the demo lives at `VITE_PORTAL_URL`. Submitting it to a search engine would publish a page whose only
 * function is to fail. Everything behind `requireAuth` is absent for the obvious reason.
 *
 * `fuentes` is what makes `lastmod` honest. It lists the files whose content that page actually shows, so the
 * sitemap can date each URL from the last commit that touched it rather than claiming, at every deploy, that
 * all six pages changed at once. A date a crawler learns to distrust is worse than no date. Paths are
 * repository-relative; if a page starts reading a new content file, add it here.
 */
export interface RutaPublica {
  to: string;
  label: string;
  en: string;
  end?: boolean;
  /** Show in the public navigation. `/` is reached by the logo, so it is in the sitemap but not the nav. */
  enNav: boolean;
  /** Repository-relative files whose content this page renders. Used for `lastmod`. */
  fuentes: string[];
  /**
   * The `<title>`. Google shows roughly the first 60 characters, so the distinguishing words come first and
   * the brand last — «Marco legal …» before «— PuraVidaGov», never the reverse.
   */
  titulo: string;
  /** The `<meta name="description">`. Around 150 characters; a sentence a person would read, not keywords. */
  descripcion: string;
}

export const RUTAS_PUBLICAS: RutaPublica[] = [
  {
    to: '/',
    label: 'Inicio',
    en: 'Home',
    end: true,
    enNav: false,
    fuentes: ['apps/web/src/pages/Landing.tsx', 'apps/web/src/content/landing.ts'],
    titulo: 'El Estado ya tiene sus datos — PuraVidaGov',
    descripcion:
      'Demo de un Estado que no pide dos veces lo mismo: doce trámites, trece instituciones y una sola vez cada dato. Datos ficticios.',
  },
  {
    to: '/por-que',
    label: 'Por qué',
    en: 'Why — the case for a once-only government',
    enNav: true,
    fuentes: ['apps/web/src/pages/Case.tsx', 'apps/web/src/content/case.ts'],
    titulo: 'Por qué el Estado no debería preguntar dos veces — PuraVidaGov',
    descripcion:
      'El argumento completo: qué cuesta hoy repetir los mismos datos en cada ventanilla, qué hicieron Estonia, Dinamarca y Singapur, y qué falta en Costa Rica.',
  },
  {
    to: '/marco-legal',
    label: 'Marco legal',
    en: 'Legal framework — what is possible today',
    enNav: true,
    fuentes: [
      'apps/web/src/pages/LegalFramework.tsx',
      'apps/web/src/content/legal-matrix.ts',
      'packages/shared/src/legal.ts',
    ],
    titulo: 'Marco legal: qué permite la ley costarricense — PuraVidaGov',
    descripcion:
      'Ley 8220, Ley 8968, Ley 9943 y las demás normas que ya obligan o impiden el intercambio de datos entre instituciones, trámite por trámite y con fuente.',
  },
  {
    to: '/arquitectura',
    label: 'Cómo funciona',
    en: 'How it works',
    enNav: true,
    fuentes: ['apps/web/src/pages/Architecture.tsx'],
    titulo: 'Cómo funciona: portal, orquestador y bus — PuraVidaGov',
    descripcion:
      'La arquitectura del demo: un portal que solo habla con su API, un bus de interoperabilidad que registra cada consulta, y trece instituciones simuladas.',
  },
  {
    to: '/seguimiento',
    label: 'Seguimiento',
    en: 'Where this stands, and what you can do',
    enNav: true,
    fuentes: ['apps/web/src/pages/Seguimiento.tsx', 'apps/web/src/content/seguimiento.ts'],
    titulo: 'En qué va, y qué puede hacer usted — PuraVidaGov',
    descripcion:
      'Quién tendría que mover esto en Costa Rica, dónde está cada institución, y qué derechos puede ejercer un vecino para que avance o para que le respondan.',
  },
  {
    to: '/contacto',
    label: 'Escríbame',
    en: 'Write to me',
    // Reached from the footer of every page. A sixth nav item costs every reader attention to serve the few
    // who write, so it is in the sitemap and out of the navigation.
    enNav: false,
    fuentes: ['apps/web/src/pages/Contacto.tsx', 'apps/web/src/content/contacto-motivos.ts'],
    titulo: 'Escríbame — PuraVidaGov',
    descripcion:
      'Cuénteme si una institución le pidió algo que el Estado ya tenía, corrija un dato equivocado del sitio, u ofrezca ayuda. Va a un correo; no se guarda nada.',
  },
  {
    to: '/quien-lo-hace',
    label: 'Quién lo hace',
    en: 'Who builds this, and why',
    enNav: true,
    fuentes: ['apps/web/src/pages/Author.tsx', 'apps/web/src/content/author.ts'],
    titulo: 'Quién lo hace, y por qué — PuraVidaGov',
    descripcion:
      'Quién construyó este demo, sobre qué base, con qué licencia y con qué advertencias. No es un sitio oficial ni está afiliado a ninguna institución.',
  },
];

/** What the public navigation shows, in order. */
export const PUBLIC_NAV = RUTAS_PUBLICAS.filter((r) => r.enNav);
