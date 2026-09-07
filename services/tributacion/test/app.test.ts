process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const KEY = 'demo-tributacion-key';
const app = createApp();
const body = {
  citizenId: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  businessName: 'Café Dent',
  activityCode: '5610',
  businessType: 'natural',
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
};

describe('tributacion', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'tributacion', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/tributacion/createTaxId').send(body).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
  });

  it('creates a simplified-regime NITE for a natural person', async () => {
    const r = await request(app).post('/tributacion/createTaxId').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body).toMatchObject({
      taxRegime: 'simplified',
      status: 'active',
      activityCode: '5610',
      activityDescription: 'Restaurantes, cafeterías y sodas',
    });
    expect(r.body.nite).toMatch(/^3-002-\d{6}$/);
    expect(r.body.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(r.body).sort()).toEqual(
      ['activityCode', 'activityDescription', 'nite', 'registrationDate', 'status', 'taxRegime'],
    );
  });

  it('uses the traditional regime and 3-101 NITE for a legal entity', async () => {
    const r = await request(app)
      .post('/tributacion/createTaxId')
      .set('x-api-key', KEY)
      .send({ ...body, businessType: 'legal', businessName: 'Café Dent S.A.' })
      .expect(200);
    expect(r.body.taxRegime).toBe('traditional');
    expect(r.body.nite).toMatch(/^3-101-\d{6}$/);
  });

  it('is idempotent per (citizenId, businessName)', async () => {
    const a = await request(app).post('/tributacion/createTaxId').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app).post('/tributacion/createTaxId').set('x-api-key', KEY).send(body).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/tributacion/createTaxId')
      .set('x-api-key', KEY)
      .send({ ...body, businessName: 'Otra Soda' })
      .expect(200);
    expect(other.body.nite).not.toBe(a.body.nite);
    const list = await request(app).get('/tributacion/taxpayers').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/tributacion/createTaxId')
      .set('x-api-key', KEY)
      .send({ ...body, citizenId: '123', activityCode: 'xx' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    expect(r.body.error.message).toMatch(/cédula/);
  });

  it('422 ACTIVITY_UNKNOWN for an unknown activity code', async () => {
    const r = await request(app)
      .post('/tributacion/createTaxId')
      .set('x-api-key', KEY)
      .send({ ...body, activityCode: '9999' })
      .expect(422);
    expect(r.body.error.code).toBe('ACTIVITY_UNKNOWN');
  });

  it('reset clears issued NITEs', async () => {
    await request(app).post('/tributacion/createTaxId').set('x-api-key', KEY).send(body).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/tributacion/taxpayers').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });
});
