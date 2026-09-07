process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const KEY = 'demo-municipalidad-key';
const app = createApp();
const year = new Date().toISOString().slice(0, 4);
const body = {
  citizenId: '1-2345-6789',
  nite: '3-002-123456',
  businessName: 'Café Dent',
  activityCode: '5610', // baseFeeCrc 85000
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
  municipality: 'Montes de Oca',
};

describe('municipalidad', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'municipalidad', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).post('/municipalidad/issueLicense').send(body).expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
  });

  it('issues a patente with fee = base × canton multiplier and 1-year expiry', async () => {
    const r = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body).toMatchObject({
      patenteNumber: `P-${year}-00001`,
      municipality: 'Montes de Oca',
      annualFeeCrc: 85000,
    });
    expect(r.body.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number(r.body.expiryDate.slice(0, 4))).toBe(Number(r.body.issueDate.slice(0, 4)) + 1);
    expect(r.body.expiryDate.slice(4)).toBe(r.body.issueDate.slice(4));
    expect(Object.keys(r.body).sort()).toEqual(['annualFeeCrc', 'expiryDate', 'issueDate', 'municipality', 'patenteNumber']);
  });

  it('applies the canton multiplier and normalises canton names', async () => {
    const sj = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-000001', municipality: 'san jose' })
      .expect(200);
    expect(sj.body.municipality).toBe('San José');
    expect(sj.body.annualFeeCrc).toBe(102000); // 85000 × 1.2
    const tal = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-000002', municipality: 'Talamanca' })
      .expect(200);
    expect(tal.body.annualFeeCrc).toBe(68000); // 85000 × 0.8
    const gre = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-000003', municipality: 'Grecia' })
      .expect(200);
    expect(gre.body.annualFeeCrc).toBe(76500); // 85000 × 0.9
  });

  it('numbers patentes sequentially per year', async () => {
    const a = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, nite: '3-002-999999' })
      .expect(200);
    expect(a.body.patenteNumber).toBe(`P-${year}-00001`);
    expect(b.body.patenteNumber).toBe(`P-${year}-00002`);
  });

  it('is idempotent per NITE', async () => {
    const a = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    expect(b.body).toEqual(a.body);
    const list = await request(app).get('/municipalidad/licenses').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, municipality: '', activityCode: '12' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('422 MUNICIPALITY_UNKNOWN for a canton it does not serve', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, municipality: 'Atlantis' })
      .expect(422);
    expect(r.body.error.code).toBe('MUNICIPALITY_UNKNOWN');
  });

  it('422 ACTIVITY_UNKNOWN for an unknown activity', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLicense')
      .set('x-api-key', KEY)
      .send({ ...body, activityCode: '9999' })
      .expect(422);
    expect(r.body.error.code).toBe('ACTIVITY_UNKNOWN');
  });

  it('lists the cantons it serves', async () => {
    const r = await request(app).get('/municipalidad/cantons').set('x-api-key', KEY).expect(200);
    const names = r.body.map((c: { name: string }) => c.name);
    for (const n of ['Montes de Oca', 'San José', 'Talamanca', 'Grecia', 'Alajuela']) expect(names).toContain(n);
  });

  it('reset clears licenses and restarts the counter', async () => {
    await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/municipalidad/licenses').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
    const again = await request(app).post('/municipalidad/issueLicense').set('x-api-key', KEY).send(body).expect(200);
    expect(again.body.patenteNumber).toBe(`P-${year}-00001`);
  });
});

const landUse = {
  citizenId: '1-2345-6789',
  folio: '1-123456-000',
  municipality: 'Montes de Oca',
  projectType: 'vivienda',
  landUse: 'residencial',
};

const permit = {
  citizenId: '1-2345-6789',
  folio: '1-123456-000',
  municipality: 'Montes de Oca',
  apcNumber: 'APC-2026-000001',
  landUseCertificate: 'US-2026-00001',
  declaredValueCrc: 45000000,
  areaM2: 120,
};

const move = {
  citizenId: '1-2345-6789',
  address: 'Residencial Los Robles, San Rafael, Escazú, San José',
  province: 'San José',
  canton: 'Escazú',
  district: 'San Rafael',
  effectiveDate: '2026-09-01',
};


describe('municipalidad v2: issueLandUse', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('401 without key', async () => {
    await request(app).post('/municipalidad/issueLandUse').send(landUse).expect(401);
  });

  it('issues a land-use certificate with the allowed use', async () => {
    const r = await request(app).post('/municipalidad/issueLandUse').set('x-api-key', KEY).send(landUse).expect(200);
    expect(r.body).toMatchObject({
      certificateNumber: `US-${year}-00001`,
      municipality: 'Montes de Oca',
      allowedUse: 'Residencial: vivienda unifamiliar',
    });
    expect(r.body.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(r.body).sort()).toEqual(['allowedUse', 'certificateNumber', 'issueDate', 'municipality']);
  });

  it('builds allowedUse from landUse + projectType and normalises the canton', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, folio: '7-045678-000', municipality: 'talamanca', projectType: 'comercial', landUse: 'mixto' })
      .expect(200);
    expect(r.body.municipality).toBe('Talamanca');
    expect(r.body.allowedUse).toBe('Mixto: local comercial');
    const amp = await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, projectType: 'ampliacion', landUse: 'agrícola' })
      .expect(200);
    expect(amp.body.allowedUse).toBe('Agrícola: ampliación de obra existente');
  });

  it('is idempotent per (folio, projectType) and numbers certificates sequentially', async () => {
    const a = await request(app).post('/municipalidad/issueLandUse').set('x-api-key', KEY).send(landUse).expect(200);
    const b = await request(app).post('/municipalidad/issueLandUse').set('x-api-key', KEY).send(landUse).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, folio: '1-654321-000', projectType: 'comercial', landUse: 'comercial' })
      .expect(200);
    expect(other.body.certificateNumber).toBe(`US-${year}-00002`);
    const list = await request(app).get('/municipalidad/landUses').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('422 MUNICIPALITY_UNKNOWN and 422 LAND_USE_INCOMPATIBLE', async () => {
    const m = await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, municipality: 'Nicoya' })
      .expect(422);
    expect(m.body.error.code).toBe('MUNICIPALITY_UNKNOWN');
    const i = await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, landUse: 'agricola', projectType: 'comercial' })
      .expect(422);
    expect(i.body.error.code).toBe('LAND_USE_INCOMPATIBLE');
    // agricola + vivienda is fine
    await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, landUse: 'agricola', projectType: 'vivienda' })
      .expect(200);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/municipalidad/issueLandUse')
      .set('x-api-key', KEY)
      .send({ ...landUse, projectType: 'torre' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('municipalidad v2: issueBuildingPermit', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('issues a permit with 1 % tax and 1-year expiry', async () => {
    const r = await request(app).post('/municipalidad/issueBuildingPermit').set('x-api-key', KEY).send(permit).expect(200);
    expect(r.body).toMatchObject({
      permitNumber: `PC-${year}-00001`,
      municipality: 'Montes de Oca',
      taxCrc: 450000,
    });
    expect(Number(r.body.expiryDate.slice(0, 4)) - Number(r.body.issueDate.slice(0, 4))).toBe(1);
    expect(r.body.expiryDate.slice(4)).toBe(r.body.issueDate.slice(4));
    expect(Object.keys(r.body).sort()).toEqual(['expiryDate', 'issueDate', 'municipality', 'permitNumber', 'taxCrc']);
  });

  it('is idempotent per apcNumber', async () => {
    const a = await request(app).post('/municipalidad/issueBuildingPermit').set('x-api-key', KEY).send(permit).expect(200);
    const b = await request(app)
      .post('/municipalidad/issueBuildingPermit')
      .set('x-api-key', KEY)
      .send({ ...permit, declaredValueCrc: 1 })
      .expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/municipalidad/issueBuildingPermit')
      .set('x-api-key', KEY)
      .send({ ...permit, apcNumber: 'APC-2026-000002' })
      .expect(200);
    expect(other.body.permitNumber).toBe(`PC-${year}-00002`);
    const list = await request(app).get('/municipalidad/buildingPermits').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('422 MUNICIPALITY_UNKNOWN and 400 VALIDATION_ERROR', async () => {
    const m = await request(app)
      .post('/municipalidad/issueBuildingPermit')
      .set('x-api-key', KEY)
      .send({ ...permit, municipality: 'Nicoya' })
      .expect(422);
    expect(m.body.error.code).toBe('MUNICIPALITY_UNKNOWN');
    const v = await request(app)
      .post('/municipalidad/issueBuildingPermit')
      .set('x-api-key', KEY)
      .send({ ...permit, declaredValueCrc: -5 })
      .expect(400);
    expect(v.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears permits and land-use certificates and restarts counters', async () => {
    await request(app).post('/municipalidad/issueBuildingPermit').set('x-api-key', KEY).send(permit).expect(200);
    await request(app).post('/municipalidad/issueLandUse').set('x-api-key', KEY).send(landUse).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    expect((await request(app).get('/municipalidad/buildingPermits').set('x-api-key', KEY)).body).toEqual([]);
    expect((await request(app).get('/municipalidad/landUses').set('x-api-key', KEY)).body).toEqual([]);
    const again = await request(app).post('/municipalidad/issueBuildingPermit').set('x-api-key', KEY).send(permit).expect(200);
    expect(again.body.permitNumber).toBe(`PC-${year}-00001`);
  });
});

describe('municipalidad v2: updateAddress', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('updates the contribuyente address', async () => {
    const r = await request(app).post('/municipalidad/updateAddress').set('x-api-key', KEY).send(move).expect(200);
    expect(r.body).toEqual({ updated: true, registry: 'Municipalidad (contribuyente)', effectiveDate: '2026-09-01' });
    const list = await request(app).get('/municipalidad/addresses').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ citizenId: move.citizenId, canton: 'Escazú' });
  });

  it('400 VALIDATION_ERROR on a bad body and reset clears it', async () => {
    const r = await request(app)
      .post('/municipalidad/updateAddress')
      .set('x-api-key', KEY)
      .send({ ...move, canton: '' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).post('/municipalidad/updateAddress').set('x-api-key', KEY).send(move).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const list = await request(app).get('/municipalidad/addresses').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
  });
});
