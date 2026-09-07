import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { AuditEntry, BusRequest, Citizen, RegistryEntry } from '@pvg/shared';

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
  const ok = (data: Record<string, unknown>) => {
    audit.unshift({ id: exchangeId, timestamp: base.timestamp, requester: req.requester, service: req.service, action: req.action, subjectId: req.subjectId, purpose: req.purpose, consent: req.consent, status: 'ok', latencyMs: 12, fieldsReturned: Object.keys(data) });
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
    case 'tributacion.createTaxId':
      return ok({ nite: '3-002-123456', taxRegime: d.businessType === 'natural' ? 'simplified' : 'traditional', status: 'active', activityCode: d.activityCode, activityDescription: 'Restaurantes, cafeterías y sodas', registrationDate: '2026-09-07' });
    case 'ccss.registerEmployer':
      return ok({ employerNumber: 'E-45678', registrationType: d.estimatedEmployees === 0 ? 'self-employed' : 'employer', registrationDate: '2026-09-07', monthlyContributionRateCrc: 123456 });
    case 'municipalidad.issueLicense':
      return ok({ patenteNumber: 'P-2026-00001', municipality: d.municipality, issueDate: '2026-09-07', expiryDate: '2027-09-07', annualFeeCrc: 85000 });
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

const REGISTER_BODY = {
  citizenId: MARIA.id,
  businessName: 'Soda La Esquina',
  activityCode: '5610',
  businessType: 'natural',
  address: 'Frente al parque, San Pedro',
  municipality: 'Montes de Oca',
  estimatedEmployees: 2,
  consent: true,
};

async function waitForStatus(token: string, txnId: string, expected: string, timeoutMs = 3000) {
  const started = Date.now();
  for (;;) {
    const r = await request(app).get(`/api/business/status/${txnId}`).set('Authorization', `Bearer ${token}`).expect(200);
    if (r.body.status === expected) return r.body;
    if (Date.now() - started > timeoutMs) throw new Error(`timeout waiting for ${expected}; got ${r.body.status}`);
    await new Promise((res) => setTimeout(res, 20));
  }
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
    await request(app).post('/api/logout').set('Authorization', `Bearer ${token}`).expect(204);
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
});

describe('profile & catalogue', () => {
  it('profile does a fresh bus call with purpose "Mostrar perfil"', async () => {
    const token = await login();
    const r = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body.citizen).toEqual(MARIA);
    expect(r.body.provenance.source).toBe('registro');
    expect(busCalls.at(-1)).toMatchObject({ action: 'getCitizen', purpose: 'Mostrar perfil' });
  });

  it('services catalogue', async () => {
    const token = await login();
    const r = await request(app).get('/api/services').set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body.length).toBeGreaterThanOrEqual(4);
    expect(r.body[0]).toMatchObject({ id: 'start-business', title: 'Iniciar un negocio', titleEn: 'Start a business', available: true, agencies: ['registro', 'tributacion', 'ccss', 'municipalidad'] });
    expect(r.body.filter((s: { available: boolean }) => !s.available).length).toBeGreaterThanOrEqual(3);
  });

  it('activities and benefits', async () => {
    const token = await login();
    const a = await request(app).get('/api/activities').set('Authorization', `Bearer ${token}`).expect(200);
    expect(a.body.find((x: { code: string }) => x.code === '5610')).toBeTruthy();
    const b = await request(app).get('/api/benefits').set('Authorization', `Bearer ${token}`).expect(200);
    expect(b.body).toEqual({ tripsAvoided: 5, hoursSaved: 9, costSavedCrc: 61000 });
  });
});

describe('business registration', () => {
  it('without consent → 400 CONSENT_REQUIRED', async () => {
    const token = await login();
    const r = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send({ ...REGISTER_BODY, consent: false }).expect(400);
    expect(r.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('invalid body → 400 VALIDATION_ERROR', async () => {
    const token = await login();
    const r = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send({ ...REGISTER_BODY, activityCode: 'xx' }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('happy path: status polling, result, once-only, benefits, pdf, audit', async () => {
    const token = await login();
    const reg = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send({ ...REGISTER_BODY, citizenId: '9-9999-9999' }).expect(202);
    expect(reg.body.txnId).toMatch(/^TXN-/);
    const txnId = reg.body.txnId as string;

    const s0 = await request(app).get(`/api/business/status/${txnId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(s0.body.steps.map((s: { agency: string }) => s.agency)).toEqual(['registro', 'tributacion', 'ccss', 'municipalidad']);
    expect(s0.body.result).toBeUndefined();

    const done = await waitForStatus(token, txnId, 'completed');
    expect(done.steps.every((s: { status: string }) => s.status === 'done')).toBe(true);
    expect(done.result).toBeUndefined();

    const r = await request(app).get(`/api/business/result/${txnId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body.citizenId).toBe(MARIA.id); // server overrode the client-sent citizenId
    expect(r.body.request.citizenId).toBe(MARIA.id);
    expect(r.body.result.tax.nite).toBe('3-002-123456');
    expect(r.body.result.tax.taxRegime).toBe('simplified');
    expect(r.body.result.ccss.employerNumber).toBe('E-45678');
    expect(r.body.result.municipality.patenteNumber).toBe('P-2026-00001');
    expect(r.body.result.citizen.id).toBe(MARIA.id);
    expect(r.body.result.onceOnly).toHaveLength(10);
    expect(r.body.result.onceOnly.map((o: { field: string }) => o.field)).toEqual(['fullName', 'id', 'dateOfBirth', 'address', 'canton', 'nationality', 'nite', 'taxRegime', 'employerNumber', 'patenteNumber']);
    expect(r.body.result.benefits).toEqual({ tripsAvoided: 5, hoursSaved: 9, costSavedCrc: 61000 });

    // bus calls in order with consent reference = txnId
    const wf = busCalls.filter((c) => c.consent.reference === txnId);
    expect(wf.map((c) => `${c.service}.${c.action}`)).toEqual(['registro.getCitizen', 'tributacion.createTaxId', 'ccss.registerEmployer', 'municipalidad.issueLicense']);
    expect(wf.every((c) => c.requester === 'portal-ciudadano' && c.subjectId === MARIA.id && c.consent.granted)).toBe(true);
    expect((wf[3]!.data as { municipality: string }).municipality).toBe('Montes de Oca');
    expect((wf[1]!.data as { fullName: string }).fullName).toBe(MARIA.fullName);

    const pdf = await request(app).get(`/api/business/result/${txnId}/pdf`).set('Authorization', `Bearer ${token}`).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(pdf.headers['content-type']).toMatch(/^application\/pdf/);
    expect(pdf.headers['content-disposition']).toContain(`PuraVidaGov-${txnId}.pdf`);
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
    expect((pdf.body as Buffer).length).toBeGreaterThan(1000);

    const au = await request(app).get('/api/audit').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(au.body)).toBe(true);
    expect(au.body.every((e: AuditEntry) => e.subjectId === MARIA.id)).toBe(true);
    expect(au.body.some((e: AuditEntry) => e.consent.reference === txnId && e.action === 'issueLicense')).toBe(true);
  });

  it('falls back to the citizen canton when no municipality is chosen', async () => {
    const token = await login(JOSE.id);
    const reg = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send({ ...REGISTER_BODY, citizenId: JOSE.id, municipality: '', estimatedEmployees: 0 }).expect(202);
    await waitForStatus(token, reg.body.txnId, 'completed');
    const call = busCalls.find((c) => c.consent.reference === reg.body.txnId && c.action === 'issueLicense')!;
    expect((call.data as { municipality: string }).municipality).toBe('Talamanca');
    const r = await request(app).get(`/api/business/result/${reg.body.txnId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body.result.ccss.registrationType).toBe('self-employed');
  });

  it('result while running → 409 NOT_COMPLETED', async () => {
    const token = await login();
    busDelayMs = 60;
    const reg = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send(REGISTER_BODY).expect(202);
    const r = await request(app).get(`/api/business/result/${reg.body.txnId}`).set('Authorization', `Bearer ${token}`).expect(409);
    expect(r.body.error.code).toBe('NOT_COMPLETED');
    await waitForStatus(token, reg.body.txnId, 'completed');
  });

  it('a failing step marks the transaction failed and result → 422 FAILED', async () => {
    failAction = 'issueLicense';
    const token = await login();
    const reg = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send(REGISTER_BODY).expect(202);
    const st = await waitForStatus(token, reg.body.txnId, 'failed');
    const muni = st.steps.find((s: { agency: string }) => s.agency === 'municipalidad');
    expect(muni.status).toBe('error');
    expect(muni.error).toContain('MUNICIPALITY_UNKNOWN');
    expect(st.steps.find((s: { agency: string }) => s.agency === 'ccss').status).toBe('done');
    const r = await request(app).get(`/api/business/result/${reg.body.txnId}`).set('Authorization', `Bearer ${token}`).expect(422);
    expect(r.body.error.code).toBe('FAILED');
    expect(r.body.error.message).toContain('MUNICIPALITY_UNKNOWN');
  });

  it("another citizen's txn → 404", async () => {
    const maria = await login(MARIA.id);
    const reg = await request(app).post('/api/business/register').set('Authorization', `Bearer ${maria}`).send(REGISTER_BODY).expect(202);
    const jose = await login(JOSE.id);
    const r = await request(app).get(`/api/business/status/${reg.body.txnId}`).set('Authorization', `Bearer ${jose}`).expect(404);
    expect(r.body.error.code).toBe('TXN_NOT_FOUND');
    await request(app).get(`/api/business/result/${reg.body.txnId}`).set('Authorization', `Bearer ${jose}`).expect(404);
    await waitForStatus(maria, reg.body.txnId, 'completed');
  });
});

describe('proxies and reset', () => {
  it('registry proxy', async () => {
    const token = await login();
    const r = await request(app).get('/api/registry').set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body).toEqual(REGISTRY);
  });

  it('reset clears transactions and cascades to the bus without auth', async () => {
    const token = await login();
    const reg = await request(app).post('/api/business/register').set('Authorization', `Bearer ${token}`).send(REGISTER_BODY).expect(202);
    await waitForStatus(token, reg.body.txnId, 'completed');
    const before = resetCalls;
    const r = await request(app).post('/api/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, reset: { api: 'ok', bus: 'ok' } });
    expect(resetCalls).toBe(before + 1);
    await request(app).get(`/api/business/status/${reg.body.txnId}`).set('Authorization', `Bearer ${token}`).expect(404);
  });
});
