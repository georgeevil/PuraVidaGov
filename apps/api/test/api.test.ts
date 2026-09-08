import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { AuditEntry, BusRequest, Citizen, Property, RegistryEntry, WorkflowDefinition } from '@pvg/shared';

process.env.BENEFIT_TRIPS_AVOIDED = '5';
process.env.BENEFIT_HOURS_SAVED = '9';
process.env.BENEFIT_COST_SAVED_CRC = '61000';
process.env.NODE_ENV = 'test';

const MARIA: Citizen = {
  id: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  firstName: 'María',
  lastName1: 'Fernández',
  lastName2: 'Gómez',
  dateOfBirth: '1990-05-14',
  nationality: 'CR',
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
  province: 'San José',
  canton: 'Montes de Oca',
  district: 'San Pedro',
  maritalStatus: 'single',
  email: 'maria.fernandez@ejemplo.cr',
  phone: '+506 8888-1234',
};
const JOSE: Citizen = { ...MARIA, id: '7-0123-0456', fullName: 'José Alberto Mora Salazar', firstName: 'José Alberto', lastName1: 'Mora', lastName2: 'Salazar', canton: 'Talamanca', province: 'Limón', district: 'Bratsi', address: 'Bribri centro, Talamanca', phone: '+506 8888-5678' };
const CITIZENS: Record<string, Citizen> = { [MARIA.id]: MARIA, [JOSE.id]: JOSE };

const PROPERTIES: Property[] = [
  { folio: '1-123456-000', ownerId: MARIA.id, province: 'San José', canton: 'Montes de Oca', district: 'San Pedro', areaM2: 250, landUse: 'residencial', address: 'Barrio Dent', encumbrances: [] },
  { folio: '1-654321-000', ownerId: MARIA.id, province: 'San José', canton: 'Montes de Oca', district: 'San Pedro', areaM2: 400, landUse: 'comercial', address: 'Avenida Central', encumbrances: ['Hipoteca Banco Nacional'] },
  { folio: '7-045678-000', ownerId: JOSE.id, province: 'Limón', canton: 'Talamanca', district: 'Bratsi', areaM2: 1200, landUse: 'mixto', address: 'Bribri', encumbrances: [] },
];

const busCalls: BusRequest[] = [];
const audit: AuditEntry[] = [];
let exchangeSeq = 0;
let resetCalls = 0;
let failAction: string | undefined;
let busDelayMs = 0;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function handleBusRequest(req: BusRequest): Response {
  const exchangeId = `X-TEST${String(++exchangeSeq).padStart(4, '0')}`;
  const base = { exchangeId, service: req.service, action: req.action, latencyMs: 12, timestamp: new Date().toISOString() };
  const fail = (status: number, code: string, message: string) => {
    audit.push({ id: exchangeId, timestamp: base.timestamp, requester: req.requester, service: req.service, action: req.action, subjectId: req.subjectId, purpose: req.purpose, consent: req.consent, status: 'error', errorCode: code, latencyMs: 12, fieldsReturned: [] });
    return jsonResponse(status, { ...base, ok: false, error: { code, message, status } });
  };
  const ok = (data: unknown) => {
    const fields = Array.isArray(data) ? [] : Object.keys(data as Record<string, unknown>);
    audit.unshift({ id: exchangeId, timestamp: base.timestamp, requester: req.requester, service: req.service, action: req.action, subjectId: req.subjectId, purpose: req.purpose, consent: req.consent, status: 'ok', latencyMs: 12, fieldsReturned: fields });
    return jsonResponse(200, { ...base, ok: true, data });
  };
  if (!req.consent.granted) return fail(403, 'CONSENT_REQUIRED', 'Sin consentimiento');
  if (failAction === req.action) return fail(422, 'MUNICIPALITY_UNKNOWN', 'Cantón no atendido');
  const d = req.data as Record<string, unknown>;
  switch (`${req.service}.${req.action}`) {
    case 'registro.getCitizen': {
      const c = CITIZENS[String(d.id)];
      return c ? ok({ ...c }) : fail(404, 'CITIZEN_NOT_FOUND', 'Persona no encontrada');
    }
    case 'registro-nacional.listProperties':
      return ok(PROPERTIES.filter((p) => p.ownerId === String(d.ownerId)));
    case 'registro-nacional.registerCompany':
      return ok({ cedulaJuridica: '3-101-654321', legalName: d.legalName, registrationDate: '2026-09-07', tomo: '2026-123456-1-1' });
    case 'tributacion.createTaxId':
      return ok({ nite: d.businessType === 'legal' ? '3-101-654321' : '3-002-123456', taxRegime: d.businessType === 'natural' ? 'simplified' : 'traditional', status: 'active', activityCode: d.activityCode, activityDescription: 'Restaurantes, cafeterías y sodas', registrationDate: '2026-09-07' });
    case 'ccss.registerEmployer':
      return ok({ employerNumber: 'E-45678', registrationType: d.estimatedEmployees === 0 ? 'self-employed' : 'employer', registrationDate: '2026-09-07', monthlyContributionRateCrc: 123456 });
    case 'municipalidad.issueLicense':
      return ok({ patenteNumber: 'P-2026-00001', municipality: d.municipality, issueDate: '2026-09-07', expiryDate: '2027-09-07', annualFeeCrc: 85000 });
    case 'salud.issueSanitaryPermit':
      return ok({ permitNumber: 'PSF-2026-000123', riskGroup: 'B', issueDate: '2026-09-07', expiryDate: '2029-09-07' });
    default:
      return fail(404, 'ACTION_UNKNOWN', 'Acción no registrada');
  }
}

const REGISTRY: RegistryEntry[] = [
  { service: 'registro', label: 'Registro Civil (TSE)', baseUrl: 'http://registro:4001', actions: { getCitizen: { method: 'GET', path: '/registro/citizen/:id' } }, healthy: true },
];

beforeAll(() => {
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init?.headers);
    if (headers.get('x-api-key') !== 'demo-bus-key') return jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'x-api-key inválida' } });
    if (url.pathname === '/bus/request' && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as BusRequest;
      busCalls.push(body);
      if (busDelayMs) await new Promise((r) => setTimeout(r, busDelayMs));
      return handleBusRequest(body);
    }
    if (url.pathname === '/bus/audit') {
      const subject = url.searchParams.get('subjectId');
      const limit = Number(url.searchParams.get('limit') ?? 100);
      return jsonResponse(200, audit.filter((a) => !subject || a.subjectId === subject).slice(0, limit));
    }
    if (url.pathname === '/bus/registry') return jsonResponse(200, REGISTRY);
    if (url.pathname === '/__demo/reset' && init?.method === 'POST') {
      resetCalls++;
      audit.length = 0;
      return jsonResponse(200, { ok: true });
    }
    return jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'ruta' } });
  });
});

beforeEach(() => {
  busCalls.length = 0;
  failAction = undefined;
  busDelayMs = 0;
});

const { createApp } = await import('../src/app.js');
const app = createApp();

async function login(id = MARIA.id): Promise<string> {
  const l = await request(app).post('/api/login').send({ id, password: 'demo' }).expect(200);
  const o = await request(app).post('/api/login/otp').send({ challengeId: l.body.challengeId, code: l.body.otp.demoCode }).expect(200);
  return o.body.token as string;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const BUSINESS_INPUT = {
  businessName: 'Soda La Esquina',
  activityCode: '5610',
  businessType: 'natural',
  address: 'Frente al parque, San Pedro',
  municipality: 'Montes de Oca',
  estimatedEmployees: 2,
};

function start(token: string, workflowId: string, input: Record<string, unknown>, consent = true) {
  return request(app).post(`/api/workflows/${workflowId}/start`).set(auth(token)).send({ input, consent });
}

async function waitForStatus(token: string, txnId: string, expected: string, timeoutMs = 3000) {
  const started = Date.now();
  for (;;) {
    const r = await request(app).get(`/api/transactions/${txnId}`).set(auth(token)).expect(200);
    if (r.body.status === expected) return r.body;
    if (Date.now() - started > timeoutMs) throw new Error(`timeout waiting for ${expected}; got ${r.body.status}`);
    await new Promise((res) => setTimeout(res, 20));
  }
}

async function runBusiness(token: string, input: Record<string, unknown> = BUSINESS_INPUT) {
  const reg = await start(token, 'start-business', input).expect(202);
  expect(reg.body.txnId).toMatch(/^TXN-/);
  const txnId = reg.body.txnId as string;
  await waitForStatus(token, txnId, 'completed');
  const r = await request(app).get(`/api/transactions/${txnId}/result`).set(auth(token)).expect(200);
  return { txnId, txn: r.body };
}

describe('health', () => {
  it('GET /health', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'api', mode: 'demo' });
  });
});

describe('login', () => {
  it('rejects a wrong password with 401 INVALID_CREDENTIALS', async () => {
    const r = await request(app).post('/api/login').send({ id: MARIA.id, password: 'nope' }).expect(401);
    expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown cédula', async () => {
    const r = await request(app).post('/api/login').send({ id: '9-9999-9999', password: 'demo' }).expect(401);
    expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('validates the body', async () => {
    const r = await request(app).post('/api/login').send({ id: 'abc', password: 'demo' }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns a challenge with the simulated SMS', async () => {
    const r = await request(app).post('/api/login').send({ id: MARIA.id, password: 'demo' }).expect(200);
    expect(r.body.challengeId).toMatch(/^CH-/);
    expect(r.body.otp).toEqual({ channel: 'sms', maskedPhone: '+506 ****-1234', demoCode: '123456' });
  });

  it('rejects a wrong OTP with 401 INVALID_OTP', async () => {
    const l = await request(app).post('/api/login').send({ id: MARIA.id, password: 'demo' }).expect(200);
    const r = await request(app).post('/api/login/otp').send({ challengeId: l.body.challengeId, code: '000000' }).expect(401);
    expect(r.body.error.code).toBe('INVALID_OTP');
  });

  it('returns 410 CHALLENGE_EXPIRED for an unknown challenge', async () => {
    const r = await request(app).post('/api/login/otp').send({ challengeId: 'CH-NOPE', code: '123456' }).expect(410);
    expect(r.body.error.code).toBe('CHALLENGE_EXPIRED');
  });

  it('otp ok returns token + citizen + provenance and fetched via the bus', async () => {
    const l = await request(app).post('/api/login').send({ id: MARIA.id, password: 'demo' }).expect(200);
    const r = await request(app).post('/api/login/otp').send({ challengeId: l.body.challengeId, code: '123456' }).expect(200);
    expect(r.body.token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(r.body.citizen).toEqual(MARIA);
    expect(r.body.provenance).toMatchObject({ source: 'registro', exchangeId: expect.stringMatching(/^X-/), fetchedAt: expect.any(String) });
    const call = busCalls.at(-1)!;
    expect(call).toMatchObject({ service: 'registro', action: 'getCitizen', data: { id: MARIA.id }, requester: 'portal-ciudadano', subjectId: MARIA.id, purpose: 'Cargar perfil al iniciar sesión', consent: { granted: true, reference: `login:${l.body.challengeId}` } });
    // a challenge is single-use
    await request(app).post('/api/login/otp').send({ challengeId: l.body.challengeId, code: '123456' }).expect(410);
  });

  it('logout returns 204', async () => {
    const token = await login();
    await request(app).post('/api/logout').set(auth(token)).expect(204);
  });
});

describe('auth guard', () => {
  it('profile without token → 401 UNAUTHENTICATED', async () => {
    const r = await request(app).get('/api/profile').expect(401);
    expect(r.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('tampered token → 401 UNAUTHENTICATED', async () => {
    const token = await login();
    const r = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}x`).expect(401);
    expect(r.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('expired token → 401 TOKEN_EXPIRED', async () => {
    const { issueToken } = await import('../src/auth.js');
    const old = issueToken(MARIA.id, Date.now() - 9 * 60 * 60 * 1000);
    const r = await request(app).get('/api/profile').set('Authorization', `Bearer ${old}`).expect(401);
    expect(r.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('options require auth; workflows, legal, registry, benefits and activities do not', async () => {
    await request(app).get('/api/options/cantons').expect(401);
    await request(app).get('/api/workflows').expect(200);
    await request(app).get('/api/legal').expect(200);
    await request(app).get('/api/registry').expect(200);
    await request(app).get('/api/benefits').expect(200);
    await request(app).get('/api/activities').expect(200);
  });
});

describe('profile & catalogue', () => {
  it('profile does a fresh bus call with purpose "Mostrar perfil"', async () => {
    const token = await login();
    const r = await request(app).get('/api/profile').set(auth(token)).expect(200);
    expect(r.body.citizen).toEqual(MARIA);
    expect(r.body.provenance.source).toBe('registro');
    expect(busCalls.at(-1)).toMatchObject({ action: 'getCitizen', purpose: 'Mostrar perfil' });
  });

  it('activities and benefits', async () => {
    const token = await login();
    const a = await request(app).get('/api/activities').set(auth(token)).expect(200);
    expect(a.body.find((x: { code: string }) => x.code === '5610')).toBeTruthy();
    const b = await request(app).get('/api/benefits').set(auth(token)).expect(200);
    expect(b.body).toEqual({ tripsAvoided: 5, hoursSaved: 9, costSavedCrc: 61000 });
  });
});

describe('workflow catalogue', () => {
  it('GET /api/workflows lists 6 definitions with legal notes and no functions', async () => {
    const r = await request(app).get('/api/workflows').expect(200);
    const defs = r.body as WorkflowDefinition[];
    expect(defs.map((d) => d.id)).toEqual(['start-business', 'newborn', 'construction', 'move', 'job-loss', 'retirement', 'driver-license', 'bereavement', 'vehicle-purchase', 'home-purchase', 'marriage', 'school-enrolment']);
    for (const d of defs) {
      expect(['hoy', 'parcial', 'ley']).toContain(d.legal.status);
      expect(d.legal.today.length).toBeGreaterThan(20);
      expect(d.legal.basis.length).toBeGreaterThan(0);
      expect(Array.isArray(d.fields)).toBe(true);
      expect(Array.isArray(d.steps)).toBe(true);
      expect(d.benefits).toMatchObject({ tripsAvoided: expect.any(Number), hoursSaved: expect.any(Number), costSavedCrc: expect.any(Number) });
      expect(typeof d.consentText).toBe('string');
      expect((d as unknown as { inputSchema?: unknown }).inputSchema).toBeUndefined();
      expect((d as unknown as { result?: unknown }).result).toBeUndefined();
      for (const s of d.steps) {
        expect(s.legal.status).toBeDefined();
        expect((s as unknown as { data?: unknown }).data).toBeUndefined();
      }
    }
    expect(defs.every((d) => d.available)).toBe(true);
    const dl = defs.find((d) => d.id === 'driver-license')!;
    expect(dl).toMatchObject({ available: true, legal: { status: 'parcial', basis: ['cr-9078', 'cr-8454', 'cr-idc'] } });
    expect(dl.steps.map((s) => s.agency)).toEqual(['salud', 'cosevi', 'cosevi']);
    const retirement = defs.find((d) => d.id === 'retirement')!;
    expect(retirement).toMatchObject({ available: true, legal: { status: 'parcial', basis: ['cr-17', 'cr-7983', 'cr-8220'] } });
    expect(defs.find((d) => d.id === 'job-loss')!.legal.status).toBe('ley');
  });

  it('GET /api/workflows/:id', async () => {
    const r = await request(app).get('/api/workflows/start-business').expect(200);
    expect(r.body).toMatchObject({ id: 'start-business', title: 'Iniciar un negocio', available: true });
    expect(r.body.steps.map((s: { id: string }) => s.id)).toEqual(['registro-nacional', 'tributacion', 'ccss', 'municipalidad', 'salud']);
    expect(r.body.fields.find((f: { name: string }) => f.name === 'activityCode').optionsFrom).toBe('activities');
    const nf = await request(app).get('/api/workflows/nope').expect(404);
    expect(nf.body.error.code).toBe('WORKFLOW_NOT_FOUND');
  });
});

describe('options', () => {
  it('activities', async () => {
    const token = await login();
    const r = await request(app).get('/api/options/activities').set(auth(token)).expect(200);
    expect(r.body).toContainEqual({ value: '5610', label: '5610 · Restaurantes, cafeterías y sodas' });
  });

  it('cantons: the 12 of the municipal mock', async () => {
    const token = await login();
    const r = await request(app).get('/api/options/cantons').set(auth(token)).expect(200);
    expect(r.body).toHaveLength(12);
    expect(r.body.map((o: { value: string }) => o.value)).toContain('Talamanca');
  });

  it('hospitals and professionals are static', async () => {
    const token = await login();
    const h = await request(app).get('/api/options/hospitals').set(auth(token)).expect(200);
    expect(h.body).toHaveLength(6);
    expect(h.body[0].value).toBe('Hospital Calderón Guardia');
    const p = await request(app).get('/api/options/professionals').set(auth(token)).expect(200);
    expect(p.body.map((o: { value: string }) => o.value)).toEqual(['IC-12345', 'A-23456', 'IE-34567']);
    expect(busCalls.filter((c) => c.action !== 'getCitizen')).toHaveLength(0);
  });

  it('properties go through the bus with ownerId = the logged-in cédula', async () => {
    const token = await login();
    const r = await request(app).get('/api/options/properties').set(auth(token)).expect(200);
    expect(r.body).toEqual([
      { value: '1-123456-000', label: '1-123456-000 · Montes de Oca · 250 m² · residencial' },
      { value: '1-654321-000', label: '1-654321-000 · Montes de Oca · 400 m² · comercial' },
    ]);
    const call = busCalls.at(-1)!;
    expect(call).toMatchObject({ service: 'registro-nacional', action: 'listProperties', data: { ownerId: MARIA.id }, subjectId: MARIA.id, purpose: 'Listar propiedades de la persona', consent: { granted: true } });
    const jose = await login(JOSE.id);
    const j = await request(app).get('/api/options/properties').set(auth(jose)).expect(200);
    expect(j.body.map((o: { value: string }) => o.value)).toEqual(['7-045678-000']);
  });

  it('unknown source → 404 OPTIONS_UNKNOWN', async () => {
    const token = await login();
    const r = await request(app).get('/api/options/planets').set(auth(token)).expect(404);
    expect(r.body.error.code).toBe('OPTIONS_UNKNOWN');
  });
});

describe('starting a workflow', () => {
  it('without consent → 400 CONSENT_REQUIRED', async () => {
    const token = await login();
    const r = await start(token, 'start-business', BUSINESS_INPUT, false).expect(400);
    expect(r.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('unavailable workflow → 409 WORKFLOW_UNAVAILABLE', async () => {
    const token = await login();
    const { WORKFLOWS } = await import('../src/workflows/index.js');
    const catalogueOnly = { ...WORKFLOWS[0], id: 'catalogue-only', available: false };
    WORKFLOWS.push(catalogueOnly);
    try {
      const r = await start(token, 'catalogue-only', {}).expect(409);
      expect(r.body.error.code).toBe('WORKFLOW_UNAVAILABLE');
    } finally {
      WORKFLOWS.splice(WORKFLOWS.indexOf(catalogueOnly), 1);
    }
  });

  it('unknown workflow → 404 WORKFLOW_NOT_FOUND', async () => {
    const token = await login();
    const r = await start(token, 'nope', {}).expect(404);
    expect(r.body.error.code).toBe('WORKFLOW_NOT_FOUND');
  });

  it('invalid input → 400 VALIDATION_ERROR with zod details', async () => {
    const token = await login();
    const r = await start(token, 'start-business', { ...BUSINESS_INPUT, activityCode: 'xx' }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    expect(r.body.error.details.fieldErrors.activityCode).toBeDefined();
  });
});

describe('start-business (persona física)', () => {
  it('skips Registro Nacional, completes, and returns cards + once-only + env benefits', async () => {
    const token = await login();
    const reg = await start(token, 'start-business', BUSINESS_INPUT).expect(202);
    const txnId = reg.body.txnId as string;

    const s0 = await request(app).get(`/api/transactions/${txnId}`).set(auth(token)).expect(200);
    expect(s0.body.steps.map((s: { id: string }) => s.id)).toEqual(['identidad', 'registro-nacional', 'tributacion', 'ccss', 'municipalidad', 'salud']);
    expect(s0.body.steps[0]).toMatchObject({ agency: 'registro', label: 'Validar identidad en el Registro Civil', legal: { status: 'hoy', basis: ['cr-8454', 'cr-3504', 'cr-idc'] } });
    expect(s0.body.result).toBeUndefined();
    expect(s0.body).toMatchObject({ workflowId: 'start-business', workflowTitle: 'Iniciar un negocio', citizenId: MARIA.id, input: BUSINESS_INPUT });

    const done = await waitForStatus(token, txnId, 'completed');
    expect(done.steps.every((s: { status: string }) => s.status === 'done')).toBe(true);
    const skipped = done.steps.find((s: { id: string }) => s.id === 'registro-nacional');
    expect(skipped).toMatchObject({ status: 'done', skipped: true });
    expect(skipped.exchangeId).toBeUndefined();
    expect(done.result).toBeUndefined();

    const r = await request(app).get(`/api/transactions/${txnId}/result`).set(auth(token)).expect(200);
    const txn = r.body;
    expect(txn.result.headline).toBe('¡Su negocio está inscrito!');
    expect(txn.result.cards).toHaveLength(4);
    expect(txn.result.cards.map((c: { agency: string }) => c.agency)).toEqual(['tributacion', 'ccss', 'municipalidad', 'salud']);
    expect(txn.result.cards[0].rows[0]).toEqual({ label: 'Identificación tributaria', value: '3-002-123456' });
    expect(txn.result.cards[3].rows[0]).toEqual({ label: 'Número', value: 'PSF-2026-000123' });
    expect(txn.result.onceOnly.length).toBeGreaterThanOrEqual(10);
    expect(txn.result.onceOnly.filter((o: { source: string }) => o.source === 'registro-nacional')).toHaveLength(0);
    expect(txn.result.onceOnly[0]).toMatchObject({ field: 'fullName', source: 'registro', exchangeId: done.steps[0].exchangeId });
    expect(txn.result.benefits).toEqual({ tripsAvoided: 5, hoursSaved: 9, costSavedCrc: 61000, daysTraditional: 30, daysDigital: 1 });

    // bus calls in order with consent reference = txnId; no registro-nacional call for a persona física
    const wf = busCalls.filter((c) => c.consent.reference === txnId);
    expect(wf.map((c) => `${c.service}.${c.action}`)).toEqual(['registro.getCitizen', 'tributacion.createTaxId', 'ccss.registerEmployer', 'municipalidad.issueLicense', 'salud.issueSanitaryPermit']);
    expect(wf.every((c) => c.requester === 'portal-ciudadano' && c.subjectId === MARIA.id && c.consent.granted)).toBe(true);
    expect(wf[0]).toMatchObject({ data: { id: MARIA.id }, purpose: 'Validar identidad' });
    expect((wf[1]!.data as { fullName: string }).fullName).toBe(MARIA.fullName);
    expect((wf[3]!.data as { municipality: string }).municipality).toBe('Montes de Oca');
    expect((wf[4]!.data as { taxId: string }).taxId).toBe('3-002-123456');

    const au = await request(app).get('/api/audit').set(auth(token)).expect(200);
    expect(au.body.every((e: AuditEntry) => e.subjectId === MARIA.id)).toBe(true);
    expect(au.body.some((e: AuditEntry) => e.consent.reference === txnId && e.action === 'issueSanitaryPermit')).toBe(true);
  });

  it('falls back to the citizen canton when no municipality is chosen', async () => {
    const token = await login(JOSE.id);
    const { txnId, txn } = await runBusiness(token, { ...BUSINESS_INPUT, municipality: '', estimatedEmployees: 0 });
    const call = busCalls.find((c) => c.consent.reference === txnId && c.action === 'issueLicense')!;
    expect((call.data as { municipality: string }).municipality).toBe('Talamanca');
    expect(txn.result.cards[1].rows[1]).toEqual({ label: 'Tipo', value: 'Trabajador independiente' });
  });
});

describe('start-business (sociedad)', () => {
  it('runs Registro Nacional and returns 5 cards including the cédula jurídica', async () => {
    const token = await login();
    const { txnId, txn } = await runBusiness(token, { ...BUSINESS_INPUT, businessName: 'Café Tico S.R.L.', businessType: 'legal' });
    const wf = busCalls.filter((c) => c.consent.reference === txnId);
    expect(wf.map((c) => c.action)).toEqual(['getCitizen', 'registerCompany', 'createTaxId', 'registerEmployer', 'issueLicense', 'issueSanitaryPermit']);
    expect(wf[1]).toMatchObject({ service: 'registro-nacional', data: { citizenId: MARIA.id, legalName: 'Café Tico S.R.L.' } });
    expect(txn.steps.find((s: { id: string }) => s.id === 'registro-nacional')).toMatchObject({ status: 'done', exchangeId: expect.stringMatching(/^X-/) });
    expect(txn.steps.find((s: { id: string }) => s.id === 'registro-nacional').skipped).toBeUndefined();
    expect(txn.result.cards).toHaveLength(5);
    expect(txn.result.cards[0]).toMatchObject({ title: 'Sociedad constituida', agency: 'registro-nacional' });
    expect(txn.result.cards[0].rows[0]).toEqual({ label: 'Cédula jurídica', value: '3-101-654321' });
    expect(txn.result.onceOnly.find((o: { field: string }) => o.field === 'cedulaJuridica')).toMatchObject({ source: 'registro-nacional' });
  });
});

describe('transactions', () => {
  it('PDF is a letter-size PDF named after the transaction', async () => {
    const token = await login();
    const { txnId } = await runBusiness(token);
    const pdf = await request(app).get(`/api/transactions/${txnId}/pdf`).set(auth(token)).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(pdf.headers['content-type']).toMatch(/^application\/pdf/);
    expect(pdf.headers['content-disposition']).toContain(`PuraVidaGov-${txnId}.pdf`);
    const body = pdf.body as Buffer;
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(1000);
    expect(body.toString('latin1')).toContain('/MediaBox [0 0 612 792]');
  });

  it('GET /api/transactions lists the caller\'s transactions newest first without result', async () => {
    const token = await login();
    const a = await runBusiness(token);
    const b = await runBusiness(token, { ...BUSINESS_INPUT, businessName: 'Pulpería El Sol', activityCode: '4711' });
    const r = await request(app).get('/api/transactions').set(auth(token)).expect(200);
    const ids = r.body.map((t: { txnId: string }) => t.txnId);
    expect(ids.indexOf(b.txnId)).toBeLessThan(ids.indexOf(a.txnId));
    expect(r.body.every((t: { citizenId: string; result?: unknown }) => t.citizenId === MARIA.id && t.result === undefined)).toBe(true);
    expect(r.body[0]).toMatchObject({ workflowId: 'start-business', workflowTitle: 'Iniciar un negocio', status: 'completed' });
  });

  it('result while running → 409 NOT_COMPLETED', async () => {
    const token = await login();
    busDelayMs = 60;
    const reg = await start(token, 'start-business', BUSINESS_INPUT).expect(202);
    const r = await request(app).get(`/api/transactions/${reg.body.txnId}/result`).set(auth(token)).expect(409);
    expect(r.body.error.code).toBe('NOT_COMPLETED');
    await waitForStatus(token, reg.body.txnId, 'completed');
  });

  it('a failing step marks the transaction failed, stops, and result → 422 FAILED', async () => {
    failAction = 'issueLicense';
    const token = await login();
    const reg = await start(token, 'start-business', BUSINESS_INPUT).expect(202);
    const st = await waitForStatus(token, reg.body.txnId, 'failed');
    const muni = st.steps.find((s: { id: string }) => s.id === 'municipalidad');
    expect(muni.status).toBe('error');
    expect(muni.error).toContain('MUNICIPALITY_UNKNOWN');
    expect(st.steps.find((s: { id: string }) => s.id === 'ccss').status).toBe('done');
    expect(st.steps.find((s: { id: string }) => s.id === 'salud').status).toBe('pending');
    expect(busCalls.filter((c) => c.consent.reference === reg.body.txnId).map((c) => c.action)).not.toContain('issueSanitaryPermit');
    const r = await request(app).get(`/api/transactions/${reg.body.txnId}/result`).set(auth(token)).expect(422);
    expect(r.body.error.code).toBe('FAILED');
    expect(r.body.error.message).toContain('MUNICIPALITY_UNKNOWN');
  });

  it("another citizen's txn → 404", async () => {
    const maria = await login(MARIA.id);
    const { txnId } = await runBusiness(maria);
    const jose = await login(JOSE.id);
    const r = await request(app).get(`/api/transactions/${txnId}`).set(auth(jose)).expect(404);
    expect(r.body.error.code).toBe('TXN_NOT_FOUND');
    await request(app).get(`/api/transactions/${txnId}/result`).set(auth(jose)).expect(404);
    await request(app).get(`/api/transactions/${txnId}/pdf`).set(auth(jose)).expect(404);
    const list = await request(app).get('/api/transactions').set(auth(jose)).expect(200);
    expect(list.body.map((t: { txnId: string }) => t.txnId)).not.toContain(txnId);
  });
});

describe('legal', () => {
  it('GET /api/legal returns refs and per-workflow statuses', async () => {
    const r = await request(app).get('/api/legal').expect(200);
    expect(r.body.refs.find((x: { id: string }) => x.id === 'cr-8220')).toMatchObject({ jurisdiction: 'CR', short: 'Ley 8220 arts. 2 y 8' });
    expect(r.body.refs.some((x: { jurisdiction: string }) => x.jurisdiction === 'EE')).toBe(true);
    expect(r.body.workflows.map((w: { id: string }) => w.id)).toEqual(['start-business', 'newborn', 'construction', 'move', 'job-loss', 'retirement', 'driver-license', 'bereavement', 'vehicle-purchase', 'home-purchase', 'marriage', 'school-enrolment']);
    const sb = r.body.workflows.find((w: { id: string }) => w.id === 'start-business');
    expect(sb).toMatchObject({ title: 'Iniciar un negocio', legal: { status: 'parcial' } });
    expect(sb.steps[0]).toMatchObject({ id: 'identidad', agency: 'registro', legal: { status: 'hoy' } });
    expect(sb.steps.find((s: { id: string }) => s.id === 'municipalidad')).toMatchObject({ agency: 'municipalidad', label: 'Emitir patente municipal', legal: { status: 'ley' } });
    for (const w of r.body.workflows) {
      for (const s of w.steps) expect(Object.keys(s).sort()).toEqual(['agency', 'id', 'label', 'legal']);
    }
    expect(r.body.workflows.find((w: { id: string }) => w.id === 'retirement').steps.map((s: { id: string }) => s.id)).toEqual(['identidad', 'cuotas', 'pension', 'rop']);
  });
});

describe('proxies and reset', () => {
  it('registry proxy', async () => {
    const token = await login();
    const r = await request(app).get('/api/registry').set(auth(token)).expect(200);
    expect(r.body).toEqual(REGISTRY);
  });

  it('reset clears transactions and cascades to the bus without auth', async () => {
    const token = await login();
    const { txnId } = await runBusiness(token);
    const before = resetCalls;
    const r = await request(app).post('/api/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, reset: { api: 'ok', bus: 'ok' } });
    expect(resetCalls).toBe(before + 1);
    await request(app).get(`/api/transactions/${txnId}`).set(auth(token)).expect(404);
    const list = await request(app).get('/api/transactions').set(auth(token)).expect(200);
    expect(list.body).toEqual([]);
  });
});
