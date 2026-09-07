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
