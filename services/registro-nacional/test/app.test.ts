process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const KEY = 'demo-registro-nacional-key';
const app = createApp();
const body = {
  citizenId: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  legalName: 'Café Dent Sociedad Anónima',
  activityCode: '5610',
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
};

describe('registro-nacional', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'registro-nacional', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).get('/registro-nacional/properties?ownerId=1-2345-6789').expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).post('/registro-nacional/registerCompany').send(body).expect(401);
  });

  it('lists María\'s two seed properties', async () => {
    const r = await request(app)
      .get('/registro-nacional/properties')
      .query({ ownerId: '1-2345-6789' })
      .set('x-api-key', KEY)
      .expect(200);
    expect(r.body.map((p: { folio: string }) => p.folio).sort()).toEqual(['1-123456-000', '1-654321-000']);
    const clean = r.body.find((p: { folio: string }) => p.folio === '1-123456-000');
    expect(clean).toEqual({
      folio: '1-123456-000',
      ownerId: '1-2345-6789',
      province: 'San José',
      canton: 'Montes de Oca',
      district: 'San Pedro',
      areaM2: 250,
      landUse: 'residencial',
      address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
      encumbrances: [],
    });
    const mortgaged = r.body.find((p: { folio: string }) => p.folio === '1-654321-000');
    expect(mortgaged).toMatchObject({ landUse: 'comercial', areaM2: 400, encumbrances: ['Hipoteca Banco Nacional'] });
  });

  it('serves José and Ana, and an empty list for an owner with no property', async () => {
    const jose = await request(app).get('/registro-nacional/properties?ownerId=7-0123-0456').set('x-api-key', KEY).expect(200);
    expect(jose.body).toHaveLength(1);
    expect(jose.body[0]).toMatchObject({ folio: '7-045678-000', canton: 'Talamanca', landUse: 'mixto', areaM2: 1200 });
    const ana = await request(app).get('/registro-nacional/properties?ownerId=2-0987-0654').set('x-api-key', KEY).expect(200);
    expect(ana.body[0]).toMatchObject({ folio: '2-111222-000', canton: 'Grecia', landUse: 'residencial', areaM2: 300 });
    const none = await request(app).get('/registro-nacional/properties?ownerId=9-9999-9999').set('x-api-key', KEY).expect(200);
    expect(none.body).toEqual([]);
  });

  it('400 VALIDATION_ERROR when ownerId is missing or malformed', async () => {
    const r = await request(app).get('/registro-nacional/properties').set('x-api-key', KEY).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).get('/registro-nacional/properties?ownerId=abc').set('x-api-key', KEY).expect(400);
  });

  it('GET /property/:folio returns a property or 404 PROPERTY_NOT_FOUND', async () => {
    const r = await request(app).get('/registro-nacional/property/7-045678-000').set('x-api-key', KEY).expect(200);
    expect(r.body).toMatchObject({ folio: '7-045678-000', ownerId: '7-0123-0456' });
    const nf = await request(app).get('/registro-nacional/property/9-999999-000').set('x-api-key', KEY).expect(404);
    expect(nf.body.error.code).toBe('PROPERTY_NOT_FOUND');
    expect(nf.body.error.message).toMatch(/folio/);
  });

  it('registers a company with cédula jurídica and tomo', async () => {
    const r = await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body.cedulaJuridica).toMatch(/^3-101-\d{6}$/);
    expect(r.body.tomo).toMatch(/^\d{4}-\d{6}-1-1$/);
    expect(r.body.legalName).toBe(body.legalName);
    expect(r.body.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(r.body).sort()).toEqual(['cedulaJuridica', 'legalName', 'registrationDate', 'tomo']);
  });

  it('is idempotent per (citizenId, legalName)', async () => {
    const a = await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/registro-nacional/registerCompany')
      .set('x-api-key', KEY)
      .send({ ...body, legalName: 'Otra Empresa S.R.L.' })
      .expect(200);
    expect(other.body.cedulaJuridica).not.toBe(a.body.cedulaJuridica);
    const list = await request(app).get('/registro-nacional/companies').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/registro-nacional/registerCompany')
      .set('x-api-key', KEY)
      .send({ ...body, citizenId: '123', legalName: 'ab' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears companies and keeps the seed properties', async () => {
    await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'registro-nacional' });
    const list = await request(app).get('/registro-nacional/companies').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
    const props = await request(app).get('/registro-nacional/properties?ownerId=1-2345-6789').set('x-api-key', KEY).expect(200);
    expect(props.body).toHaveLength(2);
  });
});
