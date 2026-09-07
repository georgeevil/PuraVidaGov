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
