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
      children: ['1-9999-0001'], // v4: Lucas
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
    expect(r.body).toHaveLength(7);
    expect(r.body.map((c: { id: string }) => c.id).sort()).toEqual([
      '1-1111-2222',
      '1-2345-6789',
      '1-9999-0001',
      '2-0987-0654',
      '7-0100-0300',
      '7-0111-0222',
      '7-0123-0456',
    ]);
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
    expect(list.body).toHaveLength(7);
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
    expect(list.body).toHaveLength(8);
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
    expect(list.body).toHaveLength(9);
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
    expect(list.body).toHaveLength(7);
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

// ---------------------------------------------------------------- v4

const ROSA = '7-0111-0222';
const LUIS = '7-0100-0300';
const DIEGO = '1-1111-2222';
const ANA = '2-0987-0654';
const LUCAS = '1-9999-0001';
const year = Number(new Date().toISOString().slice(0, 4));

const death = { declarantId: ROSA, deceasedId: LUIS, date: '2026-09-01', hospital: 'Hospital Tony Facio, Limón' };
const marriage = { spouseAId: DIEGO, spouseBId: ANA, date: '2026-10-10', regime: 'gananciales', notary: 'Lic. Marta Solís, carné 12345' };

describe('registro-civil v4: seeds', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('serves Lucas as a minor with María\'s address and no contact data', async () => {
    const r = await request(app).get(`/registro/citizen/${LUCAS}`).set('x-api-key', KEY).expect(200);
    expect(r.body).toMatchObject({
      fullName: 'Lucas Fernández Gómez',
      dateOfBirth: '2020-03-10',
      canton: 'Montes de Oca',
      address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
      maritalStatus: 'single',
      email: '',
      phone: '',
    });
    expect(r.body.children).toBeUndefined();
  });

  it('serves Diego in Curridabat and the couple Rosa/Luis linked by spouseId', async () => {
    const diego = await request(app).get(`/registro/citizen/${DIEGO}`).set('x-api-key', KEY).expect(200);
    expect(diego.body).toMatchObject({ fullName: 'Diego Alonso Solano Vega', dateOfBirth: '1988-07-22', canton: 'Curridabat', district: 'Curridabat', maritalStatus: 'single' });
    const rosa = await request(app).get(`/registro/citizen/${ROSA}`).set('x-api-key', KEY).expect(200);
    expect(rosa.body).toMatchObject({ fullName: 'Rosa María Brenes Castro', dateOfBirth: '1963-02-14', maritalStatus: 'married', spouseId: LUIS, canton: 'Talamanca', district: 'Cahuita', phone: '+506 8555-1122' });
    const luis = await request(app).get(`/registro/citizen/${LUIS}`).set('x-api-key', KEY).expect(200);
    expect(luis.body).toMatchObject({ fullName: 'Luis Ángel Vargas Mora', dateOfBirth: '1958-09-30', maritalStatus: 'married', spouseId: ROSA, address: rosa.body.address });
    expect(luis.body.deceased).toBeUndefined();
  });
});

describe('registro-civil v4: dependants', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('returns María\'s children and no spouse', async () => {
    const r = await request(app).get('/registro/dependants/1-2345-6789').set('x-api-key', KEY).expect(200);
    expect(Object.keys(r.body).sort()).toEqual(['children']);
    expect(r.body.children).toHaveLength(1);
    expect(r.body.children[0]).toMatchObject({ id: LUCAS, fullName: 'Lucas Fernández Gómez' });
  });

  it('returns Rosa\'s spouse and an empty children list', async () => {
    const r = await request(app).get(`/registro/dependants/${ROSA}`).set('x-api-key', KEY).expect(200);
    expect(r.body.spouse).toMatchObject({ id: LUIS, fullName: 'Luis Ángel Vargas Mora' });
    expect(r.body.children).toEqual([]);
  });

  it('404 CITIZEN_NOT_FOUND and 400 on a malformed cédula', async () => {
    const nf = await request(app).get('/registro/dependants/9-9999-9999').set('x-api-key', KEY).expect(404);
    expect(nf.body.error.code).toBe('CITIZEN_NOT_FOUND');
    const v = await request(app).get('/registro/dependants/abc').set('x-api-key', KEY).expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('registro-civil v4: registerDeath', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('inscribes the death, issues DEF and SEDIMEC numbers and marks the citizen deceased', async () => {
    const r = await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send(death).expect(200);
    expect(r.body).toEqual({
      certificateNumber: `DEF-${year}-000001`,
      deceasedId: LUIS,
      deceasedName: 'Luis Ángel Vargas Mora',
      date: '2026-09-01',
      registeredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      medicalCertificate: 'SEDIMEC-DEF-000001',
    });
    const luis = await request(app).get(`/registro/citizen/${LUIS}`).set('x-api-key', KEY).expect(200);
    expect(luis.body.deceased).toEqual({ date: '2026-09-01', certificateNumber: `DEF-${year}-000001` });
    const list = await request(app).get('/registro/deaths').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ declarantId: ROSA, hospital: death.hospital });
  });

  it('is idempotent per deceasedId (same certificate, no 409)', async () => {
    const a = await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send(death).expect(200);
    const b = await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send({ ...death, hospital: 'Otro' }).expect(200);
    expect(b.body).toEqual(a.body);
    expect((await request(app).get('/registro/deaths').set('x-api-key', KEY)).body).toHaveLength(1);
  });

  it('404 CITIZEN_NOT_FOUND for an unknown deceased and 400 on a bad body', async () => {
    const nf = await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send({ ...death, deceasedId: '9-9999-9999' }).expect(404);
    expect(nf.body.error.code).toBe('CITIZEN_NOT_FOUND');
    const v = await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send({ ...death, date: '01/09/2026', hospital: '' }).expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('409 ALREADY_DECEASED when a different declaration targets someone already marked deceased', async () => {
    // The idempotency key is the deceasedId, so a repeat call never reaches the guard; mark the record directly.
    const { store } = await import('../src/store.js');
    const luis = store.get(LUIS)!;
    store.put({ ...luis, deceased: { date: '2026-08-01', certificateNumber: 'DEF-2026-999999' } });
    const r = await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send(death).expect(409);
    expect(r.body.error.code).toBe('ALREADY_DECEASED');
  });

  it('reset clears the death and the deceased mark', async () => {
    await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send(death).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const luis = await request(app).get(`/registro/citizen/${LUIS}`).set('x-api-key', KEY).expect(200);
    expect(luis.body.deceased).toBeUndefined();
    expect((await request(app).get('/registro/deaths').set('x-api-key', KEY)).body).toEqual([]);
  });
});

describe('registro-civil v4: registerMarriage', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('marries Diego and Ana: MAT number, both married with spouseId', async () => {
    const r = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send(marriage).expect(200);
    expect(r.body).toEqual({ certificateNumber: `MAT-${year}-000001`, spouseAId: DIEGO, spouseBId: ANA, date: '2026-10-10', regime: 'gananciales' });
    const diego = await request(app).get(`/registro/citizen/${DIEGO}`).set('x-api-key', KEY).expect(200);
    expect(diego.body).toMatchObject({ maritalStatus: 'married', spouseId: ANA });
    const ana = await request(app).get(`/registro/citizen/${ANA}`).set('x-api-key', KEY).expect(200);
    expect(ana.body).toMatchObject({ maritalStatus: 'married', spouseId: DIEGO });
    const dep = await request(app).get(`/registro/dependants/${ANA}`).set('x-api-key', KEY).expect(200);
    expect(dep.body.spouse.id).toBe(DIEGO);
  });

  it('is idempotent per sorted pair (either order) and listed', async () => {
    const a = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send(marriage).expect(200);
    const b = await request(app)
      .post('/registro/registerMarriage')
      .set('x-api-key', KEY)
      .send({ ...marriage, spouseAId: ANA, spouseBId: DIEGO, regime: 'separacion' })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/registro/marriages').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ notary: marriage.notary });
  });

  it('409 ALREADY_MARRIED when either party is already married', async () => {
    const r = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send({ ...marriage, spouseBId: ROSA }).expect(409);
    expect(r.body.error.code).toBe('ALREADY_MARRIED');
    const diego = await request(app).get(`/registro/citizen/${DIEGO}`).set('x-api-key', KEY).expect(200);
    expect(diego.body.maritalStatus).toBe('single');
  });

  it('409 ALREADY_DECEASED when a party has died, 404 for unknown, 400 for same person or bad body', async () => {
    await request(app).post('/registro/registerDeath').set('x-api-key', KEY).send(death).expect(200);
    const dead = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send({ ...marriage, spouseBId: LUIS }).expect(409);
    expect(dead.body.error.code).toBe('ALREADY_DECEASED');
    const nf = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send({ ...marriage, spouseBId: '9-9999-9999' }).expect(404);
    expect(nf.body.error.code).toBe('CITIZEN_NOT_FOUND');
    const same = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send({ ...marriage, spouseBId: DIEGO }).expect(400);
    expect(same.body.error.code).toBe('VALIDATION_ERROR');
    const v = await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send({ ...marriage, regime: 'mixto' }).expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset restores both to single', async () => {
    await request(app).post('/registro/registerMarriage').set('x-api-key', KEY).send(marriage).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const ana = await request(app).get(`/registro/citizen/${ANA}`).set('x-api-key', KEY).expect(200);
    expect(ana.body.maritalStatus).toBe('single');
    expect(ana.body.spouseId).toBeUndefined();
    expect((await request(app).get('/registro/marriages').set('x-api-key', KEY)).body).toEqual([]);
  });
});
