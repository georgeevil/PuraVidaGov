process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { ageAt, ageCutoffFor, createApp, meetsAgeRule, nextSchoolYearStart } from '../src/app.js';

const KEY = 'demo-mep-key';
const app = createApp();
const today = new Date().toISOString().slice(0, 10);
const year = Number(today.slice(0, 4));
const startDate = nextSchoolYearStart(today);

const MARIA = '1-2345-6789';
const LUCAS = '1-9999-0001';

const enrol = {
  guardianId: MARIA,
  studentId: LUCAS,
  studentName: 'Lucas Fernández Gómez',
  birthDate: '2020-03-10',
  vaccinationRecord: 'VAC-2020-000123',
  school: 'Escuela Roosevelt',
  grade: 'primero',
  canton: 'Montes de Oca',
  needsTransport: false,
};

describe('mep', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'mep', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/mep/enrolStudent').send(enrol).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/mep/schools').expect(401);
  });

  it('lists the five seeded schools with canton and circuit', async () => {
    const r = await request(app).get('/mep/schools').set('x-api-key', KEY).expect(200);
    expect(r.body).toHaveLength(5);
    expect(r.body).toContainEqual({ name: 'Escuela Líder de Cahuita', canton: 'Talamanca', circuit: '07' });
    expect(r.body).toContainEqual({ name: 'Escuela José Figueres Ferrer', canton: 'Curridabat', circuit: '02' });
  });

  it('enrols Lucas in primero: MEP number, circuit 01, start next 1 Feb, canteen only', async () => {
    const r = await request(app).post('/mep/enrolStudent').set('x-api-key', KEY).send(enrol).expect(200);
    expect(r.body).toEqual({
      enrolmentNumber: `MEP-${year}-000001`,
      school: 'Escuela Roosevelt',
      grade: 'primero',
      circuit: '01',
      startDate,
      services: ['Comedor (PANEA)'],
    });
    expect(startDate).toMatch(/^\d{4}-02-01$/);
    expect(startDate >= today).toBe(true);
  });

  it('adds Transporte estudiantil when needsTransport', async () => {
    const r = await request(app)
      .post('/mep/enrolStudent')
      .set('x-api-key', KEY)
      .send({ ...enrol, school: 'Escuela Central de Grecia', canton: 'Grecia', needsTransport: true })
      .expect(200);
    expect(r.body.services).toEqual(['Comedor (PANEA)', 'Transporte estudiantil']);
    expect(r.body.circuit).toBe('03');
  });

  it('is idempotent per studentId and listed', async () => {
    const a = await request(app).post('/mep/enrolStudent').set('x-api-key', KEY).send(enrol).expect(200);
    const b = await request(app)
      .post('/mep/enrolStudent')
      .set('x-api-key', KEY)
      .send({ ...enrol, school: 'Escuela Dante Alighieri', needsTransport: true })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/mep/enrolments').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ studentId: LUCAS, guardianId: MARIA, vaccinationRecord: enrol.vaccinationRecord });
  });

  it('422 SCHOOL_UNKNOWN for a school outside the table', async () => {
    const r = await request(app)
      .post('/mep/enrolStudent')
      .set('x-api-key', KEY)
      .send({ ...enrol, school: 'Escuela Inexistente' })
      .expect(422);
    expect(r.body.error.code).toBe('SCHOOL_UNKNOWN');
  });

  it('422 AGE_RULE when the child is too young for the grade (Lucas, born 2020, into séptimo)', async () => {
    const r = await request(app).post('/mep/enrolStudent').set('x-api-key', KEY).send({ ...enrol, grade: 'septimo' }).expect(422);
    expect(r.body.error.code).toBe('AGE_RULE');
    expect(r.body.error.message).toContain('12');
    const list = await request(app).get('/mep/enrolments').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });

  it('age rule helpers: 15 Feb cut-off of the school year', () => {
    expect(nextSchoolYearStart('2026-09-07')).toBe('2027-02-01');
    expect(nextSchoolYearStart('2027-01-15')).toBe('2027-02-01');
    expect(nextSchoolYearStart('2027-02-01')).toBe('2027-02-01');
    expect(nextSchoolYearStart('2027-02-02')).toBe('2028-02-01');
    expect(ageCutoffFor('2027-02-01')).toBe('2027-02-15');
    expect(ageAt('2020-03-10', '2027-02-15')).toBe(6);
    expect(ageAt('2021-02-15', '2027-02-15')).toBe(6);
    expect(ageAt('2021-02-16', '2027-02-15')).toBe(5);
    expect(meetsAgeRule('primero', '2020-03-10', '2027-02-01')).toBe(true);
    expect(meetsAgeRule('materno', '2023-02-15', '2027-02-01')).toBe(true);
    expect(meetsAgeRule('materno', '2023-02-16', '2027-02-01')).toBe(false);
    expect(meetsAgeRule('transicion', '2022-01-01', '2027-02-01')).toBe(true);
    expect(meetsAgeRule('septimo', '2015-02-15', '2027-02-01')).toBe(true);
    expect(meetsAgeRule('septimo', '2020-03-10', '2027-02-01')).toBe(false);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/mep/enrolStudent')
      .set('x-api-key', KEY)
      .send({ ...enrol, grade: 'octavo', birthDate: '10/03/2020' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 for unknown routes', async () => {
    const r = await request(app).get('/mep/nope').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
  });

  it('reset clears enrolments and restarts the sequence', async () => {
    await request(app).post('/mep/enrolStudent').set('x-api-key', KEY).send(enrol).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'mep' });
    expect((await request(app).get('/mep/enrolments').set('x-api-key', KEY)).body).toEqual([]);
    const again = await request(app).post('/mep/enrolStudent').set('x-api-key', KEY).send(enrol).expect(200);
    expect(again.body.enrolmentNumber).toBe(`MEP-${year}-000001`);
  });
});
