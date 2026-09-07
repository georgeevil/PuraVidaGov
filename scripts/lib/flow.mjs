// María's journey (PRD §8) over the v2 portal API: login, then every implemented life event.
// Shared by e2e.mjs and smoke.mjs. Throws on the first failed assertion; returns a summary.

const assert = (cond, msg) => {
  if (!cond) throw new Error('assertion failed: ' + msg);
};

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${res.url}: ${JSON.stringify(body)}`);
  return body;
}

export async function login(apiBase, { id = '1-2345-6789', log = console.log } = {}) {
  const post = (path, body, headers = {}) =>
    fetch(`${apiBase}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const challenge = await json(await post('/api/login', { id, password: 'demo' }));
  assert(challenge.challengeId && challenge.otp?.demoCode, 'login returns challenge + demo OTP');
  const otp = await json(await post('/api/login/otp', { challengeId: challenge.challengeId, code: challenge.otp.demoCode }));
  assert(otp.token && otp.citizen?.id === id, 'OTP returns token + citizen');
  assert(otp.provenance?.source === 'registro', 'profile provenance is registro');
  log(`✓ identidad: ${otp.citizen.fullName} (${otp.citizen.id}) vía ${otp.provenance.source} ${otp.provenance.exchangeId}`);
  return { citizen: otp.citizen, auth: { authorization: `Bearer ${otp.token}`, 'content-type': 'application/json' } };
}

/** Starts a workflow and polls until it finishes. Returns the full transaction with result. */
export async function runWorkflow(apiBase, auth, workflowId, input, { log = console.log, pollMs = 300, timeoutMs = 30000 } = {}) {
  const start = await json(
    await fetch(`${apiBase}/api/workflows/${workflowId}/start`, { method: 'POST', headers: auth, body: JSON.stringify({ input, consent: true }) }),
  );
  assert(start.txnId, `${workflowId}: start returns txnId`);
  let txn;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    txn = await json(await fetch(`${apiBase}/api/transactions/${start.txnId}`, { headers: auth }));
    if (txn.status !== 'running') break;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  const stepsText = txn?.steps?.map((s) => `${s.agency}:${s.status}${s.skipped ? '(omitido)' : ''}${s.error ? ' ' + s.error : ''}`).join(' · ');
  assert(txn?.status === 'completed', `${workflowId}: completed (got ${txn?.status}: ${stepsText})`);
  for (const s of txn.steps) log(`  · ${s.agency.padEnd(17)} ${s.status.padEnd(5)} ${s.skipped ? 'omitido' : (s.exchangeId ?? '')} [${s.legal?.status}]`);
  const full = await json(await fetch(`${apiBase}/api/transactions/${start.txnId}/result`, { headers: auth }));
  assert(full.result?.cards?.length >= 3 && full.result.onceOnly?.length >= 6 && full.result.benefits, `${workflowId}: result shape`);
  assert(full.steps.every((s) => s.legal && ['hoy', 'parcial', 'ley'].includes(s.legal.status)), `${workflowId}: every step carries a legal status`);
  const pdfRes = await fetch(`${apiBase}/api/transactions/${start.txnId}/pdf`, { headers: auth });
  assert(pdfRes.ok && pdfRes.headers.get('content-type')?.includes('application/pdf'), `${workflowId}: PDF content-type`);
  const pdf = Buffer.from(await pdfRes.arrayBuffer());
  assert(pdf.subarray(0, 4).toString() === '%PDF', `${workflowId}: PDF magic`);
  log(`✓ ${full.workflowTitle}: ${full.result.headline} · ${full.result.cards.length} tarjetas · ${full.result.onceOnly.length} campos una sola vez · PDF ${pdf.length} B`);
  return full;
}

export async function runMariaJourney(apiBase, { log = console.log, pollMs = 300, timeoutMs = 30000 } = {}) {
  const t0 = Date.now();
  const { citizen, auth } = await login(apiBase, { log });
  const get = async (path) => json(await fetch(`${apiBase}${path}`, { headers: auth }));

  // registry: every agency healthy through the bus
  const registry = await get('/api/registry');
  const down = registry.filter((r) => !r.healthy).map((r) => r.service);
  assert(registry.length === 7 && down.length === 0, `registry healthy (7 agencies; down: ${down.join(',') || 'none'})`);
  log(`✓ registro de servicios: ${registry.map((r) => r.service).join(', ')} — todos disponibles`);

  // catalogue with legal status
  const workflows = await get('/api/workflows');
  const available = workflows.filter((w) => w.available).map((w) => w.id);
  assert(['start-business', 'newborn', 'construction', 'move'].every((id) => available.includes(id)), 'four life events available');
  assert(workflows.every((w) => w.legal?.status && w.legal.basis?.length), 'every life event carries a legal note with a Costa Rican basis');
  log(`✓ eventos de vida: ${workflows.map((w) => `${w.id}[${w.legal.status}${w.available ? '' : ', próximamente'}]`).join(' · ')}`);

  const opts = { log, pollMs, timeoutMs };
  // 1. start a business (sociedad → Registro Nacional step runs)
  const biz = await runWorkflow(apiBase, auth, 'start-business', {
    businessName: 'Café Tico S.A.',
    businessType: 'legal',
    activityCode: '5610',
    address: 'Avenida Central, San Pedro',
    municipality: citizen.canton,
    estimatedEmployees: 3,
  }, opts);
  const cards = Object.fromEntries(biz.result.cards.map((c) => [c.agency, c]));
  assert(/^3-101-\d{6}$/.test(cards['registro-nacional'].rows[0].value), 'cédula jurídica format');
  assert(/^E-\d{5}$/.test(cards.ccss.rows[0].value), 'CCSS employer number');
  assert(/^P-\d{4}-\d{5}$/.test(cards.municipalidad.rows[0].value), 'patente');
  assert(/^PSF-/.test(cards.salud.rows[0].value), 'permiso sanitario');
  assert(biz.result.benefits.costSavedCrc > 0, 'benefits present');

  // 1b. persona física → Registro Nacional step skipped
  const fisica = await runWorkflow(apiBase, auth, 'start-business', {
    businessName: 'Reparaciones María',
    businessType: 'natural',
    activityCode: '9602',
    address: 'Barrio Dent',
    municipality: '',
    estimatedEmployees: 0,
  }, { ...opts, log: () => {} });
  assert(fisica.steps.find((s) => s.agency === 'registro-nacional')?.skipped === true, 'persona física skips Registro Nacional');
  log('✓ persona física: paso del Registro Nacional omitido');

  // 2. newborn
  const baby = await runWorkflow(apiBase, auth, 'newborn', {
    childFirstName: 'Sofía',
    childLastName1: 'Fernández',
    childLastName2: 'Gómez',
    sex: 'F',
    birthDate: '2026-09-01',
    hospital: 'Hospital Calderón Guardia',
    otherParentId: '',
  }, opts);
  const childId = baby.result.cards[0].rows.find((r) => r.label === 'Cédula asignada').value;
  assert(/^\d-\d{4}-\d{4}$/.test(childId), 'minor gets a cédula');

  // 3. construction — property options come from the Registro Nacional through the bus
  const properties = await get('/api/options/properties');
  assert(properties.length >= 1 && properties[0].value, 'properties loaded once-only from Registro Nacional');
  const professionals = await get('/api/options/professionals');
  const build = await runWorkflow(apiBase, auth, 'construction', {
    folio: properties[0].value,
    projectType: 'vivienda',
    areaM2: 120,
    declaredValueCrc: 45000000,
    professionalLicence: professionals[0].value,
  }, opts);
  const permit = build.result.cards.find((c) => c.title === 'Permiso de construcción');
  assert(/^PC-\d{4}-\d{5}$/.test(permit.rows[0].value), 'building permit number');
  assert(permit.rows[1].value.includes('450'), '1 % tax of 45 000 000 = 450 000');

  // 4. move — the new address must be visible in the profile afterwards (Registro Civil updated)
  await runWorkflow(apiBase, auth, 'move', {
    address: '200 m sur de la iglesia, casa blanca',
    province: 'San José',
    canton: 'Curridabat',
    district: 'Curridabat',
    effectiveDate: '2026-09-07',
  }, opts);
  const profile = await get('/api/profile');
  assert(profile.citizen.canton === 'Curridabat', 'profile reflects the new canton after the move');
  log('✓ el perfil ya muestra el nuevo cantón: ' + profile.citizen.canton);

  // legal endpoint and audit
  const legal = await get('/api/legal');
  assert(legal.refs.length >= 15 && legal.workflows.length === 6, 'legal endpoint: refs + 6 workflows');
  const audit = await get('/api/audit');
  const agenciesSeen = new Set(audit.map((a) => a.service));
  assert(agenciesSeen.size === 7, `audit covers 7 agencies (got ${[...agenciesSeen].join(',')})`);
  assert(audit.every((a) => a.subjectId === citizen.id), 'audit scoped to the citizen');
  assert(audit.every((a) => Array.isArray(a.fieldsReturned)), 'audit carries field names only');
  log(`✓ auditoría: ${audit.length} intercambios, ${agenciesSeen.size} instituciones`);
  const mine = await get('/api/transactions');
  assert(mine.length === 5, 'five transactions listed');

  const out = await fetch(`${apiBase}/api/logout`, { method: 'POST', headers: auth });
  assert(out.status === 204, 'logout 204');
  const elapsedMs = Date.now() - t0;
  log(`✓ recorrido completo (5 trámites) en ${(elapsedMs / 1000).toFixed(1)} s (meta PRD: < 120 s por trámite)`);
  assert(elapsedMs < 120000, 'under 2 minutes');
  return { elapsedMs, transactions: mine.length, audit: audit.length };
}

export async function waitForHealth(url, { timeoutMs = 30000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
      lastErr = new Error('status ' + res.status);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timeout waiting for ${url}: ${lastErr?.message}`);
}
