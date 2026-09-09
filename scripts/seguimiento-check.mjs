#!/usr/bin/env node
/**
 * Daily seguimiento check: has anything moved at the institutions that would have to move?
 *
 * The design constraint that shapes everything here: **several .go.cr hosts refuse TCP from datacentre
 * ranges while answering normally from an ordinary connection.** denuncia.cr learned this the expensive
 * way — a weekly link workflow that failed every run for a week without a single dead link. So:
 *
 *   - a source that cannot be reached is `inalcanzable`, never `cambió`, and never opens an issue;
 *   - sources known to be unreachable from CI are marked `enCI: false` in docs/seguimiento-fuentes.json
 *     and skipped entirely unless you pass --todas from a machine that can reach them;
 *   - state has memory (docs/seguimiento-estado.json), so a transient failure is not an event.
 *
 * Change detection is a hash of the normalised text, which is deliberately crude: it answers "did this
 * page change" and nothing else. A hash change is a prompt to go and look, not a finding. Treat the
 * issue it opens as a question, never as an assertion about what the institution did.
 *
 *   node scripts/seguimiento-check.mjs            # CI-reachable sources only
 *   node scripts/seguimiento-check.mjs --todas    # everything, from a normal connection
 *   node scripts/seguimiento-check.mjs --dry      # never write state, never touch issues
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FUENTES = 'docs/seguimiento-fuentes.json';
const ESTADO = 'docs/seguimiento-estado.json';
const TIEMPO_LIMITE = 20_000;
/** Consecutive unreachable runs before we say so out loud. Same three-strike rule as denuncia.cr. */
const GOLPES = 3;

const todas = process.argv.includes('--todas');
const dry = process.argv.includes('--dry');

const { fuentes } = JSON.parse(readFileSync(FUENTES, 'utf8'));
const estado = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, 'utf8')) : {};

/** Strip the parts of a page that change on every request and would otherwise look like news. */
function normalizar(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b[0-9a-f]{8,}\b/gi, ' ')          // cache-busting tokens, build ids, CSRF nonces
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ')      // clocks
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fold accents and case so «Simplificación» matches a keyword written «simplificacion». */
const plegar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * The page as text lines, one per element. Used only by filtered sources: hashing a whole index page
 * whose list rolls every working day raises an issue every working day, which trains you to ignore it.
 */
function lineas(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 2);
}

/** The lines of the page that mention something we are actually watching for, deduplicated and ordered. */
function coincidencias(html, filtro) {
  const todas = lineas(html);
  // A fetch that returns a login wall or an error page also returns zero matches, which would read as
  // "nothing relevant filed" forever. Treat a page with almost no text as unusable instead.
  if (todas.length < 20) return null;
  const claves = filtro.map(plegar);
  return [...new Set(todas.filter((l) => claves.some((k) => plegar(l).includes(k))))].sort();
}

async function revisar(f) {
  const control = AbortSignal.timeout(TIEMPO_LIMITE);
  try {
    const r = await fetch(f.url, { signal: control, redirect: 'follow' });
    if (r.status === 403) return { clase: 'waf', detalle: '403 — blocks non-browser clients' };
    if (!r.ok) return { clase: 'http', detalle: `HTTP ${r.status}` };
    const html = await r.text();
    if (f.filtro) {
      const hits = coincidencias(html, f.filtro);
      if (hits === null) return { clase: 'vacio', detalle: 'page produced almost no text — treated as unusable' };
      const texto = hits.join('\n');
      return {
        clase: 'ok',
        hash: createHash('sha256').update(texto).digest('hex').slice(0, 16),
        largo: hits.length,
        coincidencias: hits,
      };
    }
    const texto = normalizar(html);
    if (texto.length < 200) return { clase: 'vacio', detalle: `only ${texto.length} chars of text` };
    return { clase: 'ok', hash: createHash('sha256').update(texto).digest('hex').slice(0, 16), largo: texto.length };
  } catch (e) {
    const m = String(e?.cause?.code || e?.name || e?.message);
    if (/CERT|TLS|SSL/i.test(m)) return { clase: 'tls', detalle: `incomplete chain or TLS failure (${m})` };
    return { clase: 'inalcanzable', detalle: m };
  }
}

const novedades = [];
const saltadas = [];
const hoy = new Date().toISOString().slice(0, 10);

for (const f of fuentes) {
  if (!f.enCI && !todas) { saltadas.push(f); continue; }
  const r = await revisar(f);
  const previo = estado[f.id] || { fallos: 0 };

  if (r.clase === 'ok') {
    const cambio = previo.hash && previo.hash !== r.hash;
    // For a filtered source the matching lines are the state, not just their hash: without them the issue
    // can only say "something matched", when what you need to read is which expediente is new.
    const nuevas = r.coincidencias
      ? r.coincidencias.filter((l) => !(previo.coincidencias || []).includes(l))
      : [];
    estado[f.id] = {
      hash: r.hash,
      largo: r.largo,
      visto: hoy,
      fallos: 0,
      ...(r.coincidencias ? { coincidencias: r.coincidencias } : {}),
      ...(cambio ? { cambio: hoy } : {}),
    };
    if (cambio) {
      novedades.push({ ...f, previo: previo.hash, ahora: r.hash, desde: previo.visto, nuevas });
      console.log(`CAMBIÓ   ${f.nombre}\n         ${f.url}\n         last seen unchanged ${previo.visto}`);
      for (const l of nuevas) console.log(`         + ${l}`);
    } else if (!previo.hash) {
      console.log(`base     ${f.nombre} (first run, nothing to compare)`);
    } else {
      console.log(`sin cambio ${f.nombre}${f.filtro ? ` (${r.largo} línea(s) coinciden)` : ''}`);
    }
  } else {
    const fallos = (previo.fallos || 0) + 1;
    estado[f.id] = { ...previo, fallos, ultimoFallo: `${hoy} ${r.clase}: ${r.detalle}` };
    const grito = fallos >= GOLPES ? `  <-- ${fallos} runs in a row, worth a look` : '';
    console.log(`${r.clase.padEnd(8)} ${f.nombre} — ${r.detalle}${grito}`);
  }
}

if (saltadas.length) {
  console.log(`\nManual, not reachable from CI (${saltadas.length}):`);
  for (const f of saltadas) console.log(`  · ${f.nombre} — ${f.notaManual || 'check by hand'}`);
}

if (!dry) writeFileSync(ESTADO, JSON.stringify(estado, null, 2) + '\n');

// One issue per changed source. The token is only present in CI; locally this just prints.
const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
if (novedades.length && token && repo && !dry) {
  for (const n of novedades) {
    const titulo = `Seguimiento: ${n.nombre} cambió (${hoy})`;
    const cuerpo = [
      `**${n.nombre}** changed since ${n.desde}.`,
      ``, `- Source: ${n.url}`,
      `- Why it is watched: ${n.porQue}`,
      `- Content hash ${n.previo} → ${n.ahora}`,
      ...(n.filtro
        ? [
            ``,
            `Watched terms: ${n.filtro.join(', ')}.`,
            n.nuevas.length
              ? [`New matching line(s):`, ...n.nuevas.map((l) => `  - ${l}`)].join('\n')
              : `No new matching line — one that matched before has gone. Worth checking what dropped off.`,
          ]
        : []),
      ``,
      `**This is a prompt to look, not a finding.** The check hashes normalised page text, so it cannot tell`,
      `a substantive announcement from a reworded menu. Open the page, decide what actually changed, and`,
      `record anything real in \`docs/research/institutions-and-accountability.md\` with a source before it`,
      `reaches the site.`,
      ``, `Close this issue once you have looked, whether or not it turned out to be anything.`,
    ].join('\n');
    const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({ title: titulo, body: cuerpo, labels: ['seguimiento'] }),
    });
    console.log(r.ok ? `issue abierto: ${titulo}` : `issue FALLÓ (${r.status}): ${await r.text()}`);
  }
}

console.log(`\n${novedades.length} cambio(s), ${saltadas.length} manual, ${fuentes.length} fuentes en total.`);
