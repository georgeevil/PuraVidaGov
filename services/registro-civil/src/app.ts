import {
  cedulaSchema,
  createServiceApp,
  errorHandler,
  registerBirthSchema,
  registerDeathSchema,
  registerMarriageSchema,
  simulatedLatency,
  todayIso,
  updateAddressSchema,
  type AddressUpdateResponse,
  type BirthRegistrationResponse,
  type Citizen,
  type DeathRegistrationResponse,
  type MarriageRegistrationResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import { randomInt } from 'node:crypto';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type BirthRegistration, type DeathRegistration, type MarriageRegistration } from './store.js';

export const SERVICE_NAME = 'registro-civil';
export const ADDRESS_REGISTRY = 'Registro Civil (domicilio electoral)';

type RegisterBirthBody = z.infer<typeof registerBirthSchema>;
type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
type RegisterDeathBody = z.infer<typeof registerDeathSchema>;
type RegisterMarriageBody = z.infer<typeof registerMarriageSchema>;

/** A minor's cédula: `<province digit of the parent>-<4 random>-<4 random>`, unused by this instance. */
function freshChildId(parentId: string): string {
  const province = parentId.slice(0, 1);
  let id = '';
  for (let i = 0; i < 20; i++) {
    id = `${province}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
    if (!store.has(id)) return id;
  }
  return id;
}

function birthToResponse(b: BirthRegistration): BirthRegistrationResponse {
  const { childId, certificateNumber, registrationDate } = b;
  return { childId, certificateNumber, registrationDate };
}

function deathToResponse(d: DeathRegistration): DeathRegistrationResponse {
  const { certificateNumber, deceasedId, deceasedName, date, registeredAt, medicalCertificate } = d;
  return { certificateNumber, deceasedId, deceasedName, date, registeredAt, medicalCertificate };
}

function marriageToResponse(m: MarriageRegistration): MarriageRegistrationResponse {
  const { certificateNumber, spouseAId, spouseBId, date, regime } = m;
  return { certificateNumber, spouseAId, spouseBId, date, regime };
}

function citizenNotFound(id: string) {
  return { error: { code: 'CITIZEN_NOT_FOUND', message: `No existe una persona con la cédula ${id}` } };
}

function alreadyDeceased(c: Citizen) {
  return {
    error: {
      code: 'ALREADY_DECEASED',
      message: `La defunción de ${c.fullName} ya está inscrita (certificado ${c.deceased?.certificateNumber})`,
    },
  };
}

export function createApp(): Express {
  const apiKey = process.env.REGISTRO_API_KEY ?? 'demo-registro-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/registro/citizens', (_req, res) => {
    res.json(store.list());
  });

  app.get('/registro/births', (_req, res) => {
    res.json(store.listBirths());
  });

  app.get(
    '/registro/citizen/:id',
    wrap(async (req, res) => {
      const id = String(req.params.id);
      if (!cedulaSchema.safeParse(id).success) {
        return res
          .status(400)
          .json({ error: { code: 'VALIDATION_ERROR', message: 'La cédula debe tener el formato 0-0000-0000' } });
      }
      await simulatedLatency();
      const citizen = store.get(id);
      if (!citizen) return res.status(404).json(citizenNotFound(id));
      res.json(citizen);
    }),
  );

  app.post(
    '/registro/registerBirth',
    validateBody(registerBirthSchema),
    wrap(async (req, res) => {
      const body = req.body as RegisterBirthBody;
      await simulatedLatency();

      const parent = store.get(body.parentId);
      if (!parent) return res.status(404).json(citizenNotFound(body.parentId));

      const existing = store.findBirth(body.parentId, body.childFirstName, body.birthDate);
      if (existing) return res.json(birthToResponse(existing));

      const registrationDate = todayIso();
      const year = Number(registrationDate.slice(0, 4));
      const childId = freshChildId(body.parentId);
      const firstName = body.childFirstName.trim();
      const lastName1 = body.childLastName1.trim();
      const lastName2 = body.childLastName2.trim();
      const minor: Citizen = {
        id: childId,
        fullName: `${firstName} ${lastName1} ${lastName2}`,
        firstName,
        lastName1,
        lastName2,
        dateOfBirth: body.birthDate,
        nationality: 'CR',
        address: parent.address,
        province: parent.province,
        canton: parent.canton,
        district: parent.district,
        maritalStatus: 'single',
        email: parent.email,
        phone: parent.phone,
      };
      store.put(minor);

      const birth = store.saveBirth({
        parentId: body.parentId,
        childFirstName: body.childFirstName,
        birthDate: body.birthDate,
        hospital: body.hospital,
        childId,
        certificateNumber: `NAC-${year}-${String(store.nextBirthSequence(year)).padStart(6, '0')}`,
        registrationDate,
      });
      res.json(birthToResponse(birth));
    }),
  );

  app.post(
    '/registro/updateAddress',
    validateBody(updateAddressSchema),
    wrap(async (req, res) => {
      const body = req.body as UpdateAddressBody;
      await simulatedLatency();

      const citizen = store.get(body.citizenId);
      if (!citizen) return res.status(404).json(citizenNotFound(body.citizenId));

      store.put({
        ...citizen,
        address: body.address.trim(),
        province: body.province.trim(),
        canton: body.canton.trim(),
        district: body.district.trim(),
      });
      const response: AddressUpdateResponse = { updated: true, registry: ADDRESS_REGISTRY, effectiveDate: body.effectiveDate };
      res.json(response);
    }),
  );

  // ---------------------------------------------------------------- v4: deaths, marriages, dependants

  app.get('/registro/deaths', (_req, res) => {
    res.json(store.listDeaths());
  });

  app.get('/registro/marriages', (_req, res) => {
    res.json(store.listMarriages());
  });

  app.get(
    '/registro/dependants/:id',
    wrap(async (req, res) => {
      const id = String(req.params.id);
      if (!cedulaSchema.safeParse(id).success) {
        return res
          .status(400)
          .json({ error: { code: 'VALIDATION_ERROR', message: 'La cédula debe tener el formato 0-0000-0000' } });
      }
      await simulatedLatency();
      const citizen = store.get(id);
      if (!citizen) return res.status(404).json(citizenNotFound(id));
      const spouse = citizen.spouseId ? store.get(citizen.spouseId) : undefined;
      const children = (citizen.children ?? []).map((childId) => store.get(childId)).filter((c): c is Citizen => !!c);
      res.json(spouse ? { spouse, children } : { children });
    }),
  );

  app.post(
    '/registro/registerDeath',
    validateBody(registerDeathSchema),
    wrap(async (req, res) => {
      const body = req.body as RegisterDeathBody;
      await simulatedLatency();

      const existing = store.findDeath(body.deceasedId);
      if (existing) return res.json(deathToResponse(existing));

      const deceased = store.get(body.deceasedId);
      if (!deceased) return res.status(404).json(citizenNotFound(body.deceasedId));
      if (deceased.deceased) return res.status(409).json(alreadyDeceased(deceased));

      const registeredAt = todayIso();
      const year = Number(registeredAt.slice(0, 4));
      const seq = store.nextDeathSequence(year);
      const certificateNumber = `DEF-${year}-${String(seq).padStart(6, '0')}`;
      store.put({ ...deceased, deceased: { date: body.date, certificateNumber } });

      const death = store.saveDeath({
        declarantId: body.declarantId,
        hospital: body.hospital,
        certificateNumber,
        deceasedId: deceased.id,
        deceasedName: deceased.fullName,
        date: body.date,
        registeredAt,
        medicalCertificate: `SEDIMEC-DEF-${String(seq).padStart(6, '0')}`,
      });
      res.json(deathToResponse(death));
    }),
  );

  app.post(
    '/registro/registerMarriage',
    validateBody(registerMarriageSchema),
    wrap(async (req, res) => {
      const body = req.body as RegisterMarriageBody;
      await simulatedLatency();

      const existing = store.findMarriage(body.spouseAId, body.spouseBId);
      if (existing) return res.json(marriageToResponse(existing));

      if (body.spouseAId === body.spouseBId) {
        return res
          .status(400)
          .json({ error: { code: 'VALIDATION_ERROR', message: 'Los contrayentes deben ser dos personas distintas' } });
      }
      const a = store.get(body.spouseAId);
      if (!a) return res.status(404).json(citizenNotFound(body.spouseAId));
      const b = store.get(body.spouseBId);
      if (!b) return res.status(404).json(citizenNotFound(body.spouseBId));
      for (const c of [a, b]) {
        if (c.deceased) return res.status(409).json(alreadyDeceased(c));
      }
      for (const c of [a, b]) {
        if (c.maritalStatus === 'married') {
          return res.status(409).json({
            error: { code: 'ALREADY_MARRIED', message: `${c.fullName} ya figura como casado/a en el Registro Civil` },
          });
        }
      }

      const registeredAt = todayIso();
      const year = Number(registeredAt.slice(0, 4));
      store.put({ ...a, maritalStatus: 'married', spouseId: b.id });
      store.put({ ...b, maritalStatus: 'married', spouseId: a.id });
      const marriage = store.saveMarriage({
        certificateNumber: `MAT-${year}-${String(store.nextMarriageSequence(year)).padStart(6, '0')}`,
        spouseAId: a.id,
        spouseBId: b.id,
        date: body.date,
        regime: body.regime,
        notary: body.notary,
        registeredAt,
      });
      res.json(marriageToResponse(marriage));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
