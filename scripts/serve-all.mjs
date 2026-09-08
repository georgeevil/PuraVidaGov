#!/usr/bin/env node
/**
 * All-in-one server (docs/CONTRACTS.md v4 → "All-in-one server").
 *
 * One Node process that runs the same fifteen Express apps the Compose stack runs in fifteen
 * containers: the thirteen agencies and the bus listen on loopback-only ports, and the citizen-portal
 * API is mounted directly on the public front app together with the built SPA.
 *
 * The bus→agency and API→bus hops stay real HTTP calls, so the audit log is unchanged.
 *
 *   npx tsx scripts/serve-all.mjs        (or: npm start)
 *
 * Env: PORT (default 8080, the only exposed port), INTERNAL_PORT_BASE (default 4000).
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const publicPort = Number(process.env.PORT ?? 8080) || 8080;
const base = Number(process.env.INTERNAL_PORT_BASE ?? 4000) || 4000;

/** The thirteen agencies, in registry order; the bus takes the base port itself. */
const AGENCIES = [
  { dir: 'services/registro-civil', urlEnv: 'REGISTRO_URL' },
  { dir: 'services/tributacion', urlEnv: 'TRIBUTACION_URL' },
  { dir: 'services/ccss', urlEnv: 'CCSS_URL' },
  { dir: 'services/municipalidad', urlEnv: 'MUNICIPALIDAD_URL' },
  { dir: 'services/registro-nacional', urlEnv: 'REGISTRO_NACIONAL_URL' },
  { dir: 'services/salud', urlEnv: 'SALUD_URL' },
  { dir: 'services/cfia', urlEnv: 'CFIA_URL' },
  { dir: 'services/supen', urlEnv: 'SUPEN_URL' },
  { dir: 'services/mtss', urlEnv: 'MTSS_URL' },
  { dir: 'services/cosevi', urlEnv: 'COSEVI_URL' },
  { dir: 'services/ins', urlEnv: 'INS_URL' },
  { dir: 'services/mep', urlEnv: 'MEP_URL' },
  { dir: 'services/imas', urlEnv: 'IMAS_URL' },
];

/** Only set a default: a real deployment may point any of these somewhere else. */
function setDefault(name, value) {
  if (process.env[name] === undefined || process.env[name] === '') process.env[name] = value;
}

// Every service module reads its configuration at import time, so the environment has to be
// complete BEFORE the first dynamic import below.
setDefault('BUS_URL', `http://127.0.0.1:${base}`);
AGENCIES.forEach((a, i) => setDefault(a.urlEnv, `http://127.0.0.1:${base + 1 + i}`));

const internal = [
  { name: 'bus', dir: 'services/bus', port: base },
  ...AGENCIES.map((a, i) => ({ name: a.dir.split('/')[1], dir: a.dir, port: base + 1 + i })),
];

/** Starts one internal app on loopback and resolves once it is actually listening. */
async function startInternal({ name, dir, port }) {
  const mod = await import(`../${dir}/src/app.ts`);
  const server = mod.createApp().listen(port, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', (err) => reject(new Error(`${name} could not listen on 127.0.0.1:${port} — ${err.message}`)));
  });
  return server;
}

const servers = [];
for (const svc of internal) servers.push(await startInternal(svc));

// ------------------------------------------------------------------ front app
const front = express();

front.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', mode: 'all-in-one', agencies: AGENCIES.length, timestamp: new Date().toISOString() });
});

// The portal API is mounted, not proxied: one less hop, same routes (/api/...).
const { createApp: createApiApp } = await import('../apps/api/src/app.ts');
front.use(createApiApp());

// ------------------------------------------------------------------ SPA
const dist = path.join(repoRoot, 'apps/web/dist');
const indexHtml = path.join(dist, 'index.html');
const haveSpa = fs.existsSync(indexHtml);

if (haveSpa) {
  front.use(express.static(dist, { index: false }));
  // SPA fallback: any GET that is not /api/... and not a real file renders the shell.
  front.get(/^(?!\/api\/).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(indexHtml);
  });
} else {
  console.warn(
    `[serve-all] WARNING: ${path.relative(repoRoot, indexHtml)} not found — the SPA was not built. ` +
      'Run `npm run build -w @pvg/web` first; the API is still served under /api.',
  );
  front.get(/^(?!\/api\/).*/, (_req, res) => {
    res
      .status(200)
      .type('text/plain; charset=utf-8')
      .send(
        'PuraVidaGov (DEMO) — the SPA was not built.\n\n' +
          'Run `npm run build -w @pvg/web` to produce apps/web/dist, then restart.\n' +
          'The API is available under /api and health under /healthz.\n',
      );
  });
}

const server = front.listen(publicPort, '0.0.0.0', () => {
  console.log(
    `[serve-all] PuraVidaGov all-in-one (DEMO) listening on 0.0.0.0:${publicPort} · ` +
      `${internal.length} internal apps on 127.0.0.1:${base}-${base + AGENCIES.length}` +
      (haveSpa ? '' : ' · SPA not built'),
  );
});
servers.push(server);

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  let left = servers.length;
  const done = () => {
    if (--left <= 0) process.exit(0);
  };
  for (const s of servers) s.close(done);
  // Do not hang on keep-alive connections.
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
