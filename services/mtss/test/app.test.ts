process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { addDaysIso, createApp, DEFAULT_TRAINING_OFFER, PLATFORM, trainingOfferFor } from '../src/app.js';

const KEY = 'demo-mtss-key';
const app = createApp();
const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);

const body = {
  citizenId: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  canton: 'Montes de Oca',
  lastOccupation: 'Analista de sistemas',
  desiredArea: 'Desarrollo de software',
  terminationDate: '2026-08-31',
};

describe('mtss', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'mtss', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/mtss/registerJobSeeker').send(body).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/mtss/jobSeekers').expect(401);
  });

  it('registers a job seeker on the ANE with an INA offer and an appointment in 7 days', async () => {
    const r = await request(app).post('/mtss/registerJobSeeker').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body).toEqual({
      registrationNumber: `ANE-${year}-000001`,
      platform: PLATFORM,
      trainingOffer: 'INA: Desarrollo web full stack',
      firstAppointment: addDaysIso(today, 7),
    });
  });

  it('chooses the training offer by desiredArea keyword', async () => {
    expect(trainingOfferFor('Turismo rural')).toBe('INA: Guía de turismo local');
    expect(trainingOfferFor('SOFTWARE')).toBe('INA: Desarrollo web full stack');
    expect(trainingOfferFor('Contabilidad')).toBe(DEFAULT_TRAINING_OFFER);
    const r = await request(app)
      .post('/mtss/registerJobSeeker')
      .set('x-api-key', KEY)
      .send({ ...body, citizenId: '7-0123-0456', desiredArea: 'Guía de turismo' })
      .expect(200);
    expect(r.body.trainingOffer).toBe('INA: Guía de turismo local');
    const d = await request(app)
      .post('/mtss/registerJobSeeker')
      .set('x-api-key', KEY)
      .send({ ...body, citizenId: '2-0987-0654', desiredArea: 'Administración' })
      .expect(200);
    expect(d.body.trainingOffer).toBe(DEFAULT_TRAINING_OFFER);
  });

  it('is idempotent per citizenId, numbers sequentially and lists', async () => {
    const a = await request(app).post('/mtss/registerJobSeeker').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app)
      .post('/mtss/registerJobSeeker')
      .set('x-api-key', KEY)
      .send({ ...body, desiredArea: 'Turismo' })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/mtss/registerJobSeeker')
      .set('x-api-key', KEY)
      .send({ ...body, citizenId: '7-0123-0456' })
      .expect(200);
    expect(other.body.registrationNumber).toBe(`ANE-${year}-000002`);
    const list = await request(app).get('/mtss/jobSeekers').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ citizenId: body.citizenId, lastOccupation: body.lastOccupation });
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/mtss/registerJobSeeker')
      .set('x-api-key', KEY)
      .send({ ...body, desiredArea: 'x', terminationDate: '31/08/2026' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/mtss/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears registrations and restarts the counter', async () => {
    await request(app).post('/mtss/registerJobSeeker').set('x-api-key', KEY).send(body).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'mtss' });
    expect((await request(app).get('/mtss/jobSeekers').set('x-api-key', KEY)).body).toEqual([]);
    const again = await request(app).post('/mtss/registerJobSeeker').set('x-api-key', KEY).send(body).expect(200);
    expect(again.body.registrationNumber).toBe(`ANE-${year}-000001`);
  });
});
