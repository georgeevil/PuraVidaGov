#!/usr/bin/env node
// Runs the María journey against an already-running stack. Usage: node scripts/smoke.mjs [http://localhost:3001]
import { runMariaJourney } from './lib/flow.mjs';

const apiBase = (process.argv[2] ?? process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
try {
  await runMariaJourney(apiBase);
  console.log('SMOKE OK');
} catch (e) {
  console.error('SMOKE FAILED:', e.message);
  process.exit(1);
}
