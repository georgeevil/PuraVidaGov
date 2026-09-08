process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, marchamoAmount } from '../src/app.js';

const KEY = 'demo-ins-key';
const app = createApp();
const year = Number(new Date().toISOString().slice(0, 4));

describe('ins', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'ins', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/ins/marchamoStatus').send({ plate: 'BCR-123' }).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/ins/policies').expect(401);
  });

  it('marchamoStatus: paid for the current year, 3 % of the fiscal value, SOA policy number', async () => {
    const r = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'BCR-123' }).expect(200);
    expect(r.body).toEqual({ plate: 'BCR-123', year, paid: true, amountCrc: 225000, soaPolicy: `SOA-${year}-000001` });
    const jose = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'SJB-456' }).expect(200);
    expect(jose.body).toMatchObject({ amountCrc: 420000, soaPolicy: `SOA-${year}-000002` });
    const luis = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'LAV-777' }).expect(200);
    expect(luis.body).toMatchObject({ amountCrc: 186000 });
    expect(marchamoAmount(7500000)).toBe(225000);
  });

  it('is idempotent per plate (same SOA policy) and case-insensitive on the plate', async () => {
    const a = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'BCR-123' }).expect(200);
    const b = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'bcr-123' }).expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/ins/policies').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ plate: 'BCR-123', fiscalValueCrc: 7500000 });
  });

  it('404 VEHICLE_NOT_FOUND for an unknown plate', async () => {
    const r = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'ZZZ-999' }).expect(404);
    expect(r.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'AB' }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({}).expect(400);
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/ins/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears policies and keeps the seeded vehicle table', async () => {
    await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'BCR-123' }).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'ins' });
    expect((await request(app).get('/ins/policies').set('x-api-key', KEY)).body).toEqual([]);
    const vehicles = await request(app).get('/ins/vehicles').set('x-api-key', KEY).expect(200);
    expect(vehicles.body).toHaveLength(3);
    const again = await request(app).post('/ins/marchamoStatus').set('x-api-key', KEY).send({ plate: 'BCR-123' }).expect(200);
    expect(again.body.soaPolicy).toBe(`SOA-${year}-000001`);
  });
});
