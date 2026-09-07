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
