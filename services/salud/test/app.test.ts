process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { addMonthsIso, createApp, VACCINATION_SCHEME } from '../src/app.js';

const KEY = 'demo-salud-key';
const app = createApp();
const permitBody = {
  citizenId: '1-2345-6789',
  taxId: '3-002-123456',
  businessName: 'Café Dent',
  activityCode: '5610',
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
  municipality: 'Montes de Oca',
};
const vaccBody = {
  childId: '1-9876-5432',
  childName: 'Sofía Fernández Gómez',
  birthDate: '2026-08-20',
  edusId: 'EDUS-1234567',
};

const year = new Date().toISOString().slice(0, 4);

describe('salud', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'salud', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/salud/issueSanitaryPermit').send(permitBody).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/salud/permits').expect(401);
  });

  it('issues a group-B permit valid 3 years for a restaurant', async () => {
    const r = await request(app).post('/salud/issueSanitaryPermit').set('x-api-key', KEY).send(permitBody).expect(200);
    expect(r.body.permitNumber).toBe(`PSF-${year}-000001`);
    expect(r.body.riskGroup).toBe('B');
    expect(r.body.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number(r.body.expiryDate.slice(0, 4)) - Number(r.body.issueDate.slice(0, 4))).toBe(3);
    expect(Object.keys(r.body).sort()).toEqual(['expiryDate', 'issueDate', 'permitNumber', 'riskGroup']);
  });

  it('classifies risk groups by activity: C 5 years, A 1 year', async () => {
    const c = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, taxId: 'c', activityCode: '6201' })
      .expect(200);
    expect(c.body.riskGroup).toBe('C');
    expect(Number(c.body.expiryDate.slice(0, 4)) - Number(c.body.issueDate.slice(0, 4))).toBe(5);
    const a = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, taxId: 'a', activityCode: '4923' })
      .expect(200);
    expect(a.body.riskGroup).toBe('A');
    expect(Number(a.body.expiryDate.slice(0, 4)) - Number(a.body.issueDate.slice(0, 4))).toBe(1);
    for (const code of ['4711', '9602', '7911']) {
      const r = await request(app)
        .post('/salud/issueSanitaryPermit')
        .set('x-api-key', KEY)
        .send({ ...permitBody, taxId: code, activityCode: code })
        .expect(200);
      expect(r.body.riskGroup).toBe('C');
    }
    const b = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, taxId: 'b', activityCode: '5510' })
      .expect(200);
    expect(b.body.riskGroup).toBe('B');
    const farm = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, taxId: 'farm', activityCode: '0111' })
      .expect(200);
    expect(farm.body.riskGroup).toBe('A');
  });

  it('is idempotent per taxId and numbers permits sequentially', async () => {
    const a = await request(app).post('/salud/issueSanitaryPermit').set('x-api-key', KEY).send(permitBody).expect(200);
    const b = await request(app).post('/salud/issueSanitaryPermit').set('x-api-key', KEY).send(permitBody).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, taxId: '3-101-654321' })
      .expect(200);
    expect(other.body.permitNumber).toBe(`PSF-${year}-000002`);
    const list = await request(app).get('/salud/permits').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('422 ACTIVITY_UNKNOWN and 400 VALIDATION_ERROR', async () => {
    const r = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, activityCode: '9999' })
      .expect(422);
    expect(r.body.error.code).toBe('ACTIVITY_UNKNOWN');
    const v = await request(app)
      .post('/salud/issueSanitaryPermit')
      .set('x-api-key', KEY)
      .send({ ...permitBody, citizenId: 'x' })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('opens a vaccination record with the first appointment 2 months after birth', async () => {
    const r = await request(app).post('/salud/openVaccinationRecord').set('x-api-key', KEY).send(vaccBody).expect(200);
    expect(r.body).toEqual({
      recordNumber: `CNV-${year}-000001`,
      scheme: VACCINATION_SCHEME,
      firstAppointment: '2026-10-20',
    });
    expect(addMonthsIso('2026-12-31', 2)).toBe('2027-03-03');
  });

  it('vaccination record is idempotent per childId and listed', async () => {
    const a = await request(app).post('/salud/openVaccinationRecord').set('x-api-key', KEY).send(vaccBody).expect(200);
    const b = await request(app)
      .post('/salud/openVaccinationRecord')
      .set('x-api-key', KEY)
      .send({ ...vaccBody, childName: 'Otro nombre' })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/salud/openVaccinationRecord')
      .set('x-api-key', KEY)
      .send({ ...vaccBody, childId: '1-1111-2222' })
      .expect(200);
    expect(other.body.recordNumber).toBe(`CNV-${year}-000002`);
    const list = await request(app).get('/salud/vaccination').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ childId: vaccBody.childId, edusId: vaccBody.edusId });
  });

  it('400 VALIDATION_ERROR on a bad vaccination body', async () => {
    const r = await request(app)
      .post('/salud/openVaccinationRecord')
      .set('x-api-key', KEY)
      .send({ ...vaccBody, birthDate: '20/08/2026' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears permits and records and restarts the counters', async () => {
    await request(app).post('/salud/issueSanitaryPermit').set('x-api-key', KEY).send(permitBody).expect(200);
    await request(app).post('/salud/openVaccinationRecord').set('x-api-key', KEY).send(vaccBody).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'salud' });
    expect((await request(app).get('/salud/permits').set('x-api-key', KEY)).body).toEqual([]);
    expect((await request(app).get('/salud/vaccination').set('x-api-key', KEY)).body).toEqual([]);
    const again = await request(app).post('/salud/issueSanitaryPermit').set('x-api-key', KEY).send(permitBody).expect(200);
    expect(again.body.permitNumber).toBe(`PSF-${year}-000001`);
  });
});
