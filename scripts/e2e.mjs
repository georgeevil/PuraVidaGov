#!/usr/bin/env node
// End-to-end: boots the six Node services in-process-adjacent child processes on ephemeral-ish ports,
// waits for health, runs the María journey, and shuts everything down. No Docker needed; CI runs this.
import { spawn } from 'node:child_process';
import { runMariaJourney, waitForHealth } from './lib/flow.mjs';

const base = Number(process.env.E2E_BASE_PORT ?? 45000);
const ports = { registro: base + 1, tributacion: base + 2, ccss: base + 3, municipalidad: base + 4, bus: base + 5, api: base + 6 };
const env = {
  ...process.env,
  LOG_SILENT: process.env.E2E_VERBOSE ? '' : '1',
  AGENCY_LATENCY_MS: process.env.AGENCY_LATENCY_MS ?? '50',
  REGISTRO_PORT: String(ports.registro),
  TRIBUTACION_PORT: String(ports.tributacion),
  CCSS_PORT: String(ports.ccss),
  MUNICIPALIDAD_PORT: String(ports.municipalidad),
  BUS_PORT: String(ports.bus),
  API_PORT: String(ports.api),
  REGISTRO_URL: `http://127.0.0.1:${ports.registro}`,
  TRIBUTACION_URL: `http://127.0.0.1:${ports.tributacion}`,
  CCSS_URL: `http://127.0.0.1:${ports.ccss}`,
  MUNICIPALIDAD_URL: `http://127.0.0.1:${ports.municipalidad}`,
  BUS_URL: `http://127.0.0.1:${ports.bus}`,
};

const entries = [
  'services/registro-civil',
  'services/tributacion',
  'services/ccss',
  'services/municipalidad',
  'services/bus',
  'apps/api',
];
const procs = entries.map((dir) =>
  spawn('npx', ['tsx', `${dir}/src/index.ts`], { env, stdio: process.env.E2E_VERBOSE ? 'inherit' : 'ignore' }),
);
const shutdown = () => procs.forEach((p) => p.kill('SIGTERM'));
process.on('exit', shutdown);

try {
  await Promise.all(Object.values(ports).map((p) => waitForHealth(`http://127.0.0.1:${p}/health`)));
  console.log('all services healthy');
  const apiBase = `http://127.0.0.1:${ports.api}`;
  await runMariaJourney(apiBase);
  // second run after a demo reset must also pass (idempotent seed)
  await fetch(`${apiBase}/api/__demo/reset`, { method: 'POST' });
  await runMariaJourney(apiBase, { log: () => {} });
  console.log('E2E OK');
  shutdown();
  process.exit(0);
} catch (e) {
  console.error('E2E FAILED:', e.message);
  shutdown();
  process.exit(1);
}
