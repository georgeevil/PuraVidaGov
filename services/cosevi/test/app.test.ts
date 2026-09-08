process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, renewalFee } from '../src/app.js';

const KEY = 'demo-cosevi-key';
const app = createApp();
const today = new Date().toISOString().slice(0, 10);

const MARIA = '1-2345-6789';
const JOSE = '7-0123-0456';
const ANA = '2-0987-0654';

const renewBody = {
  citizenId: MARIA,
  fullName: 'María Fernández Gómez',
  categories: ['B1'],
  medicalCertificate: 'SEDIMEC-2026-000001',
  validityYears: 4,
};

describe('cosevi', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'cosevi', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/cosevi/checkFines').send({ citizenId: MARIA }).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/cosevi/licences').expect(401);
  });

  it('checkFines returns the seeded table: María clean, José one fine, Ana marchamo unpaid', async () => {
    const maria = await request(app).post('/cosevi/checkFines').set('x-api-key', KEY).send({ citizenId: MARIA }).expect(200);
    expect(maria.body).toEqual({ pendingFines: 0, pendingAmountCrc: 0, marchamoPaid: true });
    const jose = await request(app).post('/cosevi/checkFines').set('x-api-key', KEY).send({ citizenId: JOSE }).expect(200);
    expect(jose.body).toEqual({ pendingFines: 1, pendingAmountCrc: 55000, marchamoPaid: true });
    const ana = await request(app).post('/cosevi/checkFines').set('x-api-key', KEY).send({ citizenId: ANA }).expect(200);
    expect(ana.body).toEqual({ pendingFines: 0, pendingAmountCrc: 0, marchamoPaid: false });
    const unknown = await request(app).post('/cosevi/checkFines').set('x-api-key', KEY).send({ citizenId: '9-9999-9999' }).expect(200);
    expect(unknown.body).toEqual({ pendingFines: 0, pendingAmountCrc: 0, marchamoPaid: true });
  });

  it('400 VALIDATION_ERROR on checkFines with a bad cédula', async () => {
    const r = await request(app).post('/cosevi/checkFines').set('x-api-key', KEY).send({ citizenId: 'x' }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('renews the licence: number = cédula, 12 points, fee 5 000 × years + 5 000, expiry today + years', async () => {
    const r = await request(app).post('/cosevi/renewLicence').set('x-api-key', KEY).send(renewBody).expect(200);
    expect(r.body).toEqual({
      licenceNumber: MARIA,
      categories: ['B1'],
      issueDate: today,
      expiryDate: `${Number(today.slice(0, 4)) + 4}${today.slice(4)}`,
      points: 12,
      feeCrc: 25000,
    });
    expect(renewalFee(2)).toBe(15000);
    expect(renewalFee(6)).toBe(35000);
  });

  it('422 PENDING_FINES for José and 422 MARCHAMO_UNPAID for Ana', async () => {
    const jose = await request(app)
      .post('/cosevi/renewLicence')
      .set('x-api-key', KEY)
      .send({ ...renewBody, citizenId: JOSE, fullName: 'José Alberto Mora Salazar' })
      .expect(422);
    expect(jose.body.error.code).toBe('PENDING_FINES');
    const ana = await request(app)
      .post('/cosevi/renewLicence')
      .set('x-api-key', KEY)
      .send({ ...renewBody, citizenId: ANA, fullName: 'Ana Lucía Chaves Rojas' })
      .expect(422);
    expect(ana.body.error.code).toBe('MARCHAMO_UNPAID');
    const list = await request(app).get('/cosevi/licences').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });

  it('is idempotent per citizenId and listed', async () => {
    const a = await request(app).post('/cosevi/renewLicence').set('x-api-key', KEY).send(renewBody).expect(200);
    const b = await request(app)
      .post('/cosevi/renewLicence')
      .set('x-api-key', KEY)
      .send({ ...renewBody, validityYears: 6, categories: ['A1', 'B1'] })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/cosevi/licences').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ citizenId: MARIA, medicalCertificate: renewBody.medicalCertificate, validityYears: 4 });
  });

  it('400 VALIDATION_ERROR on a bad renewal body', async () => {
    const r = await request(app)
      .post('/cosevi/renewLicence')
      .set('x-api-key', KEY)
      .send({ ...renewBody, validityYears: 3, categories: [] })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    const cat = await request(app)
      .post('/cosevi/renewLicence')
      .set('x-api-key', KEY)
      .send({ ...renewBody, categories: ['Z9'] })
      .expect(400);
    expect(cat.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/cosevi/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears licences and keeps the seeded fines table', async () => {
    await request(app).post('/cosevi/renewLicence').set('x-api-key', KEY).send(renewBody).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'cosevi' });
    expect((await request(app).get('/cosevi/licences').set('x-api-key', KEY)).body).toEqual([]);
    const drivers = await request(app).get('/cosevi/drivers').set('x-api-key', KEY).expect(200);
    expect(drivers.body).toHaveLength(3);
    const jose = await request(app).post('/cosevi/checkFines').set('x-api-key', KEY).send({ citizenId: JOSE }).expect(200);
    expect(jose.body.pendingFines).toBe(1);
  });
});

// ---------------------------------------------------------------- v4

describe('cosevi v4: checkVehicleFines', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('SJB-456 carries one fine of ₡55 000; other plates are clean', async () => {
    const jose = await request(app).post('/cosevi/checkVehicleFines').set('x-api-key', KEY).send({ plate: 'SJB-456' }).expect(200);
    expect(jose.body).toEqual({ plate: 'SJB-456', pendingFines: 1, pendingAmountCrc: 55000 });
    const ana = await request(app).post('/cosevi/checkVehicleFines').set('x-api-key', KEY).send({ plate: 'bcr-123' }).expect(200);
    expect(ana.body).toEqual({ plate: 'BCR-123', pendingFines: 0, pendingAmountCrc: 0 });
    const unknown = await request(app).post('/cosevi/checkVehicleFines').set('x-api-key', KEY).send({ plate: 'ZZZ-999' }).expect(200);
    expect(unknown.body).toEqual({ plate: 'ZZZ-999', pendingFines: 0, pendingAmountCrc: 0 });
    const list = await request(app).get('/cosevi/vehicleFines').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('401 without key and 400 VALIDATION_ERROR on a short plate', async () => {
    await request(app).post('/cosevi/checkVehicleFines').send({ plate: 'SJB-456' }).expect(401);
    const r = await request(app).post('/cosevi/checkVehicleFines').set('x-api-key', KEY).send({ plate: 'AB' }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });
});
