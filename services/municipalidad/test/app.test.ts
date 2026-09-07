process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const KEY = 'demo-municipalidad-key';
const app = createApp();
const year = new Date().toISOString().slice(0, 4);
const body = {
  citizenId: '1-2345-6789',
  nite: '3-002-123456',
  businessName: 'Café Dent',
  activityCode: '5610', // baseFeeCrc 85000
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
  municipality: 'Montes de Oca',
};

describe('municipalidad', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'municipalidad', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/municipalidad/issueLicense').send(body).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
  });

  it('issues a patente with fee = base × canton multiplier and 1-year expiry', async () => {
    const r = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body).toMatchObject({
      patenteNumber: `P-${year}-00001`,
      municipality: 'Montes de Oca',
      annualFeeCrc: 85000,
    });
    expect(r.body.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number(r.body.expiryDate.slice(0, 4))).toBe(Number(r.body.issueDate.slice(0, 4)) + 1);
    expect(r.body.expiryDate.slice(4)).toBe(r.body.issueDate.slice(4));
    expect(Object.keys(r.body).sort()).toEqual(['annualFeeCrc', 'expiryDate', 'issueDate', 'municipality', 'patenteNumber']);
  });

  it('applies the canton multiplier and normalises canton names', async () => {
    const sj = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-000001', municipality: 'san jose' })
      .expect(200);
    expect(sj.body.municipality).toBe('San José');
    expect(sj.body.annualFeeCrc).toBe(102000); // 85000 × 1.2
    const tal = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-000002', municipality: 'Talamanca' })
      .expect(200);
    expect(tal.body.annualFeeCrc).toBe(68000); // 85000 × 0.8
    const gre = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-000003', municipality: 'Grecia' })
      .expect(200);
    expect(gre.body.annualFeeCrc).toBe(76500); // 85000 × 0.9
  });

  it('numbers patentes sequentially per year', async () => {
    const a = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-999999' })
      .expect(200);
    expect(a.body.patenteNumber).toBe(`P-${year}-00001`);
    expect(b.body.patenteNumber).toBe(`P-${year}-00002`);
  });

  it('is idempotent per NITE', async () => {
    const a = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/municipalidad/licenses').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, municipality: '', activityCode: '12' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('422 MUNICIPALITY_UNKNOWN for a canton it does not serve', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, municipality: 'Atlantis' })
      .expect(422);
    expect(r.body.error.code).toBe('MUNICIPALITY_UNKNOWN');
  });

  it('422 ACTIVITY_UNKNOWN for an unknown activity', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, activityCode: '9999' })
      .expect(422);
    expect(r.body.error.code).toBe('ACTIVITY_UNKNOWN');
  });

  it('lists the cantons it serves', async () => {
    const r = await request(app).get('/municipalidad/cantons').set('x-api-key', KEY).expect(200);
    const names = r.body.map((c: { name: string }) => c.name);
    for (const n of ['Montes de Oca', 'San José', 'Talamanca', 'Grecia', 'Alajuela']) expect(names).toContain(n);
  });

  it('reset clears licenses and restarts the counter', async () => {
    await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/municipalidad/licenses').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
    const again = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    expect(again.body.patenteNumber).toBe(`P-${year}-00001`);
  });
});
