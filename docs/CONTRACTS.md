# Contracts — binding interfaces between packages

Read this before touching any package. Types live in `packages/shared/src/types.ts` and zod schemas in
`packages/shared/src/schemas.ts`; this document explains how they are used over the wire. Change both together.

## Topology and ports

| Package | Name | Dev port | Docker service | Talks to |
|---|---|---|---|---|
| `apps/web` | Portal ciudadano (React + Vite + Tailwind) | 5173 (nginx :3000 in Docker) | `web` | `apps/api` only, via `/api/*` |
| `apps/api` | Backend / orquestador (Express) | 3001 | `api` | `services/bus` only |
| `services/bus` | Bus de interoperabilidad (X-Road-style router) | 4000 | `bus` | the four agencies |
| `services/registro-civil` | Registro Civil (TSE) mock | 4001 | `registro` | nobody |
| `services/tributacion` | Tributación (Hacienda) mock | 4002 | `tributacion` | nobody |
| `services/ccss` | CCSS mock | 4003 | `ccss` | nobody |
| `services/municipalidad` | Municipalidad mock | 4004 | `municipalidad` | nobody |
| `infra/caddy` | HTTPS reverse proxy (`tls internal`) | 8443 | `caddy` | web, api |

**Rules**
- The frontend never calls the bus or an agency directly. The API never calls an agency directly. Agencies never call
  each other. Every cross-agency exchange goes through the bus and is therefore audited.
- Every service is built with `createServiceApp()` from `@pvg/shared` and exposes `GET /health` →
  `{ status:"ok", service, mode:"demo", timestamp }`.
- Service-to-service auth is a static API key in header `x-api-key` (PRD §7.3). Env names: `BUS_API_KEY`,
  `REGISTRO_API_KEY`, `TRIBUTACION_API_KEY`, `CCSS_API_KEY`, `MUNICIPALIDAD_API_KEY`. Defaults in `.env.example`.
- Each service is ESM TypeScript run with `tsx` (`npm run dev` / `npm start`), typechecked with `tsc --noEmit`,
  tested with vitest + supertest. Each exports its Express app from `src/app.ts` (`createApp()`) and listens in
  `src/index.ts`, so tests import the app without binding a port.
- All in-memory state lives in one module per service so it can be reset (`POST /__demo/reset`, no auth) for tests
  and demo restarts.
- Error body everywhere: `{ error: { code: string, message: string } }`. Messages are es-CR.
- Every agency call awaits `simulatedLatency()` (env `AGENCY_LATENCY_MS`, default 400) so the UI can show steps.

## Seed data (Registro Civil)

| Cédula | Nombre | Cantón | Password (portal) |
|---|---|---|---|
| `1-2345-6789` | María Fernández Gómez | San José (Montes de Oca) | `demo` |
| `7-0123-0456` | José Alberto Mora Salazar | Talamanca | `demo` |
| `2-0987-0654` | Ana Lucía Chaves Rojas | Alajuela (Grecia) | `demo` |

Citizen shape: see `Citizen`. María: born 1990-05-14, single, address "Barrio Dent, San Pedro, Montes de Oca, San José",
province "San José", canton "Montes de Oca", district "San Pedro", email `maria.fernandez@ejemplo.cr`, phone
`+506 8888-1234`. The other two are the agents' choice, but plausible.

Passwords are checked by `apps/api` (not by Registro Civil): the API holds a `{ cedula → password hash }` map of
demo credentials. The OTP is `DEMO_OTP_CODE` (default `123456`) and is returned to the client as `demoCode` because
there is no real SMS — the UI shows it inside a "SMS simulado" box.

## Agency APIs (bus → agency)

All require `x-api-key`. All return the exact types below.

### Registro Civil — `GET /registro/citizen/:id` → `Citizen`
404 `{ error:{code:"CITIZEN_NOT_FOUND"} }` when unknown. Also `GET /registro/citizens` (list of ids and names, for the demo).

### Tributación — `POST /tributacion/createTaxId` body `createTaxIdSchema` → `TaxResponse`
Idempotent per `(citizenId, businessName)`: a second call returns the same NITE. `taxRegime` is `simplified` when
`businessType === 'natural'`, else `traditional`. `activityDescription` from `findActivity()`; unknown code → 422
`ACTIVITY_UNKNOWN`. Also `GET /tributacion/taxpayers` (list) for the demo.

### CCSS — `POST /ccss/registerEmployer` body `registerEmployerSchema` → `CcssResponse`
`registrationType` is `self-employed` when `estimatedEmployees === 0`, else `employer`. Idempotent per `nite`.
`monthlyContributionRateCrc` is a plausible flat figure (e.g. 26.67 % of a base salary — keep it simple; it's a demo).
Also `GET /ccss/employers`.

### Municipalidad — `POST /municipalidad/issueLicense` body `issueLicenseSchema` → `MunicipalityResponse`
Serves several cantons: at least `Montes de Oca`, `San José`, `Talamanca`, `Grecia`, `Alajuela`. Unknown canton → 422
`MUNICIPALITY_UNKNOWN`. Fee = activity `baseFeeCrc` × canton multiplier. Patente numbers are sequential per year
(`P-2026-00001`, …). `expiryDate` = issue + 1 year. Idempotent per `nite`. Also `GET /municipalidad/licenses`.

## Bus API (api → bus)

Requires `x-api-key: BUS_API_KEY`.

- `POST /bus/request` — body `BusRequest` (validated with `busRequestSchema`). The bus looks up `service` in its
  registry, checks `action` is registered for that service, and forwards `data` (as JSON body for POST, or as the
  `:id` path param for `getCitizen` where `data = { id }`). Returns `BusResponse`: HTTP 200 with `ok:true`, or the
  agency's status (404/422/502…) with `ok:false` and the agency's error code. Consent `granted:false` → 403
  `CONSENT_REQUIRED` and is still audited (status `error`). Every request, success or failure, appends an
  `AuditEntry` — `fieldsReturned` holds the top-level keys of the response, never values.
- `GET /bus/audit?subjectId=&limit=` — newest first, default limit 100.
- `GET /bus/registry` — `RegistryEntry[]` with a live `healthy` flag (the bus pings each agency's `/health`, cached
  for 10 s).
- Registry is data: `services/bus/src/registry.ts` maps service → `{ baseUrl (env), actions: { name → {method, path} } }`.
  Actions: `registro.getCitizen`, `tributacion.createTaxId`, `ccss.registerEmployer`, `municipalidad.issueLicense`.
- Agency unreachable → 502 `AGENCY_UNAVAILABLE`. Per-call timeout 5 s.

## Portal API (web → api)

Cookie-less: the client sends `Authorization: Bearer <token>`. Tokens are HMAC-signed (`SESSION_SECRET`) JSON with
`{ sub: cedula, exp }`, 8 h. All `/api/*` routes except login return 401 `UNAUTHENTICATED` without a valid token.
CORS is enabled for `http://localhost:5173` in dev.

- `POST /api/login` `{ id, password }` → `{ challengeId, otp: { channel:"sms", maskedPhone, demoCode } }`; 401
  `INVALID_CREDENTIALS`.
- `POST /api/login/otp` `{ challengeId, code }` → `{ token, citizen: Citizen, provenance: { source:"registro", exchangeId, fetchedAt } }`.
  The citizen is fetched from the bus here (FR-3). 401 `INVALID_OTP`; 410 `CHALLENGE_EXPIRED` (5 min).
- `POST /api/logout` → 204.
- `GET /api/profile` → `{ citizen, provenance }` (fresh bus call, consent purpose "Mostrar perfil").
- `GET /api/services` → life-event catalogue: `[{ id:"start-business", title:"Iniciar un negocio", titleEn, description, available:true, agencies:[...] }, …]`
  with 3–4 more life events marked `available:false` (e.g. "Registrar un recién nacido", "Cambiar de domicilio",
  "Renovar licencia de conducir"). Data-driven from `apps/api/src/services-catalogue.ts`.
- `GET /api/activities` → `ACTIVITIES` from shared.
- `POST /api/business/register` body `businessRegistrationSchema` (client sends `citizenId` = the logged-in cédula;
  server overrides it from the token anyway) plus `consent: true` → 202 `{ txnId }`. 400 `CONSENT_REQUIRED` if not.
  Runs the workflow asynchronously (in-process, `setImmediate`) with steps in order: registro (`getCitizen`,
  re-validates identity) → tributacion → ccss → municipalidad. The `municipality` sent to the municipal mock is the
  citizen's `canton` from Registro Civil unless the citizen chose another one in the form. Each step is a bus
  request with `requester:"portal-ciudadano"`, `subjectId` = cédula, `consent:{ granted:true, reference:txnId }`.
  A step failure marks the transaction `failed` and stops.
- `GET /api/business/status/:txnId` → `WorkflowTransaction` (without `result` until completed). 404 if unknown or
  not owned by the caller.
- `GET /api/business/result/:txnId` → `WorkflowTransaction` with `result` (409 `NOT_COMPLETED` if still running).
  `result.onceOnly` lists every field that the citizen did not type: fullName, id, dateOfBirth, address, canton,
  nationality (source registro); nite, taxRegime (tributacion); employerNumber (ccss); patenteNumber (municipalidad).
  `result.benefits` comes from env `BENEFIT_*`.
- `GET /api/business/result/:txnId/pdf` → `application/pdf`, filename `PuraVidaGov-<txnId>.pdf`. Generated with
  `pdfkit`: title, DEMO disclaimer, citizen block, business block, one section per agency with its numbers, benefits,
  and the list of exchange ids (audit references). Spanish.
- `GET /api/audit` → `AuditEntry[]` for the logged-in citizen (proxy of `/bus/audit?subjectId=`).
- `GET /api/registry` → proxy of `/bus/registry` (for the architecture panel).
- `GET /api/benefits` → `Benefits`.

## Frontend routes (`apps/web`)

`/login` → `/` (dashboard: greeting, profile card with provenance badges, life-event cards, "Mis datos compartidos"
link) → `/negocio/nuevo` (consent notice + form; personal data read-only with source badges; business fields) →
`/negocio/:txnId` (live step tracker polling `status` every 700 ms, then result: numbers, once-only dashboard,
benefits panel, PDF button) → `/auditoria` (audit viewer) → `/arquitectura` (registry + how it works diagram).
Persistent top banner: "DEMOSTRACIÓN — datos ficticios. No es un sistema del Gobierno de Costa Rica."
All copy es-CR; English via `title` tooltips on headings and key labels (small ⓘ glyph).

## Demo reset

`POST /api/__demo/reset` (no auth in demo) resets the API's transactions and asks the bus to reset itself and every
agency (`POST /__demo/reset` cascade). Seed citizens are recreated. Used by `scripts/e2e.mjs`.

---

# v2 — life-event workflows, new agencies, legal status

v2 generalises the single business-registration flow into a data-driven workflow engine with four implemented
life events and three more agencies. Everything in v1 above still holds unless restated here.

## New agencies

| Package | Name | Dev port | Docker | Key env |
|---|---|---|---|---|
| `services/registro-nacional` | Registro Nacional (propiedades, personas jurídicas) | 4005 | `registro-nacional` | `REGISTRO_NACIONAL_URL/_API_KEY` (`demo-registro-nacional-key`) |
| `services/salud` | Ministerio de Salud (PSF, vacunación) | 4006 | `salud` | `SALUD_URL/_API_KEY` (`demo-salud-key`) |
| `services/cfia` | CFIA / plataforma APC (revisión de planos) | 4007 | `cfia` | `CFIA_URL/_API_KEY` (`demo-cfia-key`) |

`AgencyName` gains `'registro-nacional' | 'salud' | 'cfia'` (shared/types.ts). All v1 rules apply (createServiceApp,
`/health`, `x-api-key`, `POST /__demo/reset`, `simulatedLatency()`, `{ error:{code,message} }`).

### Registro Nacional
- `GET /registro-nacional/properties?ownerId=<cédula>` → `Property[]` (may be empty). Seed: María owns
  `1-123456-000` (Montes de Oca, residencial, 250 m², clean) and `1-654321-000` (Montes de Oca, comercial, 400 m², one
  encumbrance "Hipoteca Banco Nacional"); José owns `7-045678-000` (Talamanca, mixto, 1 200 m², clean); Ana owns
  `2-111222-000` (Grecia, residencial, 300 m², clean).
- `GET /registro-nacional/property/:folio` → `Property`; 404 `PROPERTY_NOT_FOUND`.
- `POST /registro-nacional/registerCompany` body `registerCompanySchema` → `CompanyResponse` (`cedulaJuridica`
  `3-101-NNNNNN`, `tomo` like `2026-123456-1-1`). Idempotent per `(citizenId, legalName)`. List: `GET /registro-nacional/companies`.

### Ministerio de Salud
- `POST /salud/issueSanitaryPermit` body `issueSanitaryPermitSchema` → `SanitaryPermitResponse`. Risk group from
  activity: 5610/5510 → B, 4711/9602/7911/6201 → C (declaración jurada), 4923/0111 → A. Expiry: C 5 years, B 3, A 1.
  Idempotent per `taxId`. Unknown activity → 422 `ACTIVITY_UNKNOWN`. List `GET /salud/permits`.
- `POST /salud/openVaccinationRecord` body `openVaccinationRecordSchema` → `VaccinationRecordResponse`
  (`recordNumber` `CNV-<year>-NNNNNN`, `scheme` "Esquema nacional de vacunación (CNVE)", `firstAppointment` = birth
  date + 2 months). Idempotent per `childId`. List `GET /salud/vaccination`.

### CFIA (APC)
- `POST /cfia/reviewPlans` body `reviewPlansSchema` → `PlanReviewResponse`: `apcNumber` `APC-<year>-NNNNNN`,
  `reviews` for Ministerio de Salud, Bomberos, AyA, INVU (all `aprobado` in the demo; `reference` like `MS-…`,
  `BOM-…`), `approvedAreaM2` = areaM2, `cfiaFeeCrc` = 0.265 % of declaredValueCrc (rounded). Unknown
  `professionalLicence` (not in the seed list `IC-12345`, `A-23456`, `IE-34567`) → 422 `PROFESSIONAL_UNKNOWN`.
  Idempotent per `(folio, professionalLicence)`. List `GET /cfia/reviews`. Also `GET /cfia/professionals` →
  `[{ licence, name, discipline }]`.

### New actions on existing agencies
- Registro Civil: `POST /registro/registerBirth` body `registerBirthSchema` → `BirthRegistrationResponse` (the minor's
  cédula is `<province digit of parent>-<4 random>-<4 random>`, `certificateNumber` `NAC-<year>-NNNNNN`); the minor is
  added to the citizen store (so `GET /registro/citizen/:id` finds them, canton = parent's). Idempotent per
  `(parentId, childFirstName, birthDate)`. `POST /registro/updateAddress` body `updateAddressSchema` →
  `AddressUpdateResponse` (`registry: "Registro Civil (domicilio electoral)"`) and actually updates the citizen record.
- Tributación: `POST /tributacion/updateAddress` → `AddressUpdateResponse` (`registry: "Tributación (domicilio fiscal)"`).
- CCSS: `POST /ccss/insureDependent` body `insureDependentSchema` → `DependentInsuranceResponse` (`beneficiaryNumber`
  `B-NNNNNNN`, `edusId` `EDUS-NNNNNNN`, `coveredFrom` = birthDate). Idempotent per `dependentId`.
  `POST /ccss/updateAddress` → `AddressUpdateResponse` (`registry: "CCSS (SICERE)"`).
- Municipalidad: `POST /municipalidad/issueLandUse` body `issueLandUseSchema` → `LandUseResponse` (`certificateNumber`
  `US-<year>-NNNNN`, `allowedUse` from landUse+projectType, e.g. "Residencial: vivienda unifamiliar"); 422
  `MUNICIPALITY_UNKNOWN`; 422 `LAND_USE_INCOMPATIBLE` when landUse is `agricola` and projectType is `comercial`.
  `POST /municipalidad/issueBuildingPermit` body `issueBuildingPermitSchema` → `BuildingPermitResponse` (`permitNumber`
  `PC-<year>-NNNNN`, `taxCrc` = 1 % of declaredValueCrc, expiry = issue + 1 year). Idempotent per `apcNumber`.
  `POST /municipalidad/updateAddress` → `AddressUpdateResponse` (`registry: "Municipalidad (contribuyente)"`).

### Bus registry additions
`registro.registerBirth`, `registro.updateAddress`, `tributacion.updateAddress`, `ccss.insureDependent`,
`ccss.updateAddress`, `municipalidad.issueLandUse`, `municipalidad.issueBuildingPermit`, `municipalidad.updateAddress`,
`registro-nacional.listProperties` (GET `/registro-nacional/properties?ownerId=` — the bus maps `data.ownerId` to the
query string), `registro-nacional.getProperty` (GET `/registro-nacional/property/:folio`, `data.folio`),
`registro-nacional.registerCompany`, `salud.issueSanitaryPermit`, `salud.openVaccinationRecord`, `cfia.reviewPlans`.
The registry entry for a GET action may declare `query: ['ownerId']` and/or a `:param` in the path; the router fills
both from `data` (`RegistryEntry.actions[name].query?: string[]`). `busRequestSchema.service` accepts all seven agencies.

## Workflow engine (apps/api)

- Definitions live in `apps/api/src/workflows/<id>.ts` and are registered in `apps/api/src/workflows/index.ts`. Each
  is a `WorkflowSpec` (`apps/api/src/workflows/types.ts`): the public `WorkflowDefinition` (shared types) plus
  functions: `inputSchema` (zod), per-step `when?(ctx)` and `data(ctx)`, and `result(ctx)` returning headline, summary,
  cards and onceOnly. `ctx = { citizen, input, results (by step id), exchangeIds (by step id) }`.
- The engine always runs an implicit first step `identidad` (`registro.getCitizen`) and stores the citizen in `ctx`;
  its legal note is the standard identity note (`IDENTITY_LEGAL` in the engine). Steps whose `when(ctx)` is false are
  recorded with `status:'done', skipped:true`.
- Benefits: the spec's `benefits`, overridden by env for `start-business` only (`BENEFIT_*`, PRD FR-20).
- Implemented workflows: `start-business`, `newborn`, `construction`, `move`. Catalogue entries `driver-license` and
  `pension` stay `available:false` but still carry a `legal` note and empty `fields`/`steps`.

### Portal API (v2 routes; v1 `/api/business/*` and `/api/services` are removed)
- `GET /api/workflows` → `WorkflowDefinition[]` (public part of every spec, available or not).
- `GET /api/workflows/:id` → `WorkflowDefinition`; 404 `WORKFLOW_NOT_FOUND`.
- `GET /api/options/:source` (auth) → `FormOption[]`. Sources: `activities` (from shared, label
  `"5610 · Restaurantes…"`), `cantons` (static list of 12 cantons matching the municipal mock), `hospitals` (static:
  Hospital Calderón Guardia, Hospital México, Hospital San Juan de Dios, Hospital de las Mujeres, Hospital Tony Facio
  (Limón), Hospital San Rafael de Alajuela), `professionals` (via bus `cfia` `GET /cfia/professionals` is NOT a bus
  action — keep a static copy in the API), `properties` (bus `registro-nacional.listProperties` for the logged-in
  cédula, purpose "Listar propiedades de la persona", label `"1-123456-000 · Montes de Oca · 250 m² · residencial"`,
  value = folio). 404 `OPTIONS_UNKNOWN`.
- `POST /api/workflows/:id/start` body `{ input: {...}, consent: true }` → 202 `{ txnId }`; 400 `CONSENT_REQUIRED`;
  400 `VALIDATION_ERROR` (zod flatten in `details`); 404; 409 `WORKFLOW_UNAVAILABLE` when `available:false`.
- `GET /api/transactions` → the caller's transactions, newest first (`WorkflowTransaction` without `result`).
- `GET /api/transactions/:txnId` → status view (no `result`); 404 `TXN_NOT_FOUND`.
- `GET /api/transactions/:txnId/result` → full transaction; 409 `NOT_COMPLETED`; 422 `FAILED`.
- `GET /api/transactions/:txnId/pdf` → generic PDF from `result.cards` (letter, Spanish, DEMO box, legal-status line
  per step, audit references). Filename `PuraVidaGov-<txnId>.pdf`.
- `GET /api/legal` → `{ refs: LegalRef[], workflows: [{ id, title, legal, steps:[{ id, label, agency, legal }] }] }`.
- Unchanged: login/otp/logout, profile, activities, audit, registry, benefits, `__demo/reset`.

### Frontend routes (v2)
`/` dashboard (cards for every workflow with a legal-status badge; "Iniciar" when available) · `/tramite/:id`
(generic form rendered from `fields`, consent box with the workflow's `consentText`, personal data read-only with
provenance) · `/tramite/:id/:txnId` (generic tracker + result: cards, once-only table, benefits, PDF, and a "¿Se puede
hoy?" panel per step) · `/mis-tramites` (list) · `/auditoria` · `/arquitectura` · `/marco-legal` (matrix of
`LEGAL_REFS` by jurisdiction + per-workflow status table) · `/por-que` (the case for government: content in
`apps/web/src/content/case.ts`). Old `/negocio/*` routes redirect to `/tramite/start-business`.

---

# v3 — job loss, retirement, licence renewal; public case pages

## New agencies

| Package | Name | Dev port | Docker | Key env |
|---|---|---|---|---|
| `services/supen` | Operadora de pensiones (ROP/FCL bajo SUPEN) | 4008 | `supen` | `SUPEN_URL/_API_KEY` (`demo-supen-key`) |
| `services/mtss` | Ministerio de Trabajo (Agencia Nacional de Empleo) | 4009 | `mtss` | `MTSS_URL/_API_KEY` (`demo-mtss-key`) |
| `services/cosevi` | COSEVI (MOPT): licencias, multas | 4010 | `cosevi` | `COSEVI_URL/_API_KEY` (`demo-cosevi-key`) |

`AgencyName` gains `'supen' | 'mtss' | 'cosevi'`. All v1/v2 rules apply.

### CCSS — new actions
- `GET /ccss/employment/:citizenId` → `EmploymentRecord`; 404 `EMPLOYMENT_NOT_FOUND`. Seed: María — employer
  "Consultores Tica S.A." (`E-30001`), start 2015-03-01, `endDate` 2026-08-31, `status:'cesado'`, last salary
  ₡950 000, 138 contributions; José — "Hotel Cahuita Ltda." (`E-30002`), start 1990-06-01, no endDate, `activo`,
  salary ₡720 000, 434 contributions; Ana — "Café Grecia S.A." (`E-30003`), start 2020-01-15, activo, ₡610 000,
  80 contributions.
- `POST /ccss/applyPension` body `applyPensionSchema` → `PensionApplicationResponse`. Rules (demo simplification of
  IVM): `contributions >= 300` and age ≥ 65 (or ≥ 62 with ≥ 360 for `anticipada`) → `aprobada`, else `en-estudio`;
  `monthlyPensionCrc` = 60 % of last salary (rounded to hundreds); `firstPaymentDate` = first day of next month.
  Idempotent per `citizenId`. 404 if no employment record. Note: the seed makes José the only one who qualifies
  (born 1984 → he does NOT; fix: make José born **1961-06-01** in the Registro Civil seed so he is 65 — Registro
  Civil agent: change José's `dateOfBirth` to `1961-06-01`). María (born 1990) → `en-estudio`.
- `POST /ccss/enrollVoluntary` body `enrollVoluntarySchema` → `VoluntaryInsuranceResponse`; premium = max(₡25 000,
  round(declaredIncome × 0.1233)); `coveredFrom` = today. Idempotent per `citizenId`.

### Operadora (SUPEN)
- `POST /supen/withdrawFcl` body `withdrawFclSchema` → `FclWithdrawalResponse`: `balanceCrc` = round(lastSalary × 1.5 %
  × months worked) — the operator has its own table keyed by cédula (seed María ₡1 250 000, José ₡3 900 000, Ana
  ₡480 000); `paymentDate` = today + 15 days (Ley 7983 art. 6); `operator` "Operadora Demo de Pensiones". Idempotent per
  `(citizenId, terminationDate)`.
- `POST /supen/ropStatement` body `ropStatementSchema` → `RopStatementResponse`: balances seed María ₡8 400 000,
  José ₡31 200 000, Ana ₡2 100 000; `monthlyPaymentCrc` = balance / 240 for retiro-programado, / 300 for
  renta-permanente; `firstPaymentDate` = first day of next month. Idempotent per `citizenId`.

### MTSS (ANE)
- `POST /mtss/registerJobSeeker` body `registerJobSeekerSchema` → `JobSeekerResponse`: `platform`
  "Agencia Nacional de Empleo (ane.cr)", `trainingOffer` chosen from a small table by `desiredArea` keyword
  (software → "INA: Desarrollo web full stack", turismo → "INA: Guía de turismo local", default → "INA: Habilidades
  digitales básicas"), `firstAppointment` = today + 7 days. Idempotent per `citizenId`.

### COSEVI
- `POST /cosevi/checkFines` body `checkFinesSchema` → `FinesCheckResponse`: seed María 0 fines, marchamo paid;
  José 1 fine ₡55 000, marchamo paid; Ana 0, marchamo NOT paid.
- `POST /cosevi/renewLicence` body `renewLicenceSchema` → `LicenceRenewalResponse`: `licenceNumber` = cédula,
  `expiryDate` = today + validityYears, `points` 12, `feeCrc` = 5 000 × validityYears + 5 000. 422
  `PENDING_FINES` when the citizen has pending fines (COSEVI checks its own table); 422 `MARCHAMO_UNPAID` when the
  marchamo is unpaid. Idempotent per `citizenId`.
- Also `GET /cosevi/licences`.

### Salud — new action
- `POST /salud/medicalCertificate` body `medicalCertificateSchema` → `MedicalCertificateResponse` (SEDIMEC simulated
  under the Ministerio de Salud mock for the demo; in reality the Colegio de Médicos runs it): `result` `apto`, or
  `apto-con-restricciones` with `restrictions: ['Uso de lentes']` when `usesGlasses`; `validUntil` = today + 180 days.
  Idempotent per `citizenId` for 180 days.

### Bus registry additions
`ccss.getEmployment` (GET `/ccss/employment/:citizenId`, `data.citizenId`), `ccss.applyPension`, `ccss.enrollVoluntary`,
`supen.withdrawFcl`, `supen.ropStatement`, `mtss.registerJobSeeker`, `cosevi.checkFines`, `cosevi.renewLicence`,
`salud.medicalCertificate`.

## Workflows
`job-loss` ("Perdí el empleo"), `retirement` ("Me jubilo"), `driver-license` ("Renovar licencia de conducir") become
`available:true` specs in `apps/api/src/workflows/`. `pension` is renamed `retirement` (id change; the old id is gone).

## Public pages (no login)
- API: `GET /api/registry`, `GET /api/benefits` and `GET /api/activities` become public (no `requireAuth`), like
  `/api/workflows` and `/api/legal` already are. Everything about a citizen stays behind auth.
- Web: `/por-que`, `/marco-legal` and `/arquitectura` render without a session. An anonymous visitor landing on `/`
  is sent to `/por-que` (not `/login`); the layout for anonymous visitors shows nav "Por qué · Marco legal · Cómo
  funciona" and a primary button "Probar el demo" → `/login`. Logged-in users keep the full nav. `/por-que` ends with
  a CTA card "Pruebe el demo como María" → `/login`.

---

# v4 — deployment targets (free tier), alongside the existing Compose stack

Three ways to run the same code. **`infra/docker-compose.yml` does not change**: twelve containers stay the
reference architecture for local demos and CI, because separate containers are what makes the "institutions are
independent, the bus is the only link" claim visible.

| Target | What runs | Where it is free | Cold start |
|---|---|---|---|
| **Compose** (unchanged) | 10 agencies + bus + API + web + Caddy, one container each | local / any VM | none |
| **All-in-one container** | the same 12 Express apps in ONE Node process + the built SPA, one port | Render / Koyeb / Fly free plans | 30–60 s on free plans that sleep |
| **Static** | the public pages only (`/por-que`, `/marco-legal`, `/arquitectura`), no backend | Cloudflare Pages / Netlify / GitHub Pages | none |

## All-in-one server — `scripts/serve-all.mjs`

Run with `npx tsx scripts/serve-all.mjs`. One Node process that:

1. Sets internal defaults before importing anything: `BUS_URL=http://127.0.0.1:4000`,
   `REGISTRO_URL=http://127.0.0.1:4001` … `COSEVI_URL=http://127.0.0.1:4010` (only when not already set), so the
   bus→agency and API→bus hops stay real HTTP calls and the audit log is unchanged.
2. Imports each service's `createApp()` and calls `app.listen(port, '127.0.0.1')` for the ten agencies (4001–4010)
   and the bus (4000). These bind to loopback only and are never exposed.
3. Builds the API app with `createApp()` from `apps/api` and mounts it (`front.use(apiApp)`) — no extra proxy hop.
4. Serves `apps/web/dist` as static files with an SPA fallback to `index.html` for any non-`/api` path.
5. Listens on `process.env.PORT` (default 8080) on `0.0.0.0`. This is the only exposed port.

Env: `PORT`; `INTERNAL_PORT_BASE` (default 4000) shifts the loopback ports so the script can run next to
`npm run dev`; everything else is the usual `.env` (`SESSION_SECRET`, `BENEFIT_*`, `AGENCY_LATENCY_MS`, …).
`CORS_ORIGIN` is irrelevant here (same origin) but harmless.

`GET /healthz` on the front app returns `{ status:"ok", mode:"all-in-one", agencies:<n> }` after every internal
app is listening — free-tier health checks point at it.

Script entry: `npm start` at the repo root.

## All-in-one image — `infra/Dockerfile.allinone`

Multi-stage: install workspace deps, `npm run build -w @pvg/web`, then run `npx tsx scripts/serve-all.mjs`.
Exposes `8080`, runs as `node`, honours `PORT`. `render.yaml` at the repo root is a Render blueprint using it
(free plan, Docker env, health check `/healthz`); `docs/DEPLOY.md` covers Koyeb and Fly with the same image.

## Static build — `npm run build:static`

`vite build` with `VITE_DEPLOY_MODE=static` (and optional `VITE_PORTAL_URL=<url of the all-in-one deployment>`),
then `node scripts/build-static-api.mjs` writes `apps/web/dist/api-static/*.json` and `apps/web/dist/_redirects`.

- Generated files: `workflows.json` (from `listDefinitions()` in `apps/api/src/workflows/index.ts`),
  `legal.json` (same shape as `GET /api/legal`), `registry.json` (one `RegistryEntry` per agency with the
  compose-internal `baseUrl` and **no `healthy` field**), `benefits.json`, `activities.json`.
- `_redirects` contains `/*  /index.html  200` for SPA routing on Pages/Netlify.

### Static mode in `apps/web`
The single seam is `request<T>(path)` in `apps/web/src/api.ts`. When `import.meta.env.VITE_DEPLOY_MODE === 'static'`:
- `/workflows` → `fetch('/api-static/workflows.json')`; `/workflows/:id` is resolved from that list client-side;
  `/legal`, `/registry`, `/benefits`, `/activities` map to their JSON files.
- Any other path (login, options, transactions, PDF, audit) rejects with an `ApiError` code `STATIC_MODE`.
- `Architecture` renders an entry with `healthy === undefined` as neutral ("estado no disponible"), never "DOWN".
- Every "Probar el demo" / login link points at `VITE_PORTAL_URL` when set (target `_blank`), otherwise `/login`.
  With `VITE_DEPLOY_MODE=static` and no `VITE_PORTAL_URL`, those links are replaced by a short line saying the
  interactive portal is not deployed.
- `/login` and the guarded routes still exist in static mode but show one card: the demo runs elsewhere, with the
  link. Nothing must throw an unhandled error or spin forever.

The default (unset `VITE_DEPLOY_MODE`) is unchanged: relative `/api/...` against a real backend.

---

# v5 — death of a relative, vehicle purchase, home purchase, marriage, school enrolment

Five more life events chosen because Gosuslugi, the Nordic portals, Estonia and LifeSG all bundle them and Costa
Ricans lose the most time on them (`docs/research/life-events-abroad.md`, `docs/research/legal-cr-life-events-2.md`).

## New agencies

| Package | Name | Dev port | Docker | Key env |
|---|---|---|---|---|
| `services/ins` | INS: marchamo (derechos de circulación) y SOA | 4011 | `ins` | `INS_URL/_API_KEY` (`demo-ins-key`) |
| `services/mep` | Ministerio de Educación Pública: matrícula | 4012 | `mep` | `MEP_URL/_API_KEY` (`demo-mep-key`) |
| `services/imas` | IMAS: becas Crecemos/Avancemos vía SINIRUBE | 4013 | `imas` | `IMAS_URL/_API_KEY` (`demo-imas-key`) |

`AgencyName` gains `'ins' | 'mep' | 'imas'`. All v1–v3 rules apply.

## Seed changes (Registro Civil)

`Citizen` gains optional `spouseId`, `children`, `deceased`. Seed:
- María `1-2345-6789`: `children: ['1-9999-0001']`.
- New minor **Lucas Fernández Gómez** `1-9999-0001`, born 2020-03-10, single, same address/canton as María, email/phone
  empty strings, no password (cannot log in).
- New citizen **Diego Alonso Solano Vega** `1-1111-2222`, born 1988-07-22, single, address "Curridabat centro, 50 m
  este del parque", province San José, canton Curridabat, district Curridabat; password `demo`.
- New couple: **Rosa María Brenes Castro** `7-0111-0222`, born 1963-02-14, married, `spouseId: '7-0100-0300'`, address
  "Cahuita centro, frente a la plaza", Limón / Talamanca / Cahuita, phone `+506 8555-1122`, password `demo`; and
  **Luis Ángel Vargas Mora** `7-0100-0300`, born 1958-09-30, married, `spouseId: '7-0111-0222'`, same address, no
  password. Luis has a CCSS employment record (employer "Cooperativa de Cacao Talamanca R.L." `E-30004`, start
  1985-01-15, activo, salary ₡680 000, 480 contributions), SUPEN balances ROP ₡28 000 000 / FCL ₡2 600 000, a
  Registro Nacional property `7-077888-000` (Talamanca, mixto, 2 000 m², clean) and a vehicle `LAV-777`.
- New actions: `POST /registro/registerDeath` body `registerDeathSchema` → `DeathRegistrationResponse`
  (`certificateNumber` `DEF-<year>-NNNNNN`, `medicalCertificate` `SEDIMEC-DEF-NNNNNN`); marks the citizen
  `deceased`; 404 `CITIZEN_NOT_FOUND`; 409 `ALREADY_DECEASED`; idempotent per deceasedId (returns the same certificate).
  `POST /registro/registerMarriage` body `registerMarriageSchema` → `MarriageRegistrationResponse` (`MAT-<year>-NNNNNN`);
  both must be alive and not married → 409 `ALREADY_MARRIED`; sets both `maritalStatus:'married'` and `spouseId`.
  Idempotent per sorted pair. `GET /registro/dependants/:id` → `{ spouse?: Citizen, children: Citizen[] }`.

## Registro Nacional additions
- Vehicle store (`Vehicle`): seed `BCR-123` owner Ana `2-0987-0654` (Toyota Yaris 2019, fiscal ₡7 500 000, clean);
  `SJB-456` owner José `7-0123-0456` (Hyundai Tucson 2021, fiscal ₡14 000 000, encumbrance "Prenda Banco Popular");
  `LAV-777` owner Luis `7-0100-0300` (Nissan Frontier 2015, fiscal ₡6 200 000, clean).
- `GET /registro-nacional/vehicle/:plate` → `Vehicle`; 404 `VEHICLE_NOT_FOUND`. `GET /registro-nacional/vehicles?ownerId=`.
- `POST /registro-nacional/transferVehicle` body `transferVehicleSchema` → `VehicleTransferResponse`
  (`BM-<year>-NNNNNN`); 409 `SELLER_MISMATCH` if sellerId ≠ owner; 422 `ENCUMBERED` if encumbrances non-empty;
  updates owner. Idempotent per `(plate, taxReceipt)`.
- `POST /registro-nacional/transferProperty` body `transferPropertySchema` → `PropertyTransferResponse`
  (`BI-<year>-NNNNNN`); same rules on owner/encumbrances; updates owner. Idempotent per `(folio, taxReceipt)`.
- `POST /registro-nacional/listEstate` body `listEstateSchema` → `EstateResponse` for the deceased's properties,
  vehicles and companies, annotation "Sucesión abierta — certificado <deathCertificate>".

## Other new actions
- Tributación: `POST /tributacion/transferTax` body `transferTaxSchema` → `TransferTaxResponse`: base = max(price,
  fiscal); rate 2.5 % for `vehiculo` (Ley 7088 art. 13 — rate secondary-source), 1.5 % for `inmueble` (Ley 6999);
  stamps = 0.5 % of base rounded; idempotent per `(kind, reference, buyerId)`. `POST /tributacion/updateCivilStatus`
  body `updateCivilStatusSchema` → `CivilStatusUpdateResponse` (`registry: "Tributación (RUT)"`).
- CCSS: `POST /ccss/survivorPension` body `survivorPensionSchema` → `SurvivorPensionResponse`: needs the deceased's
  employment record (404 `EMPLOYMENT_NOT_FOUND`); `conyuge` → 70 % of the deceased's IVM pension estimate (60 % of last
  salary), `hijo` → 30 %; `aprobada` if the deceased had ≥ 180 contributions, else `en-estudio`; first payment next
  month. Idempotent per `(survivorId, deceasedId)`.
- SUPEN: `POST /supen/beneficiaryPayout` body `beneficiaryPayoutSchema` → `BeneficiaryPayoutResponse` (ROP + FCL
  balances of the deceased from the seed table; 404 `AFFILIATE_NOT_FOUND`; payment today + 15 days). Idempotent per deceasedId.
- COSEVI: `POST /cosevi/checkVehicleFines` body `checkVehicleFinesSchema` → `VehicleFinesResponse` (seed: `SJB-456`
  1 fine ₡55 000; others clean).
- INS: `POST /ins/marchamoStatus` body `marchamoStatusSchema` → `MarchamoStatusResponse` (seed: all paid for the
  current year; `amountCrc` = 3 % of fiscal value from a plate→value table: BCR-123 ₡225 000, SJB-456 ₡420 000,
  LAV-777 ₡186 000; `soaPolicy` `SOA-<year>-NNNNNN`). Unknown plate → 404 `VEHICLE_NOT_FOUND`. `GET /ins/policies`.
- Municipalidad: `POST /municipalidad/declareProperty` body `declarePropertySchema` → `PropertyDeclarationResponse`
  (`DBI-<year>-NNNNN`, tax 0.25 % of declared value, valid 5 years); 422 `MUNICIPALITY_UNKNOWN`. Idempotent per `(folio, citizenId)`.
- MEP: `POST /mep/enrolStudent` body `enrolStudentSchema` → `SchoolEnrolmentResponse`; schools table (name, canton,
  circuit): "Escuela Roosevelt" (Montes de Oca, 01), "Escuela Dante Alighieri" (Montes de Oca, 01), "Escuela José
  Figueres Ferrer" (Curridabat, 02), "Escuela Líder de Cahuita" (Talamanca, 07), "Escuela Central de Grecia" (Grecia,
  03); unknown school → 422 `SCHOOL_UNKNOWN`; age rule: `materno` ≥ 4, `transicion` ≥ 5, `primero` ≥ 6, `septimo` ≥ 12
  by 15 Feb of next year else 422 `AGE_RULE`; `services` = ["Comedor (PANEA)"] plus "Transporte estudiantil" when
  `needsTransport`; `startDate` = next 1 Feb. Idempotent per `studentId`. `GET /mep/schools`, `GET /mep/enrolments`.
- IMAS: `POST /imas/applyScholarship` body `applyScholarshipSchema` → `ScholarshipResponse`: per-capita income =
  income / size; eligible if per-capita < ₡130 000 (demo poverty line); programme `Crecemos` for materno/transición/
  primero, `Avancemos` for séptimo; amount ₡25 000 (Crecemos) / ₡40 000 (Avancemos) when eligible else 0; `basis`
  text mentions SINIRUBE. Idempotent per `studentId`. `GET /imas/applications`.

## Bus registry additions
`registro.registerDeath`, `registro.registerMarriage`, `registro.getDependants` (GET `/registro/dependants/:id`),
`registro-nacional.getVehicle` (GET `/registro-nacional/vehicle/:plate`), `registro-nacional.listVehicles` (GET, query
`ownerId`), `registro-nacional.transferVehicle`, `registro-nacional.transferProperty`, `registro-nacional.listEstate`,
`tributacion.transferTax`, `tributacion.updateCivilStatus`, `ccss.survivorPension`, `supen.beneficiaryPayout`,
`cosevi.checkVehicleFines`, `ins.marchamoStatus`, `municipalidad.declareProperty`, `mep.enrolStudent`, `imas.applyScholarship`.

## Workflows (apps/api)
`bereavement` ("Falleció mi cónyuge", run as Rosa), `vehicle-purchase` ("Compré un carro"), `home-purchase`
("Compré una casa"), `marriage` ("Me caso"), `school-enrolment` ("Mi hijo entra a la escuela"). New option sources:
`children` (bus `registro.getDependants` for the caller → the children), `schools` (static copy of the MEP table),
`grades`, `vehicles-for-sale` (static: BCR-123, LAV-777 with labels), `properties-for-sale` (static: 2-111222-000,
7-077888-000). Demo logins gain Rosa `7-0111-0222` and Diego `1-1111-2222` (password `demo`).
