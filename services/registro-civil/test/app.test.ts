process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const KEY = 'demo-registro-key';
const app = createApp();

describe('registro-civil', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'registro-civil', mode: 'demo' });
    expect(typeof r.body.timestamp).toBe('string');
  });

  it('401 without key', async () => {
    const r = await request(app).get('/registro/citizen/1-2345-6789').expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/registro/citizen/1-2345-6789').set('x-api-key', 'wrong').expect(401);
  });

  it('returns María exactly as seeded', async () => {
    const r = await request(app).get('/registro/citizen/1-2345-6789').set('x-api-key', KEY).expect(200);
    expect(r.body).toEqual({
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
    });
  });

  it('serves the other two seed citizens with their cantons', async () => {
    const jose = await request(app).get('/registro/citizen/7-0123-0456').set('x-api-key', KEY).expect(200);
    expect(jose.body).toMatchObject({ fullName: 'José Alberto Mora Salazar', canton: 'Talamanca', province: 'Limón' });
    // v3: José is 65 so the IVM pension demo approves him (docs/CONTRACTS.md v3 → CCSS new actions).
    expect(jose.body.dateOfBirth).toBe('1961-06-01');
    const ana = await request(app).get('/registro/citizen/2-0987-0654').set('x-api-key', KEY).expect(200);
    expect(ana.body).toMatchObject({ fullName: 'Ana Lucía Chaves Rojas', canton: 'Grecia', province: 'Alajuela' });
  });

  it('lists citizens', async () => {
    const r = await request(app).get('/registro/citizens').set('x-api-key', KEY).expect(200);
    expect(r.body).toHaveLength(3);
    expect(r.body.map((c: { id: string }) => c.id).sort()).toEqual(['1-2345-6789', '2-0987-0654', '7-0123-0456']);
    expect(r.body[0]).toHaveProperty('fullName');
  });

  it('404 CITIZEN_NOT_FOUND for unknown cédula', async () => {
    const r = await request(app).get('/registro/citizen/9-9999-9999').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('CITIZEN_NOT_FOUND');
    expect(r.body.error.message).toMatch(/cédula/);
  });

  it('400 VALIDATION_ERROR for malformed cédula', async () => {
    const r = await request(app).get('/registro/citizen/abc').set('x-api-key', KEY).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset restores seeds and needs no key', async () => {
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'registro-civil' });
    const list = await request(app).get('/registro/citizens').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(3);
  });
});

const birth = {
  parentId: '1-2345-6789',
  parentFullName: 'María Fernández Gómez',
  childFirstName: 'Sofía',
  childLastName1: 'Fernández',
  childLastName2: 'Gómez',
  birthDate: '2026-08-20',
  hospital: 'Hospital Calderón Guardia',
  sex: 'F',
};

const move = {
  citizenId: '1-2345-6789',
  address: 'Residencial Los Robles, San Rafael, Escazú, San José',
  province: 'San José',
  canton: 'Escazú',
  district: 'San Rafael',
  effectiveDate: '2026-09-01',
};

describe('registro-civil v2: registerBirth', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('registers a birth and adds the minor to the citizen store with the parent\'s canton', async () => {
    const r = await request(app).post('/registro/registerBirth').set('x-api-key', KEY).send(birth).expect(200);
    expect(r.body.childId).toMatch(/^1-\d{4}-\d{4}$/);
    expect(r.body.certificateNumber).toMatch(/^NAC-\d{4}-000001$/);
    expect(r.body.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(r.body).sort()).toEqual(['certificateNumber', 'childId', 'registrationDate']);

    const minor = await request(app).get(`/registro/citizen/${r.body.childId}`).set('x-api-key', KEY).expect(200);
    expect(minor.body).toMatchObject({
      id: r.body.childId,
      fullName: 'Sofía Fernández Gómez',
      firstName: 'Sofía',
      lastName1: 'Fernández',
      lastName2: 'Gómez',
      dateOfBirth: '2026-08-20',
      nationality: 'CR',
      canton: 'Montes de Oca',
      province: 'San José',
      district: 'San Pedro',
      maritalStatus: 'single',
    });
    const list = await request(app).get('/registro/citizens').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(4);
  });

  it('uses the parent\'s province digit for the minor\'s cédula', async () => {
    const r = await request(app)
      .post('/registro/registerBirth')
      .set('x-api-key', KEY)
      .send({ ...birth, parentId: '7-0123-0456', parentFullName: 'José Alberto Mora Salazar', childLastName1: 'Mora', childLastName2: 'Salazar' })
      .expect(200);
    expect(r.body.childId).toMatch(/^7-\d{4}-\d{4}$/);
    const minor = await request(app).get(`/registro/citizen/${r.body.childId}`).set('x-api-key', KEY).expect(200);
    expect(minor.body.canton).toBe('Talamanca');
  });

  it('is idempotent per (parentId, childFirstName, birthDate)', async () => {
    const a = await request(app).post('/registro/registerBirth').set('x-api-key', KEY).send(birth).expect(200);
    const b = await request(app).post('/registro/registerBirth').set('x-api-key', KEY).send(birth).expect(200);
    expect(b.body).toEqual(a.body);
    const twin = await request(app)
      .post('/registro/registerBirth')
      .set('x-api-key', KEY)
      .send({ ...birth, childFirstName: 'Mateo', sex: 'M' })
      .expect(200);
    expect(twin.body.childId).not.toBe(a.body.childId);
    expect(twin.body.certificateNumber).toMatch(/000002$/);
    const list = await request(app).get('/registro/citizens').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(5);
  });

  it('404 CITIZEN_NOT_FOUND when the parent is unknown', async () => {
    const r = await request(app)
      .post('/registro/registerBirth')
      .set('x-api-key', KEY)
      .send({ ...birth, parentId: '9-9999-9999' })
      .expect(404);
    expect(r.body.error.code).toBe('CITIZEN_NOT_FOUND');
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/registro/registerBirth')
      .set('x-api-key', KEY)
      .send({ ...birth, birthDate: '20/08/2026', sex: 'X' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset removes registered minors', async () => {
    const r = await request(app).post('/registro/registerBirth').set('x-api-key', KEY).send(birth).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    await request(app).get(`/registro/citizen/${r.body.childId}`).set('x-api-key', KEY).expect(404);
    const list = await request(app).get('/registro/citizens').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(3);
  });
});

describe('registro-civil v2: updateAddress', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('updates the citizen record and reports the electoral registry', async () => {
    const r = await request(app).post('/registro/updateAddress').set('x-api-key', KEY).send(move).expect(200);
    expect(r.body).toEqual({ updated: true, registry: 'Registro Civil (domicilio electoral)', effectiveDate: '2026-09-01' });
    const c = await request(app).get('/registro/citizen/1-2345-6789').set('x-api-key', KEY).expect(200);
    expect(c.body).toMatchObject({
      address: move.address,
      province: 'San José',
      canton: 'Escazú',
      district: 'San Rafael',
      fullName: 'María Fernández Gómez',
    });
  });

  it('404 CITIZEN_NOT_FOUND for an unknown cédula and 400 on a bad body', async () => {
    const nf = await request(app)
      .post('/registro/updateAddress')
      .set('x-api-key', KEY)
      .send({ ...move, citizenId: '9-9999-9999' })
      .expect(404);
    expect(nf.body.error.code).toBe('CITIZEN_NOT_FOUND');
    const v = await request(app)
      .post('/registro/updateAddress')
      .set('x-api-key', KEY)
      .send({ ...move, address: 'x', effectiveDate: 'hoy' })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset restores the seeded address', async () => {
    await request(app).post('/registro/updateAddress').set('x-api-key', KEY).send(move).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const c = await request(app).get('/registro/citizen/1-2345-6789').set('x-api-key', KEY).expect(200);
    expect(c.body.canton).toBe('Montes de Oca');
  });
});
