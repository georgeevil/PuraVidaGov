# PuraVidaGov — gobierno digital centrado en la persona (prueba de concepto)

> **DEMOSTRACIÓN — datos ficticios.** This is not a system of the Government of Costa Rica. Every citizen, number
> and institution response is simulated. Nothing is persisted.

PuraVidaGov shows what a Costa Rican e-government built around **one digital identity**, the **once-only
principle** and an **interoperability bus** (X-Road style) could feel like. One life event is implemented end to
end: *Iniciar un negocio*. María logs in with her cédula and a simulated firma digital, her data arrives from the
Registro Civil, she types only what the State does not already know, and in a few seconds Tributación issues a NITE,
the CCSS registers her as patrona and her municipalidad issues the patente. She downloads a PDF, sees how much time
and money the electronic process saved, and can inspect every data exchange made on her behalf.

Documents: [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Contracts (binding interfaces)](docs/CONTRACTS.md) ·
[Decisions](docs/DECISIONS.md) · [Demo script](docs/DEMO.md) · [Conventions](CLAUDE.md)

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
| Agencies | http://localhost:4001–4004/health |

**Without Docker (Node 22):**

```bash
npm install
npm run dev          # six services + Vite on http://localhost:5173
```

**Demo login:** cédula `1-2345-6789`, contraseña `demo`, código `123456` (shown on screen — there is no SMS).
Other citizens: `7-0123-0456` (Talamanca), `2-0987-0654` (Grecia).

## Verify

```bash
npm run typecheck && npm test        # unit tests per package (vitest + supertest)
npm run e2e                          # boots all services and runs María's journey over HTTP, twice
npm run smoke -- http://localhost:3001   # same journey against a running stack (Docker)
```

CI (`.github/workflows/ci.yml`) runs typecheck, unit tests, the web build, the e2e journey, then builds the
Compose stack and smokes it.

## How it is built

```
apps/web        React + Vite + Tailwind SPA (es-CR, English tooltips). Talks only to /api.
apps/api        Express: login + OTP, signed session tokens, workflow orchestration, once-only provenance, PDF.
services/bus    Interoperability bus: data-driven registry, per-agency API keys, timeouts, append-only audit log.
services/*      Registro Civil · Tributación · CCSS · Municipalidad — independent mocks with their own stores.
packages/shared Types, zod schemas, activity catalogue, common Express bootstrap.
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
GET  /api/services                                     → life events (only start-business available)
POST /api/business/register  { business…, consent }    → 202 { txnId }
GET  /api/business/status/:txnId                       → WorkflowTransaction (steps with exchange ids)
GET  /api/business/result/:txnId[/pdf]                 → result + onceOnly + benefits · PDF (carta)
GET  /api/audit                                        → the citizen's own exchanges
GET  /api/registry                                     → bus registry with live health

POST /bus/request  { service, action, data, requester, subjectId, consent, purpose }  → BusResponse
GET  /bus/audit?subjectId=   ·   GET /bus/registry
```

Full contract: [docs/CONTRACTS.md](docs/CONTRACTS.md).

## Configuration

Everything is in `.env.example`: API keys per hop, session secret, the demo OTP, simulated agency latency, and the
three benefit figures (`BENEFIT_TRIPS_AVOIDED`, `BENEFIT_HOURS_SAVED`, `BENEFIT_COST_SAVED_CRC`, PRD FR-20).

## What this is not

Not connected to TSE, Hacienda, CCSS or any municipality. Not legally valid. Not a data-protection-compliant system —
it is a reference architecture to discuss one. See `docs/ARCHITECTURE.md` for what a production version would change.

## License

MIT.
