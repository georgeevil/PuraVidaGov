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
}

export const RUTAS_PUBLICAS: RutaPublica[] = [
  {
    to: '/',
    label: 'Inicio',
    en: 'Home',
    end: true,
    enNav: false,
    fuentes: ['apps/web/src/pages/Landing.tsx', 'apps/web/src/content/landing.ts'],
  },
  {
    to: '/por-que',
    label: 'Por qué',
    en: 'Why — the case for a once-only government',
    enNav: true,
    fuentes: ['apps/web/src/pages/Case.tsx', 'apps/web/src/content/case.ts'],
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
  },
  {
    to: '/arquitectura',
    label: 'Cómo funciona',
    en: 'How it works',
    enNav: true,
    fuentes: ['apps/web/src/pages/Architecture.tsx'],
  },
  {
    to: '/seguimiento',
    label: 'Seguimiento',
    en: 'Where this stands, and what you can do',
    enNav: true,
    fuentes: ['apps/web/src/pages/Seguimiento.tsx', 'apps/web/src/content/seguimiento.ts'],
  },
  {
    to: '/contacto',
    label: 'Escríbame',
    en: 'Write to me',
    // Reached from the footer of every page. A sixth nav item costs every reader attention to serve the few
    // who write, so it is in the sitemap and out of the navigation.
    enNav: false,
    fuentes: ['apps/web/src/pages/Contacto.tsx', 'apps/web/src/content/contacto-motivos.ts'],
  },
  {
    to: '/quien-lo-hace',
    label: 'Quién lo hace',
    en: 'Who builds this, and why',
    enNav: true,
    fuentes: ['apps/web/src/pages/Author.tsx', 'apps/web/src/content/author.ts'],
  },
];

/** What the public navigation shows, in order. */
export const PUBLIC_NAV = RUTAS_PUBLICAS.filter((r) => r.enNav);
