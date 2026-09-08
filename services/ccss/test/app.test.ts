process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { ageAt, createApp, firstDayOfNextMonthIso, monthlyContribution, monthlyPension, pensionStatus, survivorPension, survivorStatus, voluntaryPremium } from '../src/app.js';

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

// ---------------------------------------------------------------- v3

const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);
const JOSE = '7-0123-0456';
const MARIA = '1-2345-6789';

const pensionBody = {
  citizenId: JOSE,
  fullName: 'José Alberto Mora Salazar',
  dateOfBirth: '1961-06-01',
  modality: 'vejez',
  iban: 'CR05015202001026284066',
};

const voluntaryBody = {
  citizenId: MARIA,
  fullName: 'María Fernández Gómez',
  declaredIncomeCrc: 400000,
};

describe('ccss v3: employment', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('401 without key', async () => {
    await request(app).get(`/ccss/employment/${MARIA}`).expect(401);
  });

  it('returns the seeded employment record for each citizen', async () => {
    const maria = await request(app).get(`/ccss/employment/${MARIA}`).set('x-api-key', KEY).expect(200);
    expect(maria.body).toEqual({
      citizenId: MARIA,
      employerName: 'Consultores Tica S.A.',
      employerNumber: 'E-30001',
      startDate: '2015-03-01',
      endDate: '2026-08-31',
      lastSalaryCrc: 950000,
      contributions: 138,
      status: 'cesado',
    });
    const jose = await request(app).get(`/ccss/employment/${JOSE}`).set('x-api-key', KEY).expect(200);
    expect(jose.body).toMatchObject({ employerName: 'Hotel Cahuita Ltda.', employerNumber: 'E-30002', startDate: '1990-06-01', lastSalaryCrc: 720000, contributions: 434, status: 'activo' });
    expect(jose.body.endDate).toBeUndefined();
    const ana = await request(app).get('/ccss/employment/2-0987-0654').set('x-api-key', KEY).expect(200);
    expect(ana.body).toMatchObject({ employerName: 'Café Grecia S.A.', employerNumber: 'E-30003', startDate: '2020-01-15', lastSalaryCrc: 610000, contributions: 80, status: 'activo' });
    const list = await request(app).get('/ccss/employment').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(4); // v4: Luis E-30004
  });

  it('404 EMPLOYMENT_NOT_FOUND for an unknown citizen', async () => {
    const r = await request(app).get('/ccss/employment/9-9999-9999').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('EMPLOYMENT_NOT_FOUND');
  });
});

describe('ccss v3: applyPension', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('pension rules: age, contributions and modality', () => {
    expect(ageAt('1961-06-01', '2026-09-07')).toBe(65);
    expect(ageAt('1961-09-08', '2026-09-07')).toBe(64);
    expect(ageAt('1961-09-07', '2026-09-07')).toBe(65);
    expect(pensionStatus(434, 65, 'vejez')).toBe('aprobada');
    expect(pensionStatus(300, 65, 'vejez')).toBe('aprobada');
    expect(pensionStatus(299, 70, 'vejez')).toBe('en-estudio');
    expect(pensionStatus(434, 64, 'vejez')).toBe('en-estudio');
    expect(pensionStatus(360, 62, 'anticipada')).toBe('aprobada');
    expect(pensionStatus(360, 62, 'vejez')).toBe('en-estudio');
    expect(pensionStatus(359, 62, 'anticipada')).toBe('en-estudio');
    expect(pensionStatus(360, 61, 'anticipada')).toBe('en-estudio');
    expect(monthlyPension(720000)).toBe(432000);
    expect(monthlyPension(950000)).toBe(570000);
    expect(monthlyPension(123456)).toBe(74100);
    expect(firstDayOfNextMonthIso('2026-12-15')).toBe('2027-01-01');
  });

  it('approves José (65, 434 cuotas): 60 % of ₡720 000, first payment next month', async () => {
    const r = await request(app).post('/ccss/applyPension').set('x-api-key', KEY).send(pensionBody).expect(200);
    expect(r.body).toEqual({
      applicationNumber: `IVM-${year}-000001`,
      regime: 'IVM',
      contributions: 434,
      monthlyPensionCrc: 432000,
      firstPaymentDate: firstDayOfNextMonthIso(today),
      status: 'aprobada',
    });
  });

  it('leaves María (born 1990, 138 cuotas) en estudio', async () => {
    const r = await request(app)
      .post('/ccss/applyPension')
      .set('x-api-key', KEY)
      .send({ ...pensionBody, citizenId: MARIA, fullName: 'María Fernández Gómez', dateOfBirth: '1990-05-14' })
      .expect(200);
    expect(r.body).toMatchObject({ status: 'en-estudio', contributions: 138, monthlyPensionCrc: 570000 });
  });

  it('is idempotent per citizenId and listed', async () => {
    const a = await request(app).post('/ccss/applyPension').set('x-api-key', KEY).send(pensionBody).expect(200);
    const b = await request(app)
      .post('/ccss/applyPension')
      .set('x-api-key', KEY)
      .send({ ...pensionBody, modality: 'anticipada' })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/ccss/applyPension')
      .set('x-api-key', KEY)
      .send({ ...pensionBody, citizenId: MARIA, dateOfBirth: '1990-05-14' })
      .expect(200);
    expect(other.body.applicationNumber).toBe(`IVM-${year}-000002`);
    const list = await request(app).get('/ccss/pensions').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ citizenId: JOSE, modality: 'vejez', applicationDate: today });
  });

  it('404 EMPLOYMENT_NOT_FOUND without an employment record; 400 VALIDATION_ERROR', async () => {
    const nf = await request(app)
      .post('/ccss/applyPension')
      .set('x-api-key', KEY)
      .send({ ...pensionBody, citizenId: '9-9999-9999' })
      .expect(404);
    expect(nf.body.error.code).toBe('EMPLOYMENT_NOT_FOUND');
    const v = await request(app)
      .post('/ccss/applyPension')
      .set('x-api-key', KEY)
      .send({ ...pensionBody, iban: 'CR1', modality: 'invalidez' })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears applications, keeps the employment seed and restarts the counter', async () => {
    await request(app).post('/ccss/applyPension').set('x-api-key', KEY).send(pensionBody).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    expect((await request(app).get('/ccss/pensions').set('x-api-key', KEY)).body).toEqual([]);
    await request(app).get(`/ccss/employment/${JOSE}`).set('x-api-key', KEY).expect(200);
    const again = await request(app).post('/ccss/applyPension').set('x-api-key', KEY).send(pensionBody).expect(200);
    expect(again.body.applicationNumber).toBe(`IVM-${year}-000001`);
  });
});

describe('ccss v3: enrollVoluntary', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('enrols with premium 12.33 % of the declared income, covered from today', async () => {
    const r = await request(app).post('/ccss/enrollVoluntary').set('x-api-key', KEY).send(voluntaryBody).expect(200);
    expect(r.body).toEqual({ policyNumber: `AV-${year}-000001`, monthlyPremiumCrc: 49320, coveredFrom: today });
    expect(voluntaryPremium(0)).toBe(25000);
    expect(voluntaryPremium(200000)).toBe(25000);
    expect(voluntaryPremium(202758)).toBe(25000);
    expect(voluntaryPremium(1000000)).toBe(123300);
  });

  it('applies the ₡25 000 floor', async () => {
    const r = await request(app)
      .post('/ccss/enrollVoluntary')
      .set('x-api-key', KEY)
      .send({ ...voluntaryBody, declaredIncomeCrc: 100000 })
      .expect(200);
    expect(r.body.monthlyPremiumCrc).toBe(25000);
  });

  it('is idempotent per citizenId and listed', async () => {
    const a = await request(app).post('/ccss/enrollVoluntary').set('x-api-key', KEY).send(voluntaryBody).expect(200);
    const b = await request(app)
      .post('/ccss/enrollVoluntary')
      .set('x-api-key', KEY)
      .send({ ...voluntaryBody, declaredIncomeCrc: 900000 })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/ccss/enrollVoluntary')
      .set('x-api-key', KEY)
      .send({ ...voluntaryBody, citizenId: JOSE, fullName: 'José Alberto Mora Salazar' })
      .expect(200);
    expect(other.body.policyNumber).toBe(`AV-${year}-000002`);
    const list = await request(app).get('/ccss/voluntary').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).toMatchObject({ citizenId: MARIA, declaredIncomeCrc: 400000 });
  });

  it('400 VALIDATION_ERROR and reset clears policies', async () => {
    const v = await request(app)
      .post('/ccss/enrollVoluntary')
      .set('x-api-key', KEY)
      .send({ ...voluntaryBody, declaredIncomeCrc: -1 })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).post('/ccss/enrollVoluntary').set('x-api-key', KEY).send(voluntaryBody).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    expect((await request(app).get('/ccss/voluntary').set('x-api-key', KEY)).body).toEqual([]);
  });
});

// ---------------------------------------------------------------- v4

describe('ccss v4: survivorPension', () => {
  const ROSA = '7-0111-0222';
  const LUIS = '7-0100-0300';
  const year = Number(new Date().toISOString().slice(0, 4));
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = firstDayOfNextMonthIso(today);
  const viudez = { survivorId: ROSA, deceasedId: LUIS, relationship: 'conyuge', deathCertificate: `DEF-${year}-000001`, iban: 'CR05015202001026284066' };

  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('serves Luis\'s seeded employment record E-30004', async () => {
    const r = await request(app).get(`/ccss/employment/${LUIS}`).set('x-api-key', KEY).expect(200);
    expect(r.body).toEqual({
      citizenId: LUIS,
      employerName: 'Cooperativa de Cacao Talamanca R.L.',
      employerNumber: 'E-30004',
      startDate: '1985-01-15',
      lastSalaryCrc: 680000,
      contributions: 480,
      status: 'activo',
    });
  });

  it('viudez: 70 % of the IVM estimate (60 % of ₡680 000 → ₡408 000), aprobada with 480 contributions', async () => {
    const r = await request(app).post('/ccss/survivorPension').set('x-api-key', KEY).send(viudez).expect(200);
    expect(r.body).toEqual({
      applicationNumber: `IVM-SV-${year}-000001`,
      beneficiary: 'viudez',
      monthlyPensionCrc: 285600,
      firstPaymentDate: nextMonth,
      status: 'aprobada',
    });
    expect(survivorPension(680000, 'conyuge')).toBe(285600);
    expect(survivorPension(680000, 'hijo')).toBe(122400);
    expect(survivorStatus(179)).toBe('en-estudio');
    expect(survivorStatus(180)).toBe('aprobada');
  });

  it('orfandad: 30 % for a child; en-estudio when the deceased had < 180 contributions (María, 138)', async () => {
    const hijo = await request(app)
      .post('/ccss/survivorPension')
      .set('x-api-key', KEY)
      .send({ ...viudez, survivorId: '7-9999-0002', relationship: 'hijo' })
      .expect(200);
    expect(hijo.body).toMatchObject({ applicationNumber: `IVM-SV-${year}-000001`, beneficiary: 'orfandad', monthlyPensionCrc: 122400, status: 'aprobada' });
    const study = await request(app)
      .post('/ccss/survivorPension')
      .set('x-api-key', KEY)
      .send({ ...viudez, survivorId: '1-9999-0001', deceasedId: '1-2345-6789', relationship: 'hijo' })
      .expect(200);
    expect(study.body).toMatchObject({ beneficiary: 'orfandad', monthlyPensionCrc: 171000, status: 'en-estudio' });
  });

  it('is idempotent per (survivorId, deceasedId) and listed', async () => {
    const a = await request(app).post('/ccss/survivorPension').set('x-api-key', KEY).send(viudez).expect(200);
    const b = await request(app).post('/ccss/survivorPension').set('x-api-key', KEY).send({ ...viudez, relationship: 'hijo' }).expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/ccss/survivorPensions').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ survivorId: ROSA, deceasedId: LUIS, relationship: 'conyuge', deathCertificate: viudez.deathCertificate });
  });

  it('404 EMPLOYMENT_NOT_FOUND when the deceased has no record, 400 on a bad body', async () => {
    const nf = await request(app).post('/ccss/survivorPension').set('x-api-key', KEY).send({ ...viudez, deceasedId: '9-9999-9999' }).expect(404);
    expect(nf.body.error.code).toBe('EMPLOYMENT_NOT_FOUND');
    const bad = await request(app).post('/ccss/survivorPension').set('x-api-key', KEY).send({ ...viudez, relationship: 'primo', iban: 'x' }).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears survivor pensions', async () => {
    await request(app).post('/ccss/survivorPension').set('x-api-key', KEY).send(viudez).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    expect((await request(app).get('/ccss/survivorPensions').set('x-api-key', KEY)).body).toEqual([]);
  });
});
