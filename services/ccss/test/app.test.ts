process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, monthlyContribution } from '../src/app.js';

const KEY = 'demo-ccss-key';
const app = createApp();
const body = {
  citizenId: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  nite: '3-002-123456',
  businessName: 'Café Dent',
  estimatedEmployees: 3,
};

describe('ccss', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'ccss', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/ccss/registerEmployer').send(body).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/ccss/employers').expect(401);
  });

  it('registers an employer', async () => {
    const r = await request(app).post('/ccss/registerEmployer').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body).toMatchObject({
      registrationType: 'employer',
      monthlyContributionRateCrc: monthlyContribution(3),
    });
    expect(r.body.employerNumber).toMatch(/^E-\d{5}$/);
    expect(r.body.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(r.body).sort()).toEqual(
      ['employerNumber', 'monthlyContributionRateCrc', 'registrationDate', 'registrationType'],
    );
  });

  it('registers as self-employed when there are no employees', async () => {
    const r = await request(app)
      .post('/ccss/registerEmployer')
      .set('x-api-key', KEY)
      .send({ ...body, estimatedEmployees: 0 })
      .expect(200);
    expect(r.body.registrationType).toBe('self-employed');
    expect(r.body.monthlyContributionRateCrc).toBeGreaterThan(0);
  });

  it('is idempotent per NITE', async () => {
    const a = await request(app).post('/ccss/registerEmployer').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app)
      .post('/ccss/registerEmployer')
      .set('x-api-key', KEY)
      .send({ ...body, estimatedEmployees: 10 })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const c = await request(app)
      .post('/ccss/registerEmployer')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-654321' })
      .expect(200);
    expect(c.body.employerNumber).not.toBe(a.body.employerNumber);
    const list = await request(app).get('/ccss/employers').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/ccss/registerEmployer')
      .set('x-api-key', KEY)
      .send({ ...body, estimatedEmployees: -1, nite: '' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/ccss/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears employers', async () => {
    await request(app).post('/ccss/registerEmployer').set('x-api-key', KEY).send(body).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/ccss/employers').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });
});

const dependent = {
  insuredId: '1-2345-6789',
  dependentId: '1-9876-5432',
  dependentName: 'Sofía Fernández Gómez',
  relationship: 'hija',
  birthDate: '2026-08-20',
};

const move = {
  citizenId: '1-2345-6789',
  address: 'Residencial Los Robles, San Rafael, Escazú, San José',
  province: 'San José',
  canton: 'Escazú',
  district: 'San Rafael',
  effectiveDate: '2026-09-01',
};

describe('ccss v2: insureDependent', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('401 without key', async () => {
    await request(app).post('/ccss/insureDependent').send(dependent).expect(401);
  });

  it('insures a dependent with beneficiary number, EDUS id and coverage from birth', async () => {
    const r = await request(app).post('/ccss/insureDependent').set('x-api-key', KEY).send(dependent).expect(200);
    expect(r.body.beneficiaryNumber).toMatch(/^B-\d{7}$/);
    expect(r.body.edusId).toMatch(/^EDUS-\d{7}$/);
    expect(r.body.coveredFrom).toBe('2026-08-20');
    expect(Object.keys(r.body).sort()).toEqual(['beneficiaryNumber', 'coveredFrom', 'edusId']);
  });

  it('is idempotent per dependentId', async () => {
    const a = await request(app).post('/ccss/insureDependent').set('x-api-key', KEY).send(dependent).expect(200);
    const b = await request(app).post('/ccss/insureDependent').set('x-api-key', KEY).send(dependent).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/ccss/insureDependent')
      .set('x-api-key', KEY)
      .send({ ...dependent, dependentId: '1-1111-2222', dependentName: 'Mateo Fernández Gómez', relationship: 'hijo' })
      .expect(200);
    expect(other.body.beneficiaryNumber).not.toBe(a.body.beneficiaryNumber);
    const list = await request(app).get('/ccss/dependents').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ insuredId: dependent.insuredId, dependentId: dependent.dependentId });
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/ccss/insureDependent')
      .set('x-api-key', KEY)
      .send({ ...dependent, relationship: 'primo', birthDate: 'ayer' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears dependents', async () => {
    await request(app).post('/ccss/insureDependent').set('x-api-key', KEY).send(dependent).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/ccss/dependents').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });
});

describe('ccss v2: updateAddress', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('updates the SICERE address', async () => {
    const r = await request(app).post('/ccss/updateAddress').set('x-api-key', KEY).send(move).expect(200);
    expect(r.body).toEqual({ updated: true, registry: 'CCSS (SICERE)', effectiveDate: '2026-09-01' });
    const list = await request(app).get('/ccss/addresses').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ citizenId: move.citizenId, canton: 'Escazú' });
  });

  it('400 VALIDATION_ERROR on a bad body and reset clears it', async () => {
    const r = await request(app)
      .post('/ccss/updateAddress')
      .set('x-api-key', KEY)
      .send({ ...move, address: 'x' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).post('/ccss/updateAddress').set('x-api-key', KEY).send(move).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/ccss/addresses').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });
});
