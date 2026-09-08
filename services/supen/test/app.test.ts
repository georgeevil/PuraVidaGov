process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { addDaysIso, createApp, firstDayOfNextMonthIso, OPERATOR } from '../src/app.js';

const KEY = 'demo-supen-key';
const app = createApp();
const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);

const fclBody = {
  citizenId: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  employerNumber: 'E-30001',
  terminationDate: '2026-08-31',
  iban: 'CR05015202001026284066',
};
const ropBody = {
  citizenId: '7-0123-0456',
  fullName: 'José Alberto Mora Salazar',
  modality: 'retiro-programado',
  pensionApplication: 'IVM-2026-000001',
};

describe('supen', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'supen', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/supen/withdrawFcl').send(fclBody).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/supen/withdrawals').expect(401);
  });

  it('date helpers', () => {
    expect(addDaysIso('2026-12-20', 15)).toBe('2027-01-04');
    expect(firstDayOfNextMonthIso('2026-12-31')).toBe('2027-01-01');
    expect(firstDayOfNextMonthIso('2026-09-07')).toBe('2026-10-01');
  });

  it('withdraws the FCL with the seeded balance and payment in 15 days', async () => {
    const r = await request(app).post('/supen/withdrawFcl').set('x-api-key', KEY).send(fclBody).expect(200);
    expect(r.body).toEqual({
      requestNumber: `FCL-${year}-000001`,
      balanceCrc: 1250000,
      paymentDate: addDaysIso(today, 15),
      operator: OPERATOR,
    });
  });

  it('seeds José and Ana with their own FCL balances', async () => {
    const jose = await request(app)
      .post('/supen/withdrawFcl')
      .set('x-api-key', KEY)
      .send({ ...fclBody, citizenId: '7-0123-0456', fullName: 'José Alberto Mora Salazar', employerNumber: 'E-30002' })
      .expect(200);
    expect(jose.body.balanceCrc).toBe(3900000);
    const ana = await request(app)
      .post('/supen/withdrawFcl')
      .set('x-api-key', KEY)
      .send({ ...fclBody, citizenId: '2-0987-0654', fullName: 'Ana Lucía Chaves Rojas', employerNumber: 'E-30003' })
      .expect(200);
    expect(ana.body.balanceCrc).toBe(480000);
  });

  it('FCL withdrawal is idempotent per (citizenId, terminationDate)', async () => {
    const a = await request(app).post('/supen/withdrawFcl').set('x-api-key', KEY).send(fclBody).expect(200);
    const b = await request(app)
      .post('/supen/withdrawFcl')
      .set('x-api-key', KEY)
      .send({ ...fclBody, iban: 'CR05015202001026284099' })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/supen/withdrawFcl')
      .set('x-api-key', KEY)
      .send({ ...fclBody, terminationDate: '2026-09-30' })
      .expect(200);
    expect(other.body.requestNumber).toBe(`FCL-${year}-000002`);
    const list = await request(app).get('/supen/withdrawals').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ citizenId: fclBody.citizenId, employerNumber: 'E-30001' });
  });

  it('404 AFFILIATE_NOT_FOUND and 400 VALIDATION_ERROR on withdrawFcl', async () => {
    const nf = await request(app)
      .post('/supen/withdrawFcl')
      .set('x-api-key', KEY)
      .send({ ...fclBody, citizenId: '9-9999-9999' })
      .expect(404);
    expect(nf.body.error.code).toBe('AFFILIATE_NOT_FOUND');
    const v = await request(app)
      .post('/supen/withdrawFcl')
      .set('x-api-key', KEY)
      .send({ ...fclBody, iban: 'CR123' })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('issues a ROP statement: retiro programado spreads the balance over 240 months', async () => {
    const r = await request(app).post('/supen/ropStatement').set('x-api-key', KEY).send(ropBody).expect(200);
    expect(r.body).toEqual({
      operator: OPERATOR,
      balanceCrc: 31200000,
      modality: 'retiro-programado',
      monthlyPaymentCrc: 130000,
      firstPaymentDate: firstDayOfNextMonthIso(today),
    });
  });

  it('renta permanente spreads over 300 months; seeds for María and Ana', async () => {
    const maria = await request(app)
      .post('/supen/ropStatement')
      .set('x-api-key', KEY)
      .send({ ...ropBody, citizenId: '1-2345-6789', fullName: 'María Fernández Gómez', modality: 'renta-permanente' })
      .expect(200);
    expect(maria.body.balanceCrc).toBe(8400000);
    expect(maria.body.monthlyPaymentCrc).toBe(28000);
    const ana = await request(app)
      .post('/supen/ropStatement')
      .set('x-api-key', KEY)
      .send({ ...ropBody, citizenId: '2-0987-0654', fullName: 'Ana Lucía Chaves Rojas' })
      .expect(200);
    expect(ana.body.balanceCrc).toBe(2100000);
    expect(ana.body.monthlyPaymentCrc).toBe(8750);
  });

  it('ROP statement is idempotent per citizenId and listed', async () => {
    const a = await request(app).post('/supen/ropStatement').set('x-api-key', KEY).send(ropBody).expect(200);
    const b = await request(app)
      .post('/supen/ropStatement')
      .set('x-api-key', KEY)
      .send({ ...ropBody, modality: 'renta-permanente' })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/supen/statements').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ citizenId: ropBody.citizenId, pensionApplication: 'IVM-2026-000001' });
  });

  it('404 AFFILIATE_NOT_FOUND and 400 VALIDATION_ERROR on ropStatement', async () => {
    const nf = await request(app)
      .post('/supen/ropStatement')
      .set('x-api-key', KEY)
      .send({ ...ropBody, citizenId: '9-9999-9999' })
      .expect(404);
    expect(nf.body.error.code).toBe('AFFILIATE_NOT_FOUND');
    const v = await request(app)
      .post('/supen/ropStatement')
      .set('x-api-key', KEY)
      .send({ ...ropBody, modality: 'lump-sum' })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/supen/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears withdrawals and statements, keeps the seed and restarts the counter', async () => {
    await request(app).post('/supen/withdrawFcl').set('x-api-key', KEY).send(fclBody).expect(200);
    await request(app).post('/supen/ropStatement').set('x-api-key', KEY).send(ropBody).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'supen' });
    expect((await request(app).get('/supen/withdrawals').set('x-api-key', KEY)).body).toEqual([]);
    expect((await request(app).get('/supen/statements').set('x-api-key', KEY)).body).toEqual([]);
    const affiliates = await request(app).get('/supen/affiliates').set('x-api-key', KEY).expect(200);
    expect(affiliates.body).toHaveLength(4); // v4: Luis
    const again = await request(app).post('/supen/withdrawFcl').set('x-api-key', KEY).send(fclBody).expect(200);
    expect(again.body.requestNumber).toBe(`FCL-${year}-000001`);
  });
});

// ---------------------------------------------------------------- v4

describe('supen v4: beneficiaryPayout', () => {
  const ROSA = '7-0111-0222';
  const LUIS = '7-0100-0300';
  const year = Number(new Date().toISOString().slice(0, 4));
  const today = new Date().toISOString().slice(0, 10);
  const payout = { beneficiaryId: ROSA, deceasedId: LUIS, deathCertificate: `DEF-${year}-000001`, iban: 'CR05015202001026284066' };

  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('pays Luis\'s ROP ₡28 000 000 and FCL ₡2 600 000 to Rosa in 15 days', async () => {
    const r = await request(app).post('/supen/beneficiaryPayout').set('x-api-key', KEY).send(payout).expect(200);
    expect(r.body).toEqual({
      requestNumber: `ROP-BEN-${year}-000001`,
      operator: 'Operadora Demo de Pensiones',
      ropBalanceCrc: 28000000,
      fclBalanceCrc: 2600000,
      paymentDate: addDaysIso(today, 15),
    });
  });

  it('is idempotent per deceasedId and listed', async () => {
    const a = await request(app).post('/supen/beneficiaryPayout').set('x-api-key', KEY).send(payout).expect(200);
    const b = await request(app).post('/supen/beneficiaryPayout').set('x-api-key', KEY).send({ ...payout, beneficiaryId: '1-2345-6789' }).expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/supen/payouts').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ beneficiaryId: ROSA, deceasedId: LUIS, deathCertificate: payout.deathCertificate });
  });

  it('404 AFFILIATE_NOT_FOUND for an unknown deceased, 400 on a bad body, reset clears payouts', async () => {
    const nf = await request(app).post('/supen/beneficiaryPayout').set('x-api-key', KEY).send({ ...payout, deceasedId: '9-9999-9999' }).expect(404);
    expect(nf.body.error.code).toBe('AFFILIATE_NOT_FOUND');
    const bad = await request(app).post('/supen/beneficiaryPayout').set('x-api-key', KEY).send({ ...payout, iban: 'CR1', deathCertificate: '' }).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).post('/supen/beneficiaryPayout').set('x-api-key', KEY).send(payout).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    expect((await request(app).get('/supen/payouts').set('x-api-key', KEY)).body).toEqual([]);
  });
});
