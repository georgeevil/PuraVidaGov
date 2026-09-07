# Product Requirements Document (PRD) — PuraVidaGov

Version 1.0 (MVP Demo) · 2026-09-06 · Status: implemented as PoC (see `docs/DECISIONS.md` for how the open questions were resolved)

## 1. Executive summary

PuraVidaGov is a demonstration platform that simulates an integrated, citizen-centric e-government system for Costa
Rica. Inspired by Estonia's X-Road and Singapore's LifeSG, it shows how a unified digital government can reduce
bureaucracy, eliminate redundant data requests and enable cross-agency automation. The MVP illustrates three
principles: **single digital identity**, **once-only data sharing**, and **interoperable business registration**
across four simulated public institutions.

Audience: policymakers, technologists and international development partners.

## 2. Problem statement

Citizens and businesses interact with many entities (TSE, Hacienda, CCSS, municipalities…) in siloed ways: the same
information is submitted many times, offices are visited physically, and cross-agency procedures take weeks. Existing
digital services (firma digital, SICOP, ATV, EDUS) are not deeply integrated. **Government services are organised
around institutions, not around the citizen or business.**

## 3. Goals and non-goals

### 3.1 Goals (MVP)
1. Single digital identity using a simulated cédula + firma digital.
2. A national interoperability bus connecting four simulated agencies: Registro Civil, Tributación, CCSS, Municipalidad.
3. Once-only principle: data is fetched and pre-filled from the bus during business registration.
4. A citizen dashboard organised by life events ("Iniciar un negocio") orchestrating a multi-agency workflow.
5. Real-time metrics of time saved, documents avoided and cost reduction.

### 3.2 Non-goals
Real integration with production systems; full Ley 8968 compliance; replacing existing portals; sensitive personal
data beyond mock data; actual tax calculation or legal validity.

## 4. Target users
Simulated citizen "María" (business owner); government IT leaders; developers / integrators; international partners.

## 5. MVP features
- **5.1 Unified citizen portal**: login with simulated firma digital (cédula + password + one-time code); dashboard of
  life events (only "Iniciar un negocio" fully implemented); profile from connected registries.
- **5.2 Interoperability bus**: middleware routing requests between agencies; mock endpoints returning realistic JSON;
  audit log of every exchange.
- **5.3 Business registration workflow**: Registro Civil (identity) → Tributación (NITE) → CCSS (employer number) →
  Municipalidad (patente) → downloadable PDF.
- **5.4 Once-only dashboard**: which fields came from which agency; no re-entry.
- **5.5 Automation benefits simulator**: trips avoided, hours saved, cost reduction.

## 6. Functional requirements

| ID | Requirement | Where |
|---|---|---|
| FR-1 | Login page for citizens using a simulated digital identity | `apps/web` Login |
| FR-2 | Username (cédula) + password, then one-time code | `POST /api/login`, `POST /api/login/otp` |
| FR-3 | On login, basic profile loaded from Registro Civil via the bus | `apps/api/src/app.ts` (otp handler) |
| FR-4 | Session token for subsequent calls | HMAC token, `Authorization: Bearer` |
| FR-5 | Bus exposes a REST API to request data from each agency | `POST /bus/request` |
| FR-6 | Each agency is a separate service with its own store and API | `services/*` |
| FR-7 | Service discovery and routing from a registry | `services/bus/src/registry.ts` |
| FR-8 | Every exchange logged (timestamp, requester, data type, consent) | `services/bus/src/audit.ts` |
| FR-9 | Synchronous request-response (async optional) | synchronous |
| FR-10 | Citizen starts "Iniciar un negocio" from the dashboard | Dashboard |
| FR-11 | Identity data fetched and shown pre-filled | NewBusiness page |
| FR-12 | Citizen enters business details | NewBusiness page |
| FR-13 | Tributación generates a NITE | `tributacion.createTaxId` |
| FR-14 | CCSS registers the employer | `ccss.registerEmployer` |
| FR-15 | Municipalidad issues a patente | `municipalidad.issueLicense` |
| FR-16 | All responses shown on a confirmation page | Transaction page |
| FR-17 | Downloadable PDF summary | `GET /api/business/result/:txnId/pdf` |
| FR-18 | Completed in one session with no re-entry | e2e asserts ≥10 once-only fields |
| FR-19 | Benefits summary: 4 trips, 8 hours, ₡50 000 | Transaction page |
| FR-20 | Benefits configurable via environment | `BENEFIT_*` |

## 7. Non-functional requirements
- Each API call < 500 ms (agency latency is simulated, `AGENCY_LATENCY_MS`); full flow < 2 min (e2e asserts it).
- Responsive UI; Spanish (es-CR) copy with English tooltips.
- HTTPS even in demo (Caddy, `tls internal`); API keys between services; no real personal data.
- Modular monorepo; Docker Compose for local deployment.
- README with setup, architecture diagrams and API spec; demo walkthrough (`docs/DEMO.md`).

## 8. User flow (María's journey)
1. María logs in with her cédula and firma digital (OTP).
2. The portal greets her by name with data from Registro Civil.
3. She clicks "Iniciar un negocio".
4. Personal data is pre-filled; she enters the business details.
5. She submits (after consenting to share data).
6. The orchestrator calls the bus: identity validation, NITE, CCSS employer, municipal patente.
7. Confirmations return within seconds.
8. Success screen with all numbers and a PDF.
9. A benefits panel shows time and money saved.
10. She logs out.

## 9. Architecture
See `docs/ARCHITECTURE.md`.

## 10–11. Data models and API
See `docs/CONTRACTS.md` (binding) and `packages/shared/src/types.ts`.

## 12. Security & privacy
Data minimisation (audit stores field names, never values); explicit consent notice before the workflow; audit trail
viewable by the citizen; fictional data only; design follows Ley 8968 principles.

## 13. Success metrics
Registration < 2 min · ≥ 3 agencies queried automatically (4) · zero re-entry of known data · runs with a single
`docker compose up`.

## 14. Roadmap
Phase 1 scaffolding → Phase 2 bus → Phase 3 workflow → Phase 4 polish. All four phases are represented in this PoC.

## 15. Risks
Scope creep (4 agencies, 1 life event) · demo data only · Docker for reproducibility · prominent DEMO disclaimers ·
simple gateway rather than full X-Road.

## 16. Open questions → resolved in `docs/DECISIONS.md`

## 17. Version 2 additions (September 2026)
Four life events (start a business with sanitary permit and company formation, newborn, construction, change of
address), three more agencies (Registro Nacional, Ministerio de Salud, CFIA/APC), a legal status on every workflow and
step with sources (`docs/LEGAL.md`), and the case for government support (`docs/CASE.md`, `/por-que`). Note: the
"Pase Digital" reference in §17 Appendix could not be verified; the actual Costa Rican digital identity is the TSE's IDC.
