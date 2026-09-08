# PuraVidaGov — gobierno digital centrado en la persona (prueba de concepto)

> **DEMOSTRACIÓN — datos ficticios.** This is not a system of the Government of Costa Rica. Every citizen, number
> and institution response is simulated. Nothing is persisted.

PuraVidaGov shows what a Costa Rican e-government built around **one digital identity**, the **once-only
principle** and an **interoperability bus** (X-Road style) could feel like. Twelve life events run end to end across
thirteen simulated institutions (Registro Civil, Registro Nacional, Tributación, CCSS, Municipalidad, Ministerio de
Salud, CFIA/APC, operadora de pensiones/SUPEN, MTSS, COSEVI, INS, MEP, IMAS): *Iniciar un negocio*, *Tuve un hijo*,
*Voy a construir*, *Cambié de domicilio*, *Perdí el empleo*, *Me jubilo*, *Renovar licencia de conducir*, *Falleció mi
cónyuge*, *Compré un carro*, *Compré una casa*, *Me caso* and *Mi hijo entra a la escuela*. María logs in with her
cédula and a simulated firma digital, her data arrives from the registries, she types only what the State does not
already know, and in seconds the institutions answer. She downloads a PDF, sees how much time and money the
electronic process saved, and can inspect every data exchange made on her behalf.

**Every step says whether it can be done in Costa Rica today.** Each workflow and each institutional step carries a
legal note: *Posible hoy*, *Parcialmente hoy* or *Requiere ley*, with the Costa Rican basis (Ley 8220, 8454, 8968,
9943, 9986, Decreto 36550…) and the foreign instrument that closes the gap (Estonia's Public Information Act and
X-Road regulation, Singapore's PSGA, eIDAS 2, the EU once-only system, Uruguay, Brazil). The `/marco-legal` page
shows the matrix; `/por-que` makes the case for government support, including a digital-dividend rule and a savings
calculator. **`/por-que`, `/marco-legal` and `/arquitectura` are public**: no login, so the argument can be shared with
legislators and press directly; the portal itself stays behind the simulated firma digital. Research with sources:
`docs/LEGAL.md`, `docs/CASE.md`, `docs/research/`.

Documents: [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Contracts (binding interfaces)](docs/CONTRACTS.md) ·
[Legal status](docs/LEGAL.md) · [The case](docs/CASE.md) · [Decisions](docs/DECISIONS.md) · [Demo script](docs/DEMO.md) ·
[Conventions](CLAUDE.md)

## Run it

**With Docker (one command, PRD §13):**

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build
```

| What | URL |
|---|---|
| Portal ciudadano (HTTPS, self-signed) | https://localhost:8443 |
| Portal ciudadano (HTTP) | http://localhost:3000 |
| Backend / orquestador | http://localhost:3001/api/registry |
| Bus de interoperabilidad | http://localhost:4000/health · `/bus/registry` (needs `x-api-key`) |
| Agencies | http://localhost:4001–4013/health |

**Without Docker (Node 22):**

```bash
npm install
npm run dev          # six services + Vite on http://localhost:5173
```

**Demo login:** cédula `1-2345-6789`, contraseña `demo`, código `123456` (shown on screen — there is no SMS).
Other citizens: `7-0123-0456` (José, Talamanca, born 1961: use him for *Me jubilo*), `7-0111-0222` (Rosa, Cahuita: use
her for *Falleció mi cónyuge*), `1-1111-2222` (Diego, María's fiancé), `2-0987-0654` (Ana, Grecia).

## Verify

```bash
npm run typecheck && npm test        # unit tests per package (vitest + supertest)
npm run e2e                          # boots all services and runs the journey (13 trámites, three citizens) over HTTP, twice
npm run smoke -- http://localhost:3001   # same journey against a running stack (Docker)
```

CI (`.github/workflows/ci.yml`) runs typecheck, unit tests, the web build, the e2e journey, then builds the
Compose stack and smokes it.

## How it is built

```
apps/web        React + Vite + Tailwind SPA (es-CR, English tooltips). Talks only to /api.
apps/api        Express: login + OTP, signed session tokens, data-driven workflow engine (apps/api/src/workflows),
                once-only provenance, legal notes per step, generic PDF.
services/bus    Interoperability bus: data-driven registry, per-agency API keys, timeouts, append-only audit log.
services/*      Registro Civil · Tributación · CCSS · Municipalidad · Registro Nacional · Salud · CFIA · SUPEN · MTSS ·
                COSEVI · INS · MEP · IMAS — independent mocks with their own stores.
packages/shared Types, zod schemas, activity catalogue, legal catalogue (legal.ts), common Express bootstrap.
infra/          Dockerfiles, Compose, Caddy (HTTPS).
scripts/        dev.mjs, e2e.mjs, smoke.mjs.
```

Rules that keep the demo honest (details in `CLAUDE.md`): the frontend never calls the bus; the API never calls an
agency; agencies never call each other. Every cross-agency exchange goes through the bus and lands in the audit log,
which stores the **names** of the fields returned and never their values.

## API in one screen

```
POST /api/login              { id, password }          → { challengeId, otp:{ channel, maskedPhone, demoCode } }
POST /api/login/otp          { challengeId, code }     → { token, citizen, provenance }
GET  /api/profile                                      → { citizen, provenance }
GET  /api/workflows[/:id]                              → life events with fields, steps and legal notes
GET  /api/options/:source                              → form options (activities, cantons, properties via the bus…)
POST /api/workflows/:id/start  { input, consent }      → 202 { txnId }
GET  /api/transactions[/:txnId]                        → the citizen's transactions · status with exchange ids
GET  /api/transactions/:txnId/result[/pdf]             → cards + onceOnly + benefits · PDF (carta)
GET  /api/legal                                        → legal catalogue + per-workflow status
GET  /api/audit                                        → the citizen's own exchanges
GET  /api/registry                                     → bus registry with live health

POST /bus/request  { service, action, data, requester, subjectId, consent, purpose }  → BusResponse
GET  /bus/audit?subjectId=   ·   GET /bus/registry
```

Full contract: [docs/CONTRACTS.md](docs/CONTRACTS.md).

## Deploy it

Three targets from one codebase, all covered by CI. Full guide with the verified free-tier facts:
[docs/DEPLOY.md](docs/DEPLOY.md).

| Target | Command | Cold start | Good for |
|---|---|---|---|
| Compose (reference architecture) | `docker compose -f infra/docker-compose.yml up --build` | none | local demos, CI |
| One container | `docker build -f infra/Dockerfile.allinone -t pvg . && docker run -p 8080:8080 pvg` | 10–60 s on free plans | the interactive portal on a public URL |
| Static, no backend | `npm run build:static` → `apps/web/dist-static` | none | the link for legislators and press |

The all-in-one image runs the same fifteen Express apps in one Node process: bus and agencies on loopback,
only `PORT` exposed, the audit trail unchanged. `render.yaml` is a ready Render blueprint and the same image
runs on Cloud Run. The static build carries the three public pages plus JSON generated from the same source
of truth as the API; set `VITE_PORTAL_URL` so its "Probar el demo" buttons point at the interactive
deployment.

## Configuration

Everything is in `.env.example`: API keys per hop, session secret, the demo OTP, simulated agency latency, and the
three benefit figures (`BENEFIT_TRIPS_AVOIDED`, `BENEFIT_HOURS_SAVED`, `BENEFIT_COST_SAVED_CRC`, PRD FR-20).

## What this is not

Not connected to TSE, Hacienda, CCSS or any municipality. Not legally valid. Not a data-protection-compliant system —
it is a reference architecture to discuss one. See `docs/ARCHITECTURE.md` for what a production version would change.

## Licensing

| What | Licence |
|---|---|
| Source code | [PolyForm Noncommercial 1.0.0](LICENSE) |
| The research and the argument — `docs/research/`, `docs/LEGAL.md`, `docs/CASE.md`, and the Spanish page copy | [CC BY-NC-SA 4.0](LICENSE-docs) |
| The program's own technical docs — `docs/CONTRACTS.md`, `docs/PRD.md`, `docs/DECISIONS.md`, `docs/DEPLOY.md`, `CLAUDE.md` | PolyForm, with the code (Ley 6683 art. 4) |

**Governments, universities, public research bodies and charities may use this freely**, including in
production — the PolyForm licence names them as a permitted purpose "regardless of the source of funding".
So may anyone using it personally or noncommercially. Distribution and modification are permitted.

**A firm being paid to deliver, deploy or operate it needs a commercial licence**, even when the client is
a ministry. That is the whole point of the choice: a ministry should be able to run this for free; a
consultancy billing that ministry to deploy it should not get the work for free. See [COMMERCIAL.md](COMMERCIAL.md).

Every version up to and including commit `7efbf07` was MIT licensed, and that grant stands for copies already
distributed. It does not extend to anything after that commit. Code contributions need a copyright assignment or CLA, for the reason
explained in [CONTRIBUTING.md](CONTRIBUTING.md). See [NOTICE](NOTICE) for the full statement.
