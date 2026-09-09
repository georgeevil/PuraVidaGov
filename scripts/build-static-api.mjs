/**
 * Static API generator (docs/CONTRACTS.md v4 → "Static build"). Writes the read-only half of the Portal API
 * into `apps/web/dist-static/api-static/` as flat JSON files, plus the `_redirects` SPA rule, so the bundle built
 * with `VITE_DEPLOY_MODE=static` works on Cloudflare Pages / Netlify / GitHub Pages with no backend at all.
 *
 * Run it with tsx (it imports TypeScript sources): `node --import tsx scripts/build-static-api.mjs`.
 * Everything it writes is derived from the same data the running services use — no second copy of the
 * catalogue lives here.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Kept separate from `apps/web/dist` on purpose: `dist` is what the all-in-one server (`npm start`)
// and infra/Dockerfile.allinone serve, and a static-mode bundle there would talk to /api-static
// instead of the live backend. Override with STATIC_OUT_DIR if a host insists on another path.
const outDir = process.env.STATIC_OUT_DIR
  ? join(root, process.env.STATIC_OUT_DIR)
  : join(root, 'apps/web/dist-static');
const apiDir = join(outDir, 'api-static');

// The registry's base URLs must describe the Compose topology, not whatever happens to be exported in the
// shell that runs the build. Drop every *_URL override before importing the registry so its own defaults win.
for (const key of Object.keys(process.env)) if (key.endsWith('_URL')) delete process.env[key];

const { LEGAL_REFS, ACTIVITIES } = await import('@pvg/shared');
const { listDefinitions, WORKFLOWS } = await import(join(root, 'apps/api/src/workflows/index.ts'));
const { IDENTITY_STEP } = await import(join(root, 'apps/api/src/engine.ts'));
const { config } = await import(join(root, 'apps/api/src/config.ts'));
const { getRegistry } = await import(join(root, 'services/bus/src/registry.ts'));

/** Same shape as `GET /api/legal` in apps/api/src/app.ts. */
const legal = {
  refs: Object.values(LEGAL_REFS),
  workflows: WORKFLOWS.map((w) => ({
    id: w.id,
    title: w.title,
    legal: w.legal,
    steps: [...(w.available ? [IDENTITY_STEP] : []), ...w.steps].map((s) => ({
      id: s.id,
      label: s.label,
      agency: s.agency,
      legal: s.legal,
    })),
  })),
};

/**
 * `GET /api/registry` without the bus: the same entries, with the Compose-internal base URL
 * (`http://<service>:<port>`, matching infra/docker-compose.yml) and **no `healthy` field** — nothing
 * probed these agencies, and the UI must render that as neutral rather than as "down".
 */
const registry = getRegistry().map(({ healthy, lastChecked, ...entry }) => ({
  ...entry,
  baseUrl: `http://${entry.service}:${new URL(entry.baseUrl).port}`,
}));

const files = {
  'workflows.json': listDefinitions(),
  'legal.json': legal,
  'registry.json': registry,
  'benefits.json': { ...config.benefits },
  'activities.json': ACTIVITIES,
};

await mkdir(apiDir, { recursive: true });

const written = [];
for (const [name, value] of Object.entries(files)) {
  const path = join(apiDir, name);
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, body, 'utf8');
  written.push([path, Buffer.byteLength(body)]);
}

// SPA fallback for Cloudflare Pages / Netlify. GitHub Pages ignores it: copy index.html to 404.html there.
const redirects = '/*  /index.html  200\n';
const redirectsPath = join(outDir, '_redirects');
await writeFile(redirectsPath, redirects, 'utf8');
written.push([redirectsPath, Buffer.byteLength(redirects)]);

// ---------------------------------------------------------------- sitemap.xml and robots.txt
//
// The URL list comes from apps/web/src/content/rutas-publicas.ts, the same array the public navigation is
// built from, so a new page appears in both or neither. `/login` and everything behind requireAuth are not
// in it by design — see that file.
//
// SITE_URL exists because this bundle is served from more than one host. Only the canonical one should
// carry a sitemap; a second host advertising the same six URLs asks Google to pick a winner between two
// copies of the same site.
const siteUrl = (process.env.SITE_URL ?? 'https://sindarvueltas.org').replace(/\/+$/, '');
const { RUTAS_PUBLICAS } = await import(join(root, 'apps/web/src/content/rutas-publicas.ts'));

/**
 * Last commit that touched anything the page renders. Dating every URL with the build time would tell a
 * crawler that all six pages change on every deploy, which is false and is exactly how a lastmod stops
 * being believed. If git is unavailable (a tarball build), omit the date rather than invent one.
 */
function ultimoCambio(fuentes) {
  try {
    const fechas = fuentes
      .map((f) => execFileSync('git', ['log', '-1', '--format=%cI', '--', f], { cwd: root, encoding: 'utf8' }).trim())
      .filter(Boolean);
    return fechas.sort().at(-1) ?? null;
  } catch {
    return null;
  }
}

const urls = RUTAS_PUBLICAS.map((r) => {
  const loc = `${siteUrl}${r.to === '/' ? '/' : r.to}`;
  const lastmod = ultimoCambio(r.fuentes);
  return ['  <url>', `    <loc>${loc}</loc>`, ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []), '  </url>'].join(
    '\n',
  );
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
const sitemapPath = join(outDir, 'sitemap.xml');
await writeFile(sitemapPath, sitemap, 'utf8');
written.push([sitemapPath, Buffer.byteLength(sitemap)]);

// ---------------------------------------------------------------- one HTML document per public route
//
// Setting document.title from React covers Googlebot, which renders JavaScript. It does not cover the
// crawlers that matter for a link somebody pastes into WhatsApp, Slack or Twitter: those read the raw HTML
// and stop, so a client-set title is invisible to them and every link would preview as the same generic
// page. So each public route also gets a real file with its own head already filled in.
//
// The SPA then boots over it exactly as before — same bundle, same root div, same _redirects fallback for
// deep links like /tramite/:id that have no file here.
const plantilla = await readFile(join(outDir, 'index.html'), 'utf8');

/** Anything going into an HTML attribute or a title. These strings are ours, but a stray & still breaks XML-ish parsers. */
const esc = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function documentoDe(ruta) {
  const url = `${siteUrl}${ruta.to}`;
  const social = [
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="PuraVidaGov" />`,
    `    <meta property="og:title" content="${esc(ruta.titulo)}" />`,
    `    <meta property="og:description" content="${esc(ruta.descripcion)}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta name="twitter:card" content="summary" />`,
    // Two hosts serve this bundle. Without this every page exists at both addresses and a search engine has
    // to guess which is the real one; the guess is not always the one you want ranked.
    `    <link rel="canonical" href="${url}" />`,
  ].join('\n');

  // Each substitution is checked on its own. Checking only the final result against the template would pass
  // whenever *either* one worked, so a renamed <title> would ship seven pages with seven descriptions and
  // one shared title — the exact silent success this change exists to remove. (It did, until this was fixed.)
  const sustituir = (html, patron, reemplazo, que) => {
    const salida = html.replace(patron, reemplazo);
    if (salida === html) throw new Error(`index.html: no se encontró ${que}; el head cambió de forma (${ruta.to})`);
    return salida;
  };

  const conTitulo = sustituir(
    plantilla,
    /<title>[\s\S]*?<\/title>/,
    `<title>${esc(ruta.titulo)}</title>\n${social}`,
    'el <title>',
  );
  return sustituir(
    conTitulo,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${esc(ruta.descripcion)}" />`,
    'el <meta name="description">',
  );
}

for (const ruta of RUTAS_PUBLICAS) {
  // "/" is index.html itself; every other route becomes <ruta>/index.html, which is what a static host
  // serves for a directory-style URL.
  const destino = ruta.to === '/' ? join(outDir, 'index.html') : join(outDir, ruta.to.slice(1), 'index.html');
  await mkdir(dirname(destino), { recursive: true });
  const cuerpo = documentoDe(ruta);
  await writeFile(destino, cuerpo, 'utf8');
  written.push([destino, Buffer.byteLength(cuerpo)]);
}

const robots = `User-agent: *\nAllow: /\n\n# Nothing behind here is reachable without a session, and on this host there is no backend at all.\nDisallow: /login\nDisallow: /tramite/\nDisallow: /mis-tramites\nDisallow: /auditoria\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
const robotsPath = join(outDir, 'robots.txt');
await writeFile(robotsPath, robots, 'utf8');
written.push([robotsPath, Buffer.byteLength(robots)]);

for (const [path, bytes] of written) console.log(`${relative(root, path)}  ${bytes} bytes`);
