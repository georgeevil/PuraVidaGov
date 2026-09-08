process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, isEligible, perCapitaIncome, programmeFor } from '../src/app.js';

const KEY = 'demo-imas-key';
const app = createApp();
const year = Number(new Date().toISOString().slice(0, 4));

const MARIA = '1-2345-6789';
const LUCAS = '1-9999-0001';

const apply = {
  guardianId: MARIA,
  studentId: LUCAS,
  enrolmentNumber: `MEP-${year}-000001`,
  grade: 'primero',
  householdMonthlyIncomeCrc: 240000,
  householdSize: 2,
};

describe('imas', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'imas', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/imas/applyScholarship').send(apply).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/imas/applications').expect(401);
  });

  it('eligible: per-capita ₡120 000 < ₡130 000 → Crecemos ₡25 000 with a SINIRUBE basis', async () => {
    const r = await request(app).post('/imas/applyScholarship').set('x-api-key', KEY).send(apply).expect(200);
    expect(r.body).toEqual({
      applicationNumber: `IMAS-${year}-000001`,
      programme: 'Crecemos',
      eligible: true,
      monthlyAmountCrc: 25000,
      basis: expect.stringContaining('SINIRUBE'),
    });
    expect(r.body.basis).toContain('bajo la línea de pobreza');
  });

  it('not eligible: per-capita ₡400 000 → Crecemos, amount 0', async () => {
    const r = await request(app)
      .post('/imas/applyScholarship')
      .set('x-api-key', KEY)
      .send({ ...apply, householdMonthlyIncomeCrc: 1200000, householdSize: 3 })
      .expect(200);
    expect(r.body).toMatchObject({ programme: 'Crecemos', eligible: false, monthlyAmountCrc: 0 });
    expect(r.body.basis).toContain('SINIRUBE');
    expect(r.body.basis).toContain('sobre la línea de pobreza');
  });

  it('séptimo maps to Avancemos ₡40 000 when eligible', async () => {
    const r = await request(app)
      .post('/imas/applyScholarship')
      .set('x-api-key', KEY)
      .send({ ...apply, studentId: '7-9999-0002', grade: 'septimo', householdMonthlyIncomeCrc: 500000, householdSize: 4 })
      .expect(200);
    expect(r.body).toMatchObject({ programme: 'Avancemos', eligible: true, monthlyAmountCrc: 40000 });
  });

  it('eligibility helpers: strict threshold at the poverty line', () => {
    expect(perCapitaIncome(260000, 2)).toBe(130000);
    expect(isEligible(130000)).toBe(false);
    expect(isEligible(129999)).toBe(true);
    expect(programmeFor('materno')).toBe('Crecemos');
    expect(programmeFor('transicion')).toBe('Crecemos');
    expect(programmeFor('primero')).toBe('Crecemos');
    expect(programmeFor('septimo')).toBe('Avancemos');
  });

  it('is idempotent per studentId and listed with the per-capita figure', async () => {
    const a = await request(app).post('/imas/applyScholarship').set('x-api-key', KEY).send(apply).expect(200);
    const b = await request(app)
      .post('/imas/applyScholarship')
      .set('x-api-key', KEY)
      .send({ ...apply, householdMonthlyIncomeCrc: 5000000 })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/imas/applications').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ studentId: LUCAS, guardianId: MARIA, perCapitaIncomeCrc: 120000, householdSize: 2 });
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/imas/applyScholarship')
      .set('x-api-key', KEY)
      .send({ ...apply, householdSize: 0, householdMonthlyIncomeCrc: -1 })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).post('/imas/applyScholarship').set('x-api-key', KEY).send({ ...apply, grade: 'octavo' }).expect(400);
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/imas/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears applications and restarts the sequence', async () => {
    await request(app).post('/imas/applyScholarship').set('x-api-key', KEY).send(apply).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'imas' });
    expect((await request(app).get('/imas/applications').set('x-api-key', KEY)).body).toEqual([]);
    const again = await request(app).post('/imas/applyScholarship').set('x-api-key', KEY).send(apply).expect(200);
    expect(again.body.applicationNumber).toBe(`IMAS-${year}-000001`);
  });
});
