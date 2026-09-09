#!/usr/bin/env node
/**
 * Asserts that the static bundle gives every public route its own head.
 *
 * This exists because the failure it catches is invisible to every other check. A single-page app ships one
 * index.html, so seven routes shared one <title> and one description for the life of the project: typecheck
 * passed, tests passed, e2e passed, the site worked, and every link pasted into a chat previewed as the same
 * generic page. Nothing was broken. It was just useless, quietly.
 *
 *   node --import tsx scripts/check-static-head.mjs [dist-static]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'apps/web/dist-static';
const { RUTAS_PUBLICAS } = await import(join(process.cwd(), 'apps/web/src/content/rutas-publicas.ts'));

const problemas = [];
const titulos = new Map();
const mapa = readFileSync(join(dir, 'sitemap.xml'), 'utf8');

for (const ruta of RUTAS_PUBLICAS) {
  const archivo = join(dir, ruta.to === '/' ? '' : ruta.to, 'index.html');
  let html;
  try {
    html = readFileSync(archivo, 'utf8');
  } catch {
    problemas.push(`${ruta.to}: no se generó ${archivo}`);
    continue;
  }

  const titulo = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  if (!titulo) problemas.push(`${ruta.to}: sin <title>`);
  else if (titulos.has(titulo)) problemas.push(`${ruta.to}: comparte su <title> con ${titulos.get(titulo)} — «${titulo}»`);
  else titulos.set(titulo, ruta.to);

  if (titulo && titulo !== ruta.titulo) problemas.push(`${ruta.to}: el <title> no es el de rutas-publicas.ts`);

  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
  if (!desc) problemas.push(`${ruta.to}: sin meta description`);

  for (const etiqueta of ['og:title', 'og:description', 'og:url', 'rel="canonical"']) {
    if (!html.includes(etiqueta)) problemas.push(`${ruta.to}: sin ${etiqueta}`);
  }

  // The bundle has to still be there: a prerendered page that forgot the script tag is a blank screen.
  if (!/<script[^>]+src="\/assets\/[^"]+\.js"/.test(html)) problemas.push(`${ruta.to}: no carga el bundle`);

  if (!mapa.includes(`${ruta.to}</loc>`) && !mapa.includes(`${ruta.to}<`)) {
    problemas.push(`${ruta.to}: no aparece en sitemap.xml`);
  }
}

if (problemas.length) {
  console.error(`${problemas.length} problema(s) en el head estático:`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}
console.log(`${RUTAS_PUBLICAS.length} rutas públicas, ${titulos.size} títulos distintos, todas en el sitemap.`);
