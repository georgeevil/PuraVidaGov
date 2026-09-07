import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AuditEntry, BusFailure, BusSuccess, RegistryEntry } from '@pvg/shared';
import type { Express } from 'express';

const BUS_KEY = 'test-bus-key';
const REGISTRO_KEY = 'test-registro-key';
const TRIB_KEY = 'test-trib-key';

let fake: Server;
let fakeUrl: string;
let app: Express;
let resetCalls = 0;
let seenHeaders: Record<string, string | undefined> = {};
let seenBody: unknown;

const MARIA = { id: '1-2345-6789', fullName: 'María Fernández Gómez', canton: 'Montes de Oca' };

function startFakeAgency(): Promise<void> {
  const a = express();
  a.use(express.json());
  a.get('/health', (_req, res) => res.json({ status: 'ok', service: 'fake', mode: 'demo', timestamp: new Date().toISOString() }));
  a.post('/__demo/reset', (_req, res) => {
    resetCalls++;
    res.json({ ok: true });
  });
  a.get('/registro/citizen/:id', (req, res) => {
    seenHeaders = { 'x-api-key': req.header('x-api-key') };
    if (req.params.id !== MARIA.id) {
      return res.status(404).json({ error: { code: 'CITIZEN_NOT_FOUND', message: 'No existe' } });
    }
    res.json(MARIA);
  });
  a.post('/tributacion/createTaxId', (req, res) => {
    seenHeaders = { 'x-api-key': req.header('x-api-key'), 'content-type': req.header('content-type') };
    seenBody = req.body;
    if (req.body.activityCode === '9999') {
      return res.status(422).json({ error: { code: 'ACTIVITY_UNKNOWN', message: 'Actividad desconocida' } });
    }
    res.json({ nite: '3-002-123456', taxRegime: 'simplified', status: 'active' });
  });
  return new Promise((resolve) => {
    fake = a.listen(0, () => {
      fakeUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
      resolve();
    });
  });
}

const baseReq = {
  service: 'registro',
  action: 'getCitizen',
  data: { id: MARIA.id },
  requester: 'portal-ciudadano',
  subjectId: MARIA.id,
  consent: { granted: true, reference: 'TXN-1' },
  purpose: 'Prueba',
};

const bus = () => request(app);
const authed = (r: request.Test) => r.set('x-api-key', BUS_KEY);

beforeAll(async () => {
  await startFakeAgency();
  process.env.BUS_API_KEY = BUS_KEY;
  process.env.REGISTRO_URL = fakeUrl;
  process.env.REGISTRO_API_KEY = REGISTRO_KEY;
  process.env.TRIBUTACION_URL = fakeUrl;
  process.env.TRIBUTACION_API_KEY = TRIB_KEY;
  // Unreachable agencies (closed port) to exercise 502 and healthy:false.
  process.env.CCSS_URL = 'http://127.0.0.1:1';
  process.env.MUNICIPALIDAD_URL = 'http://127.0.0.1:1';
  const mod = await import('../src/app.js');
  app = mod.createApp();
});

afterAll(() => new Promise<void>((r) => fake.close(() => r())));

beforeEach(async () => {
  const audit = await import('../src/audit.js');
  audit.reset();
});

describe('auth', () => {
  it('401 without x-api-key on bus routes', async () => {
    const r = await bus().post('/bus/request').send(baseReq);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    const a = await bus().get('/bus/audit');
    expect(a.status).toBe(401);
  });

  it('/health is open', async () => {
    const r = await bus().get('/health');
    expect(r.status).toBe(200);
    expect(r.body.service).toBe('bus');
  });
});

describe('POST /bus/request', () => {
  it('400 VALIDATION_ERROR on malformed body', async () => {
    const r = await authed(bus().post('/bus/request')).send({ service: 'nope', action: '' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('403 CONSENT_REQUIRED when consent not granted, and it is audited', async () => {
    const r = await authed(bus().post('/bus/request')).send({ ...baseReq, consent: { granted: false, reference: 'TXN-2' } });
    expect(r.status).toBe(403);
    const body = r.body as BusFailure;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('CONSENT_REQUIRED');
    expect(body.exchangeId).toMatch(/^X-/);
    const a = await authed(bus().get('/bus/audit'));
    expect(a.body).toHaveLength(1);
    const entry = a.body[0] as AuditEntry;
    expect(entry.id).toBe(body.exchangeId);
    expect(entry.status).toBe('error');
    expect(entry.errorCode).toBe('CONSENT_REQUIRED');
    expect(entry.consent.granted).toBe(false);
  });

  it('getCitizen substitutes :id and sends the registro key', async () => {
    const r = await authed(bus().post('/bus/request')).send(baseReq);
    expect(r.status).toBe(200);
    const body = r.body as BusSuccess<typeof MARIA>;
    expect(body.ok).toBe(true);
    expect(body.data).toEqual(MARIA);
    expect(body.service).toBe('registro');
    expect(body.action).toBe('getCitizen');
    expect(typeof body.latencyMs).toBe('number');
    expect(seenHeaders['x-api-key']).toBe(REGISTRO_KEY);
  });

  it('forwards POST body with the agency key', async () => {
    const data = { citizenId: MARIA.id, fullName: MARIA.fullName, businessName: 'Soda Pura Vida', activityCode: '5610', businessType: 'natural', address: 'x' };
    const r = await authed(bus().post('/bus/request')).send({ ...baseReq, service: 'tributacion', action: 'createTaxId', data });
    expect(r.status).toBe(200);
    expect(r.body.data.nite).toBe('3-002-123456');
    expect(seenBody).toEqual(data);
    expect(seenHeaders['x-api-key']).toBe(TRIB_KEY);
    expect(seenHeaders['content-type']).toContain('application/json');
  });

  it('maps agency 404 to the same status and code', async () => {
    const r = await authed(bus().post('/bus/request')).send({ ...baseReq, data: { id: '9-9999-9999' }, subjectId: '9-9999-9999' });
    expect(r.status).toBe(404);
    expect(r.body.ok).toBe(false);
    expect(r.body.error.code).toBe('CITIZEN_NOT_FOUND');
    expect(r.body.error.status).toBe(404);
  });

  it('maps agency 422 too', async () => {
    const r = await authed(bus().post('/bus/request')).send({ ...baseReq, service: 'tributacion', action: 'createTaxId', data: { activityCode: '9999' } });
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe('ACTIVITY_UNKNOWN');
  });

  it('404 UNKNOWN_ACTION for an action not registered', async () => {
    const r = await authed(bus().post('/bus/request')).send({ ...baseReq, action: 'deleteCitizen' });
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe('UNKNOWN_ACTION');
  });

  it('502 AGENCY_UNAVAILABLE when the agency is unreachable', async () => {
    const r = await authed(bus().post('/bus/request')).send({ ...baseReq, service: 'ccss', action: 'registerEmployer', data: { nite: 'x' } });
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe('AGENCY_UNAVAILABLE');
    const a = await authed(bus().get('/bus/audit'));
    expect(a.body[0].status).toBe('error');
    expect(a.body[0].errorCode).toBe('AGENCY_UNAVAILABLE');
  });
});

describe('GET /bus/audit', () => {
  it('filters by subjectId, orders newest first, limits, and records field names only', async () => {
    await authed(bus().post('/bus/request')).send({ ...baseReq, purpose: 'primera' });
    await authed(bus().post('/bus/request')).send({ ...baseReq, subjectId: '7-0123-0456', data: { id: '7-0123-0456' }, purpose: 'otra persona' });
    await authed(bus().post('/bus/request')).send({ ...baseReq, purpose: 'segunda' });

    const all = await authed(bus().get('/bus/audit'));
    expect(all.body).toHaveLength(3);
    expect(all.body.map((e: AuditEntry) => e.purpose)).toEqual(['segunda', 'otra persona', 'primera']);

    const maria = await authed(bus().get('/bus/audit').query({ subjectId: MARIA.id }));
    expect(maria.body).toHaveLength(2);
    expect(maria.body.every((e: AuditEntry) => e.subjectId === MARIA.id)).toBe(true);
    expect(maria.body[0].purpose).toBe('segunda');

    const limited = await authed(bus().get('/bus/audit').query({ limit: 1 }));
    expect(limited.body).toHaveLength(1);
    expect(limited.body[0].purpose).toBe('segunda');

    const entry = maria.body[0] as AuditEntry;
    expect(entry.status).toBe('ok');
    expect(entry.fieldsReturned.sort()).toEqual(Object.keys(MARIA).sort());
    expect(JSON.stringify(entry)).not.toContain(MARIA.fullName);
  });
});

describe('GET /bus/registry', () => {
  it('reports healthy flags per agency', async () => {
    const r = await authed(bus().get('/bus/registry'));
    expect(r.status).toBe(200);
    const entries = r.body as RegistryEntry[];
    expect(entries.map((e) => e.service)).toEqual(['registro', 'tributacion', 'ccss', 'municipalidad']);
    const by = Object.fromEntries(entries.map((e) => [e.service, e]));
    expect(by.registro.healthy).toBe(true);
    expect(by.tributacion.healthy).toBe(true);
    expect(by.ccss.healthy).toBe(false);
    expect(by.municipalidad.healthy).toBe(false);
    expect(by.registro.baseUrl).toBe(fakeUrl);
    expect(by.registro.actions.getCitizen).toEqual({ method: 'GET', path: '/registro/citizen/:id' });
    expect(typeof by.registro.lastChecked).toBe('string');
  });
});

describe('POST /__demo/reset', () => {
  it('resets audit without auth and cascades to agencies', async () => {
    await authed(bus().post('/bus/request')).send(baseReq);
    resetCalls = 0;
    const r = await bus().post('/__demo/reset');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.agencies).toEqual({ registro: true, tributacion: true, ccss: false, municipalidad: false });
    expect(resetCalls).toBe(2);
    const a = await authed(bus().get('/bus/audit'));
    expect(a.body).toEqual([]);
  });
});
