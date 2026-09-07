# Architecture

```
                 ┌───────────────────────────┐
   browser ────► │ Caddy  https://localhost:8443  (tls internal)             │
                 └──────┬─────────────────┬──┘
                        │ /                │ /api/*
                 ┌──────▼──────┐    ┌──────▼──────┐
                 │ web (nginx) │    │ api  :3001  │  session, workflow orchestration, PDF
                 │ React SPA   │───►│ Express     │
                 └─────────────┘    └──────┬──────┘
                                           │ POST /bus/request  (x-api-key)
                                    ┌──────▼──────┐
                                    │ bus  :4000  │  registry · routing · audit log
                                    └┬────┬────┬──┴┐
                          ┌──────────┘    │    │   └──────────┐
                   ┌──────▼─────┐ ┌───────▼──┐ ┌▼───────┐ ┌───▼──────────┐
                   │ registro   │ │tributación│ │  ccss  │ │ municipalidad│
                   │   :4001    │ │  :4002    │ │ :4003  │ │    :4004     │
                   └────────────┘ └───────────┘ └────────┘ └──────────────┘
```

## Packages

| Path | Role |
|---|---|
| `packages/shared` | Types, zod schemas, activity catalogue, `createServiceApp()` (Express + logging + `/health` + API-key), id generators. |
| `services/registro-civil` | Citizen registry mock. Seeds three citizens. `GET /registro/citizen/:id`. |
| `services/tributacion` | Tax authority mock. Issues NITEs, idempotent per citizen + business name. |
| `services/ccss` | Social security mock. Registers employers / self-employed. |
| `services/municipalidad` | Municipal mock serving several cantons. Issues patentes with a fee. |
| `services/bus` | X-Road-style router: data-driven registry, per-agency API keys, timeouts, append-only audit. |
| `apps/api` | Citizen-portal backend: login + OTP, HMAC session tokens, workflow engine, once-only provenance, PDF. |
| `apps/web` | React + Vite + Tailwind SPA. Talks only to `/api`. |
| `infra` | Dockerfiles, Compose, Caddyfile. |
| `scripts` | `dev.mjs` (everything in one terminal), `e2e.mjs`, `smoke.mjs`. |

## Request path for "Iniciar un negocio"

1. `POST /api/business/register` validates the form, forces `citizenId` from the session token, requires consent,
   creates a transaction and returns `202 { txnId }` immediately.
2. The workflow runs in-process (`setImmediate`), one bus request per agency, in order:
   `registro.getCitizen` → `tributacion.createTaxId` → `ccss.registerEmployer` → `municipalidad.issueLicense`.
   Each step carries `consent: { granted: true, reference: txnId }` and an es-CR `purpose`.
3. The bus resolves the service + action in its registry, forwards with that agency's key and a 5 s timeout, and
   appends an `AuditEntry` whether it succeeded or failed. The entry records field **names** returned, never values.
4. The UI polls `GET /api/business/status/:txnId` every 700 ms and renders the step tracker; when `completed` it
   fetches the result (numbers, once-only provenance, benefits) and offers the PDF.

## Security model (demo grade)

- Portal ↔ API: HMAC-SHA256 signed bearer tokens, 8 h. Passwords compared as SHA-256 hashes of demo credentials.
- API ↔ bus and bus ↔ agencies: static `x-api-key` per hop (PRD §7.3). Real deployment: mTLS / OAuth2 client
  credentials, as X-Road does with security servers.
- Every service binds to `127.0.0.1` on the host in Compose; only Caddy (8443) and nginx (3000) are meant to be opened.
- Nothing is persisted. Restarting a container resets it. There is no real personal data anywhere.

## What a production version would change

| Demo | Production |
|---|---|
| Static API keys | Security servers with mTLS + organisation certificates (X-Road model) |
| In-memory audit | Signed, append-only, replicated log with citizen self-service access |
| In-process workflow | Durable workflow engine (e.g. Temporal) with retries and compensation |
| Mock agencies | Adapters in front of TSE, ATV/Hacienda, SICERE (CCSS), municipal systems |
| Shown OTP | Firma digital certificate / Pase Digital |
