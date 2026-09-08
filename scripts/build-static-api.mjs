/**
 * Static API generator (docs/CONTRACTS.md v4 → "Static build"). Writes the read-only half of the Portal API
 * into `apps/web/dist-static/api-static/` as flat JSON files, plus the `_redirects` SPA rule, so the bundle built
 * with `VITE_DEPLOY_MODE=static` works on Cloudflare Pages / Netlify / GitHub Pages with no backend at all.
 *
 * Run it with tsx (it imports TypeScript sources): `node --import tsx scripts/build-static-api.mjs`.
 * Everything it writes is derived from the same data the running services use — no second copy of the
 * catalogue lives here.
 */
import { mkdir, writeFile } from 'node:fs/promises';
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

for (const [path, bytes] of written) console.log(`${relative(root, path)}  ${bytes} bytes`);
