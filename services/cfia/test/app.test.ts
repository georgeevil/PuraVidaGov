process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { cfiaFee, createApp } from '../src/app.js';

const KEY = 'demo-cfia-key';
const app = createApp();
const body = {
  citizenId: '1-2345-6789',
  folio: '1-123456-000',
  projectType: 'vivienda',
  areaM2: 120,
  declaredValueCrc: 45000000,
  professionalLicence: 'IC-12345',
  landUseCertificate: 'US-2026-00001',
};

const year = new Date().toISOString().slice(0, 4);

describe('cfia', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'cfia', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/cfia/reviewPlans').send(body).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/cfia/professionals').expect(401);
  });

  it('lists the three seed professionals', async () => {
    const r = await request(app).get('/cfia/professionals').set('x-api-key', KEY).expect(200);
    expect(r.body.map((p: { licence: string }) => p.licence)).toEqual(['IC-12345', 'A-23456', 'IE-34567']);
    expect(r.body[0]).toEqual({ licence: 'IC-12345', name: 'Ing. Laura Jiménez Solano', discipline: 'Ingeniería civil' });
  });

  it('reviews plans: four approvals, approved area, 0.265 % fee', async () => {
    const r = await request(app).post('/cfia/reviewPlans').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body.apcNumber).toBe(`APC-${year}-000001`);
    expect(r.body.professionalLicence).toBe('IC-12345');
    expect(r.body.approvedAreaM2).toBe(120);
    expect(r.body.cfiaFeeCrc).toBe(119250);
    expect(cfiaFee(45000000)).toBe(119250);
    expect(r.body.reviews.map((x: { institution: string }) => x.institution)).toEqual([
      'Ministerio de Salud',
      'Bomberos',
      'AyA',
      'INVU',
    ]);
    expect(r.body.reviews.every((x: { result: string }) => x.result === 'aprobado')).toBe(true);
    expect(r.body.reviews[0].reference).toMatch(/^MS-\d{4}-\d{6}$/);
    expect(r.body.reviews[1].reference).toMatch(/^BOM-\d{4}-\d{6}$/);
    expect(Object.keys(r.body).sort()).toEqual(['apcNumber', 'approvedAreaM2', 'cfiaFeeCrc', 'professionalLicence', 'reviews']);
  });

  it('is idempotent per (folio, professionalLicence)', async () => {
    const a = await request(app).post('/cfia/reviewPlans').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app).post('/cfia/reviewPlans').set('x-api-key', KEY).send({ ...body, areaM2: 999 }).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/cfia/reviewPlans')
      .set('x-api-key', KEY)
      .send({ ...body, professionalLicence: 'A-23456' })
      .expect(200);
    expect(other.body.apcNumber).toBe(`APC-${year}-000002`);
    const list = await request(app).get('/cfia/reviews').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('422 PROFESSIONAL_UNKNOWN for a licence not in the registry', async () => {
    const r = await request(app)
      .post('/cfia/reviewPlans')
      .set('x-api-key', KEY)
      .send({ ...body, professionalLicence: 'XX-00000' })
      .expect(422);
    expect(r.body.error.code).toBe('PROFESSIONAL_UNKNOWN');
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/cfia/reviewPlans')
      .set('x-api-key', KEY)
      .send({ ...body, projectType: 'torre', areaM2: -1 })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears reviews and restarts the counter', async () => {
    await request(app).post('/cfia/reviewPlans').set('x-api-key', KEY).send(body).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'cfia' });
    expect((await request(app).get('/cfia/reviews').set('x-api-key', KEY)).body).toEqual([]);
    const again = await request(app).post('/cfia/reviewPlans').set('x-api-key', KEY).send(body).expect(200);
    expect(again.body.apcNumber).toBe(`APC-${year}-000001`);
  });
});
