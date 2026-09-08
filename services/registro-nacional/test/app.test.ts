process.env.AGENCY_LATENCY_MS = '0';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const KEY = 'demo-registro-nacional-key';
const app = createApp();
const body = {
  citizenId: '1-2345-6789',
  fullName: 'María Fernández Gómez',
  legalName: 'Café Dent Sociedad Anónima',
  activityCode: '5610',
  address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
};

describe('registro-nacional', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('GET /health works without key', async () => {
    const r = await request(app).get('/health').expect(200);
    expect(r.body).toMatchObject({ status: 'ok', service: 'registro-nacional', mode: 'demo' });
  });

  it('401 without key', async () => {
    const r = await request(app).get('/registro-nacional/properties?ownerId=1-2345-6789').expect(401);
    expect(r.body.error.code).toBe('UNAUTHORIZED');
    await request(app).post('/registro-nacional/registerCompany').send(body).expect(401);
  });

  it('lists María\'s two seed properties', async () => {
    const r = await request(app)
      .get('/registro-nacional/properties')
      .query({ ownerId: '1-2345-6789' })
      .set('x-api-key', KEY)
      .expect(200);
    expect(r.body.map((p: { folio: string }) => p.folio).sort()).toEqual(['1-123456-000', '1-654321-000']);
    const clean = r.body.find((p: { folio: string }) => p.folio === '1-123456-000');
    expect(clean).toEqual({
      folio: '1-123456-000',
      ownerId: '1-2345-6789',
      province: 'San José',
      canton: 'Montes de Oca',
      district: 'San Pedro',
      areaM2: 250,
      landUse: 'residencial',
      address: 'Barrio Dent, San Pedro, Montes de Oca, San José',
      encumbrances: [],
    });
    const mortgaged = r.body.find((p: { folio: string }) => p.folio === '1-654321-000');
    expect(mortgaged).toMatchObject({ landUse: 'comercial', areaM2: 400, encumbrances: ['Hipoteca Banco Nacional'] });
  });

  it('serves José and Ana, and an empty list for an owner with no property', async () => {
    const jose = await request(app).get('/registro-nacional/properties?ownerId=7-0123-0456').set('x-api-key', KEY).expect(200);
    expect(jose.body).toHaveLength(1);
    expect(jose.body[0]).toMatchObject({ folio: '7-045678-000', canton: 'Talamanca', landUse: 'mixto', areaM2: 1200 });
    const ana = await request(app).get('/registro-nacional/properties?ownerId=2-0987-0654').set('x-api-key', KEY).expect(200);
    expect(ana.body[0]).toMatchObject({ folio: '2-111222-000', canton: 'Grecia', landUse: 'residencial', areaM2: 300 });
    const none = await request(app).get('/registro-nacional/properties?ownerId=9-9999-9999').set('x-api-key', KEY).expect(200);
    expect(none.body).toEqual([]);
  });

  it('400 VALIDATION_ERROR when ownerId is missing or malformed', async () => {
    const r = await request(app).get('/registro-nacional/properties').set('x-api-key', KEY).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    await request(app).get('/registro-nacional/properties?ownerId=abc').set('x-api-key', KEY).expect(400);
  });

  it('GET /property/:folio returns a property or 404 PROPERTY_NOT_FOUND', async () => {
    const r = await request(app).get('/registro-nacional/property/7-045678-000').set('x-api-key', KEY).expect(200);
    expect(r.body).toMatchObject({ folio: '7-045678-000', ownerId: '7-0123-0456' });
    const nf = await request(app).get('/registro-nacional/property/9-999999-000').set('x-api-key', KEY).expect(404);
    expect(nf.body.error.code).toBe('PROPERTY_NOT_FOUND');
    expect(nf.body.error.message).toMatch(/folio/);
  });

  it('registers a company with cédula jurídica and tomo', async () => {
    const r = await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    expect(r.body.cedulaJuridica).toMatch(/^3-101-\d{6}$/);
    expect(r.body.tomo).toMatch(/^\d{4}-\d{6}-1-1$/);
    expect(r.body.legalName).toBe(body.legalName);
    expect(r.body.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(r.body).sort()).toEqual(['cedulaJuridica', 'legalName', 'registrationDate', 'tomo']);
  });

  it('is idempotent per (citizenId, legalName)', async () => {
    const a = await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    const b = await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/registro-nacional/registerCompany')
      .set('x-api-key', KEY)
      .send({ ...body, legalName: 'Otra Empresa S.R.L.' })
      .expect(200);
    expect(other.body.cedulaJuridica).not.toBe(a.body.cedulaJuridica);
    const list = await request(app).get('/registro-nacional/companies').set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('400 VALIDATION_ERROR on a bad body', async () => {
    const r = await request(app)
      .post('/registro-nacional/registerCompany')
      .set('x-api-key', KEY)
      .send({ ...body, citizenId: '123', legalName: 'ab' })
      .expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reset clears companies and keeps the seed properties', async () => {
    await request(app).post('/registro-nacional/registerCompany').set('x-api-key', KEY).send(body).expect(200);
    const r = await request(app).post('/__demo/reset').expect(200);
    expect(r.body).toEqual({ ok: true, service: 'registro-nacional' });
    const list = await request(app).get('/registro-nacional/companies').set('x-api-key', KEY).expect(200);
    expect(list.body).toEqual([]);
    const props = await request(app).get('/registro-nacional/properties?ownerId=1-2345-6789').set('x-api-key', KEY).expect(200);
    expect(props.body).toHaveLength(2);
  });
});

// ---------------------------------------------------------------- v4

const ANA = '2-0987-0654';
const JOSE = '7-0123-0456';
const LUIS = '7-0100-0300';
const DIEGO = '1-1111-2222';
const year = Number(new Date().toISOString().slice(0, 4));

const vehicleSale = { plate: 'BCR-123', sellerId: ANA, buyerId: DIEGO, taxReceipt: `HAC-${year}-000001`, priceCrc: 8000000 };
const propertySale = { folio: '2-111222-000', sellerId: ANA, buyerId: DIEGO, taxReceipt: `HAC-${year}-000002`, priceCrc: 45000000 };

describe('registro-nacional v4: vehicles', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('serves the three seed vehicles by plate (case-insensitive)', async () => {
    const ana = await request(app).get('/registro-nacional/vehicle/BCR-123').set('x-api-key', KEY).expect(200);
    expect(ana.body).toEqual({ plate: 'BCR-123', ownerId: ANA, make: 'Toyota', model: 'Yaris', year: 2019, fiscalValueCrc: 7500000, encumbrances: [] });
    const jose = await request(app).get('/registro-nacional/vehicle/sjb-456').set('x-api-key', KEY).expect(200);
    expect(jose.body).toMatchObject({ ownerId: JOSE, make: 'Hyundai', model: 'Tucson', year: 2021, fiscalValueCrc: 14000000, encumbrances: ['Prenda Banco Popular'] });
    const luis = await request(app).get('/registro-nacional/vehicle/LAV-777').set('x-api-key', KEY).expect(200);
    expect(luis.body).toMatchObject({ ownerId: LUIS, make: 'Nissan', model: 'Frontier', year: 2015, fiscalValueCrc: 6200000, encumbrances: [] });
  });

  it('404 VEHICLE_NOT_FOUND for an unknown plate', async () => {
    const r = await request(app).get('/registro-nacional/vehicle/ZZZ-999').set('x-api-key', KEY).expect(404);
    expect(r.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('lists vehicles by ownerId and validates the query', async () => {
    const r = await request(app).get('/registro-nacional/vehicles').query({ ownerId: JOSE }).set('x-api-key', KEY).expect(200);
    expect(r.body.map((v: { plate: string }) => v.plate)).toEqual(['SJB-456']);
    const none = await request(app).get('/registro-nacional/vehicles').query({ ownerId: '1-2345-6789' }).set('x-api-key', KEY).expect(200);
    expect(none.body).toEqual([]);
    const bad = await request(app).get('/registro-nacional/vehicles').set('x-api-key', KEY).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Luis owns the seeded property 7-077888-000 (Talamanca, mixto, 2 000 m², clean)', async () => {
    const r = await request(app).get('/registro-nacional/property/7-077888-000').set('x-api-key', KEY).expect(200);
    expect(r.body).toMatchObject({ ownerId: LUIS, province: 'Limón', canton: 'Talamanca', district: 'Cahuita', areaM2: 2000, landUse: 'mixto', encumbrances: [] });
    const list = await request(app).get('/registro-nacional/properties').query({ ownerId: LUIS }).set('x-api-key', KEY).expect(200);
    expect(list.body).toHaveLength(1);
  });
});

describe('registro-nacional v4: transferVehicle', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('transfers BCR-123 from Ana to Diego with a BM number and updates the owner', async () => {
    const r = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send(vehicleSale).expect(200);
    expect(r.body).toEqual({ plate: 'BCR-123', newOwnerId: DIEGO, registrationNumber: `BM-${year}-000001`, registeredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    const v = await request(app).get('/registro-nacional/vehicle/BCR-123').set('x-api-key', KEY).expect(200);
    expect(v.body.ownerId).toBe(DIEGO);
    const diego = await request(app).get('/registro-nacional/vehicles').query({ ownerId: DIEGO }).set('x-api-key', KEY).expect(200);
    expect(diego.body).toHaveLength(1);
    const list = await request(app).get('/registro-nacional/vehicleTransfers').set('x-api-key', KEY).expect(200);
    expect(list.body[0]).toMatchObject({ sellerId: ANA, taxReceipt: vehicleSale.taxReceipt, priceCrc: 8000000 });
  });

  it('is idempotent per (plate, taxReceipt): the repeat does not hit SELLER_MISMATCH', async () => {
    const a = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send(vehicleSale).expect(200);
    const b = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send(vehicleSale).expect(200);
    expect(b.body).toEqual(a.body);
    const other = await request(app)
      .post('/registro-nacional/transferVehicle')
      .set('x-api-key', KEY)
      .send({ ...vehicleSale, taxReceipt: 'HAC-OTHER' })
      .expect(409);
    expect(other.body.error.code).toBe('SELLER_MISMATCH');
  });

  it('409 SELLER_MISMATCH, 422 ENCUMBERED, 404 VEHICLE_NOT_FOUND, 400 on a bad body', async () => {
    const mismatch = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send({ ...vehicleSale, sellerId: JOSE }).expect(409);
    expect(mismatch.body.error.code).toBe('SELLER_MISMATCH');
    const enc = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send({ ...vehicleSale, plate: 'SJB-456', sellerId: JOSE }).expect(422);
    expect(enc.body.error.code).toBe('ENCUMBERED');
    expect(enc.body.error.message).toContain('Prenda Banco Popular');
    const nf = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send({ ...vehicleSale, plate: 'ZZZ-999' }).expect(404);
    expect(nf.body.error.code).toBe('VEHICLE_NOT_FOUND');
    const bad = await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send({ ...vehicleSale, priceCrc: 0, buyerId: 'x' }).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    const v = await request(app).get('/registro-nacional/vehicle/BCR-123').set('x-api-key', KEY).expect(200);
    expect(v.body.ownerId).toBe(ANA);
  });

  it('reset restores the seeded owner', async () => {
    await request(app).post('/registro-nacional/transferVehicle').set('x-api-key', KEY).send(vehicleSale).expect(200);
    await request(app).post('/__demo/reset').expect(200);
    const v = await request(app).get('/registro-nacional/vehicle/BCR-123').set('x-api-key', KEY).expect(200);
    expect(v.body.ownerId).toBe(ANA);
    expect((await request(app).get('/registro-nacional/vehicleTransfers').set('x-api-key', KEY)).body).toEqual([]);
  });
});

describe('registro-nacional v4: transferProperty', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('transfers 2-111222-000 from Ana to Diego with a BI number and updates the owner', async () => {
    const r = await request(app).post('/registro-nacional/transferProperty').set('x-api-key', KEY).send(propertySale).expect(200);
    expect(r.body).toEqual({ folio: '2-111222-000', newOwnerId: DIEGO, registrationNumber: `BI-${year}-000001`, registeredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    const p = await request(app).get('/registro-nacional/property/2-111222-000').set('x-api-key', KEY).expect(200);
    expect(p.body.ownerId).toBe(DIEGO);
    const ana = await request(app).get('/registro-nacional/properties').query({ ownerId: ANA }).set('x-api-key', KEY).expect(200);
    expect(ana.body).toEqual([]);
  });

  it('is idempotent per (folio, taxReceipt)', async () => {
    const a = await request(app).post('/registro-nacional/transferProperty').set('x-api-key', KEY).send(propertySale).expect(200);
    const b = await request(app).post('/registro-nacional/transferProperty').set('x-api-key', KEY).send({ ...propertySale, priceCrc: 1 }).expect(200);
    expect(b.body).toEqual(a.body);
    expect((await request(app).get('/registro-nacional/propertyTransfers').set('x-api-key', KEY)).body).toHaveLength(1);
  });

  it('409 SELLER_MISMATCH, 422 ENCUMBERED (María\'s mortgaged lot), 404 PROPERTY_NOT_FOUND', async () => {
    const mismatch = await request(app).post('/registro-nacional/transferProperty').set('x-api-key', KEY).send({ ...propertySale, sellerId: JOSE }).expect(409);
    expect(mismatch.body.error.code).toBe('SELLER_MISMATCH');
    const enc = await request(app)
      .post('/registro-nacional/transferProperty')
      .set('x-api-key', KEY)
      .send({ ...propertySale, folio: '1-654321-000', sellerId: '1-2345-6789' })
      .expect(422);
    expect(enc.body.error.code).toBe('ENCUMBERED');
    const nf = await request(app).post('/registro-nacional/transferProperty').set('x-api-key', KEY).send({ ...propertySale, folio: '9-999999-000' }).expect(404);
    expect(nf.body.error.code).toBe('PROPERTY_NOT_FOUND');
  });
});

describe('registro-nacional v4: listEstate', () => {
  beforeEach(async () => {
    await request(app).post('/__demo/reset').expect(200);
  });

  it('lists Luis\'s property, vehicle and companies with the succession annotation', async () => {
    await request(app)
      .post('/registro-nacional/registerCompany')
      .set('x-api-key', KEY)
      .send({ citizenId: LUIS, fullName: 'Luis Ángel Vargas Mora', legalName: 'Cacao Vargas Sociedad Anónima', activityCode: '5610', address: 'Cahuita' })
      .expect(200);
    const r = await request(app)
      .post('/registro-nacional/listEstate')
      .set('x-api-key', KEY)
      .send({ deceasedId: LUIS, deathCertificate: `DEF-${year}-000001` })
      .expect(200);
    expect(r.body.properties).toEqual([{ folio: '7-077888-000', canton: 'Talamanca', areaM2: 2000 }]);
    expect(r.body.vehicles).toEqual([{ plate: 'LAV-777', make: 'Nissan', model: 'Frontier', year: 2015 }]);
    expect(r.body.companies).toHaveLength(1);
    expect(r.body.companies[0]).toMatchObject({ legalName: 'Cacao Vargas Sociedad Anónima' });
    expect(r.body.companies[0].cedulaJuridica).toMatch(/^3-101-\d{6}$/);
    expect(r.body.annotation).toBe(`Sucesión abierta — certificado DEF-${year}-000001`);
    expect(Object.keys(r.body).sort()).toEqual(['annotation', 'companies', 'properties', 'vehicles']);
  });

  it('returns empty lists for someone without assets and 400 on a bad body', async () => {
    const r = await request(app).post('/registro-nacional/listEstate').set('x-api-key', KEY).send({ deceasedId: DIEGO, deathCertificate: 'DEF-X' }).expect(200);
    expect(r.body).toEqual({ properties: [], vehicles: [], companies: [], annotation: 'Sucesión abierta — certificado DEF-X' });
    const bad = await request(app).post('/registro-nacional/listEstate').set('x-api-key', KEY).send({ deceasedId: LUIS }).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });
});
