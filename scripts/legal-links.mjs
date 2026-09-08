#!/usr/bin/env node
/**
 * Verifies the source links in the legal catalogue (`packages/shared/src/legal.ts`).
 *
 * The reason this exists, and the reason it is not a link checker: on 8 September 2026 four of the nine
 * SCIJ links in the catalogue opened a *different law* — `cr-17` (Ley 17, CCSS) led to Ley 57,
 * «Construcción Cañería Alajuela»; `cr-833` to Ley 4153, impuestos municipales de Siquirres; `cr-3504` to
 * Ley 36, un préstamo de la Municipalidad de Moravia; `cr-7983` al Reglamento 27 de la Gota de Leche.
 * **All nine returned HTTP 200.** A checker that reads status codes would have passed them forever. So this
 * one reads the norm's own title and asserts the law number matches what the catalogue claims.
 *
 * Reading a SCIJ page is not a fetch. `pgrweb.go.cr/scij` 302-redirects to sinalevi.go.cr, which renders
 * through JavaScript, so the HTML says nothing. The text comes from the same endpoint the page's own script
 * calls, in two steps: ask with `version=-1` to be told the latest version, then ask again with it.
 *
 * Everything else is only reachability, and reachability is unreliable on purpose: several of these hosts
 * answer a browser and refuse a script. `waf` and `tls` are therefore reported apart from `CAÍDO` and do not
 * fail the run — the same distinction denuncia.cr draws, and for the same hard-won reason. A host only
 * belongs in BLOQUEAN_ROBOTS once somebody has opened it in a real browser and seen it work.
 *
 * **Not for CI.** GitHub runners cannot reach several .go.cr hosts at all (see the seguimiento notes and
 * denuncia.cr's CLAUDE.md); a green run there would mean nothing and a red one even less. Run it by hand:
 *
 *   npm run enlaces
 *
 * Run it with tsx — it imports the TypeScript catalogue rather than keeping a second copy of the links:
 *   node --import tsx scripts/legal-links.mjs
 */
const { LEGAL_REFS } = await import('@pvg/shared');

const SINALEVI = 'https://sinalevi.go.cr/ResultadosNormativa/_CargarTextoCompleto';
const NAVEGADOR =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const TIEMPO_LIMITE = 45_000;

/**
 * Hosts confirmed — by a person, in a real browser — to be up while refusing scripted requests.
 * Do not add one because it returned 403 here; that is the symptom, not the evidence.
 */
const BLOQUEAN_ROBOTS = new Set([]);

const solo = process.argv.slice(2).filter((a) => !a.startsWith('-'));

async function pedir(url, opciones = {}) {
  const ac = new AbortController();
  const reloj = setTimeout(() => ac.abort(), TIEMPO_LIMITE);
  try {
    return await fetch(url, {
      ...opciones,
      redirect: 'follow',
      signal: ac.signal,
      headers: { 'user-agent': NAVEGADOR, ...(opciones.headers ?? {}) },
    });
  } finally {
    clearTimeout(reloj);
  }
}

/** The id SCIJ knows a norm by, or null if this is not a SCIJ link. */
function fichaDe(url) {
  const m = /[?&]nValor2=(\d+)/.exec(url);
  return m && /pgrweb\.go\.cr|sinalevi\.go\.cr/.test(url) ? m[1] : null;
}

async function textoSinalevi(ficha, version) {
  const r = await pedir(SINALEVI, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-requested-with': 'XMLHttpRequest',
    },
    body: `idFichaNorma=${ficha}&version=${version}&busqueda=`,
  });
  if (!r.ok) throw new Error(`sinalevi respondió ${r.status}`);
  return r.json();
}

/** SINALEVI returns its titles entity-encoded («Protecci&#xF3;n»); a title nobody can read is a title nobody checks. */
function descodificar(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&amp;/g, '&');
}

/** The norm's own title, e.g. «Ley 17 Ley Constitutiva de la Caja Costarricense de Seguro Social CCSS». */
async function tituloDeLaNorma(ficha) {
  const primero = await textoSinalevi(ficha, -1);
  // With version=-1 the service does not answer with text: it answers with the address of the latest
  // version. Asking once and reading `html` gets you an empty string, which looks like a dead norm.
  const version = /param2=(\d+)/.exec(primero.direccion ?? '')?.[1] ?? -1;
  const segundo = version === -1 ? primero : await textoSinalevi(ficha, version);
  const texto = descodificar((segundo.html ?? '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return texto.split('-Usted está en')[0].trim();
}

/** What the catalogue says this is, taken from its id: `cr-833` → 833. */
function numeroEsperado(id) {
  const m = /^cr-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

async function revisarScij(ref, ficha) {
  const esperado = numeroEsperado(ref.id);
  let titulo;
  try {
    titulo = await tituloDeLaNorma(ficha);
  } catch (e) {
    return { estado: 'inalcanzable', detalle: `SINALEVI: ${e.message}` };
  }
  if (!titulo) return { estado: 'inalcanzable', detalle: `SINALEVI no devolvió texto para la ficha ${ficha}` };
  if (esperado === null) return { estado: 'sin-verificar', detalle: `${titulo} (el id no dice qué número esperar)` };

  // SCIJ titles name their own instrument: «Ley 17 …», «Decreto Ejecutivo 36550 …», «Reglamento 9 …».
  const hallado = /^(?:Ley|Decreto Ejecutivo|Decreto|Reglamento|Directriz)\s+(\d+)\b/.exec(titulo)?.[1];
  if (Number(hallado) === esperado) return { estado: 'ok', detalle: titulo };
  return { estado: 'discrepa', detalle: `${titulo} — se esperaba el número ${esperado}` };
}

async function revisarEnlace(url) {
  let r;
  try {
    r = await pedir(url, { method: 'GET' });
  } catch (e) {
    const causa = String(e?.cause?.code ?? e?.cause?.message ?? e.message);
    // An incomplete certificate chain is not a dead site: www.meic.go.cr serves one and answers browsers
    // perfectly. Node is stricter than a browser here, so say `tls`, never CAÍDO.
    if (/CERT|SSL|TLS|UNABLE_TO_VERIFY/i.test(causa)) return { estado: 'tls', detalle: causa };
    return { estado: 'caído', detalle: causa };
  }
  if (r.ok) return { estado: 'ok', detalle: `HTTP ${r.status}` };
  if (r.status === 400 || r.status === 403 || r.status === 405)
    return {
      estado: BLOQUEAN_ROBOTS.has(new URL(url).host) ? 'ok' : 'waf',
      detalle: `HTTP ${r.status} — ábralo en un navegador antes de darlo por muerto`,
    };
  // 5xx is the network talking, not the catalogue: www.meic.go.cr and www.crearempresa.go.cr both answer an
  // ordinary connection and give a proxy 503 from here. Report it, do not fail on it, and never call it dead.
  if (r.status >= 500) return { estado: 'inalcanzable', detalle: `HTTP ${r.status} — sin respuesta útil desde aquí` };
  return { estado: 'caído', detalle: `HTTP ${r.status}` };
}

const MARCA = {
  ok: '  OK      ',
  discrepa: '  DISCREPA',
  caído: '  CAÍDO   ',
  waf: '  waf     ',
  tls: '  tls     ',
  inalcanzable: '  ?       ',
  'sin-verificar': '  —       ',
};

const refs = Object.values(LEGAL_REFS).filter((r) => r.url && (!solo.length || solo.includes(r.id)));
const resultados = [];

for (const ref of refs) {
  const ficha = fichaDe(ref.url);
  const r = ficha ? await revisarScij(ref, ficha) : await revisarEnlace(ref.url);
  resultados.push({ ref, ficha, ...r });
  console.log(`${MARCA[r.estado] ?? r.estado} ${ref.id.padEnd(18)} ${r.detalle}`);
}

const cuenta = (e) => resultados.filter((r) => r.estado === e).length;
const scij = resultados.filter((r) => r.ficha);
console.log(
  `\nSCIJ: ${scij.filter((r) => r.estado === 'ok').length}/${scij.length} coinciden con la norma que dice el catálogo.` +
    `\nResto: ${cuenta('ok')} ok, ${cuenta('waf')} bloquean robots, ${cuenta('tls')} cadena TLS incompleta, ` +
    `${cuenta('inalcanzable')} sin respuesta.`,
);

// `waf`, `tls` and `inalcanzable` are things to look at, not things to fail on: this script runs from a
// laptop precisely because the network, not the catalogue, is what is unreliable about them.
const graves = resultados.filter((r) => r.estado === 'discrepa' || r.estado === 'caído');
if (graves.length) {
  console.error(`\n${graves.length} enlace(s) apuntan a otra cosa o están muertos:`);
  for (const g of graves) console.error(`  ${g.ref.id}: ${g.detalle}\n    ${g.ref.url}`);
  process.exit(1);
}
