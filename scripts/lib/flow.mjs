// The María journey (PRD §8) as HTTP calls against the portal API. Shared by e2e.mjs and smoke.mjs.
// Throws on the first assertion that fails; returns a summary object.

export async function runMariaJourney(apiBase, { log = console.log, pollMs = 300, timeoutMs = 30000 } = {}) {
  const t0 = Date.now();
  const json = async (res) => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${res.url}: ${JSON.stringify(body)}`);
    return body;
  };
  const assert = (cond, msg) => {
    if (!cond) throw new Error('assertion failed: ' + msg);
  };

  // 1. login (password)
  const login = await json(
    await fetch(`${apiBase}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: '1-2345-6789', password: 'demo' }),
    }),
  );
  assert(login.challengeId && login.otp?.demoCode, 'login returns challenge + demo OTP');
  log(`✓ login: challenge ${login.challengeId}, OTP by ${login.otp.channel} to ${login.otp.maskedPhone}`);

  // 2. OTP → token + citizen from Registro Civil through the bus
  const otp = await json(
    await fetch(`${apiBase}/api/login/otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ challengeId: login.challengeId, code: login.otp.demoCode }),
    }),
  );
  assert(otp.token && otp.citizen?.fullName === 'María Fernández Gómez', 'OTP returns token + María');
  assert(otp.provenance?.source === 'registro', 'profile provenance is registro');
  const auth = { authorization: `Bearer ${otp.token}`, 'content-type': 'application/json' };
  log(`✓ identidad: ${otp.citizen.fullName} (${otp.citizen.id}) vía ${otp.provenance.source} ${otp.provenance.exchangeId}`);

  // 2b. registry: every agency must be healthy through the bus
  const registry = await json(await fetch(`${apiBase}/api/registry`, { headers: auth }));
  const down = registry.filter((r) => !r.healthy).map((r) => r.service);
  assert(registry.length === 4 && down.length === 0, `registry healthy (down: ${down.join(',') || 'none'})`);
  log(`✓ registro de servicios: ${registry.map((r) => r.service).join(', ')} — todos disponibles`);

  // 3. services catalogue
  const services = await json(await fetch(`${apiBase}/api/services`, { headers: auth }));
  const start = services.find((s) => s.id === 'start-business');
  assert(start?.available === true, 'start-business is available');

  // 4. register business
  const reg = await json(
    await fetch(`${apiBase}/api/business/register`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        citizenId: otp.citizen.id,
        businessName: 'Café Tico S.A.',
        activityCode: '5610',
        businessType: 'legal',
        address: 'Avenida Central, San Pedro',
        municipality: otp.citizen.canton,
        estimatedEmployees: 3,
        consent: true,
      }),
    }),
  );
  assert(reg.txnId, 'register returns txnId');
  log(`✓ trámite iniciado: ${reg.txnId}`);

  // 5. poll status
  let txn;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    txn = await json(await fetch(`${apiBase}/api/business/status/${reg.txnId}`, { headers: auth }));
    if (txn.status !== 'running') break;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  assert(txn?.status === 'completed', `workflow completed (got ${txn?.status}: ${JSON.stringify(txn?.steps?.map((s) => [s.agency, s.status, s.error]))})`);
  for (const step of txn.steps) log(`  · ${step.agency.padEnd(14)} ${step.status} ${step.exchangeId ?? ''}`);

  // 6. result
  const result = await json(await fetch(`${apiBase}/api/business/result/${reg.txnId}`, { headers: auth }));
  const r = result.result;
  assert(/^3-101-\d{6}$/.test(r.tax.nite), 'NITE format ' + r.tax.nite);
  assert(/^E-\d{5}$/.test(r.ccss.employerNumber), 'CCSS employer number ' + r.ccss.employerNumber);
  assert(/^P-\d{4}-\d{5}$/.test(r.municipality.patenteNumber), 'patente ' + r.municipality.patenteNumber);
  assert(r.onceOnly.length >= 10, 'once-only dashboard lists ≥10 fields');
  assert(typeof r.benefits.costSavedCrc === 'number', 'benefits present');
  log(`✓ NITE ${r.tax.nite} · CCSS ${r.ccss.employerNumber} · patente ${r.municipality.patenteNumber} (${r.municipality.municipality})`);
  log(`✓ una sola vez: ${r.onceOnly.length} campos sin re-digitar · beneficios: ${r.benefits.tripsAvoided} viajes, ${r.benefits.hoursSaved} h, ₡${r.benefits.costSavedCrc}`);

  // 7. PDF
  const pdfRes = await fetch(`${apiBase}/api/business/result/${reg.txnId}/pdf`, { headers: auth });
  assert(pdfRes.ok && pdfRes.headers.get('content-type')?.includes('application/pdf'), 'PDF content-type');
  const pdf = Buffer.from(await pdfRes.arrayBuffer());
  assert(pdf.subarray(0, 4).toString() === '%PDF', 'PDF magic');
  log(`✓ PDF: ${pdf.length} bytes`);

  // 8. audit trail is visible to the citizen and covers all four agencies
  const audit = await json(await fetch(`${apiBase}/api/audit`, { headers: auth }));
  const agenciesSeen = new Set(audit.map((a) => a.service));
  assert(['registro', 'tributacion', 'ccss', 'municipalidad'].every((a) => agenciesSeen.has(a)), 'audit covers 4 agencies');
  assert(audit.every((a) => a.subjectId === otp.citizen.id), 'audit scoped to the citizen');
  log(`✓ auditoría: ${audit.length} intercambios, ${agenciesSeen.size} instituciones`);

  // 9. logout
  const out = await fetch(`${apiBase}/api/logout`, { method: 'POST', headers: auth });
  assert(out.status === 204, 'logout 204');

  const elapsedMs = Date.now() - t0;
  log(`✓ recorrido completo en ${(elapsedMs / 1000).toFixed(1)} s (meta PRD: < 120 s)`);
  assert(elapsedMs < 120000, 'under 2 minutes');
  return { txnId: reg.txnId, elapsedMs, pdfBytes: pdf.length, audit: audit.length, result: r };
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
