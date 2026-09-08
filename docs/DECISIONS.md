# Decisions log

Short ADR-style entries. Newest last.

## D-001 · One language across the stack: TypeScript
The PRD allowed Express or FastAPI. A PoC benefits more from one toolchain (one `npm install`, one test runner, shared
types between agencies, bus, API and UI) than from language diversity. Services run with `tsx` and are typechecked with
`tsc --noEmit`; there is no build step for the backend.

## D-002 · Contracts before code
`docs/CONTRACTS.md` and `packages/shared` were written first and every package was built against them in parallel by
independent agents. Types and zod schemas are the single source of truth; the doc explains the wire behaviour.

## D-003 · In-memory stores, `__demo/reset`
Each agency keeps its data in one module with a `reset()`; the bus cascades resets. SQLite would add nothing to the
demo and would complicate tests and Docker. Restarting a container also resets it — acceptable for a demo.

## D-004 · Consent log viewable by the citizen (PRD open question 1) — yes
Every bus exchange records the consent reference and purpose, and `/auditoria` shows the citizen their own
exchanges. It is the cheapest way to make the once-only principle feel trustworthy rather than creepy.

## D-005 · No payment step (PRD open question 2)
The municipal mock returns the annual patente fee, but there is no SINPE/payment gateway step. It would add a fifth
integration without teaching anything new about interoperability. The sibling `muni-platform` project already has a
SINPE stub if it is ever wanted.

## D-006 · One life event, others visible but disabled (PRD open question 3)
The dashboard lists four more life events as "Próximamente" so the audience sees the reusable pattern without a
second workflow being built. The catalogue is data (`apps/api/src/services-catalogue.ts`).

## D-007 · Functional UI, not high-fidelity (PRD open question 4)
Tailwind, white cards, one primary blue, a tricolour stripe. Good enough to present; not a design system.

## D-008 · Audit stores field names, never values
`fieldsReturned` lists the top-level keys of each response. This demonstrates data minimisation (PRD §12) and keeps
the audit log free of personal data even in the demo.

## D-009 · OTP is shown on screen
There is no SMS or email. The login response carries `demoCode` and the UI shows it inside a "SMS simulado" box.
Anything else would make the demo depend on an external channel.

## D-010 · HTTPS via Caddy `tls internal`
PRD §7.3 asks for HTTPS even in demo. Caddy issues a self-signed certificate on `https://localhost:8443`; the plain
`http://localhost:3000` stays available so nobody has to click through a browser warning during a presentation.

## D-011 · e2e without a browser
`scripts/e2e.mjs` boots the six services and drives the full María journey over HTTP, asserting the PRD success
metrics (4 agencies, ≥10 once-only fields, PDF, < 2 min). A Playwright spec would be the next step once the UI
stabilises; it was left out to keep CI under a minute.

## D-012 · Letter size for the PDF
Costa Rica uses carta, not A4.

## D-013 · Workflows are data-driven specs (v2)
One `WorkflowSpec` per life event: form fields, steps with `when`/`data` functions, a `result` builder and a legal
note per step. The engine, the form, the tracker, the result page and the PDF are generic. Adding a life event is one
file plus, if needed, one mock action.

## D-014 · Legal status is a first-class field, sourced
Every workflow and step carries `LegalNote { status: hoy | parcial | ley, today, gap, basis[], model[] }` pointing into
`LEGAL_REFS`. Two research passes with web verification back the content (`docs/research/`). Where a fact could not be
verified it is said so. This is the demo's political argument, so it must survive a lawyer reading it.

## D-015 · "Pase Digital" replaced by IDC
The PRD referenced pasedigital.go.cr. It could not be verified as an existing product. The TSE's Identidad Digital
Costarricense (launched 9 September 2025, mandatory acceptance from 1 January 2027 by TSE resolution) is what exists;
the demo and the docs say IDC.

## D-016 · Honest numbers over impressive numbers
Estonia's "2 % of GDP" is a 2002 expectation; RIA's own X-Road figure is about 1,000 working years a year on 3 % of
traffic. The IDB's "74" is a time reduction, not a cost multiple. No country has tied verified digital savings to tax
relief by law. The case page says all of this, because the audience will check.

## D-017 · Seven agencies, one more Dockerfile arg each
Registro Nacional, Salud and CFIA are new services rather than new actions on existing ones because the demo's point
is that institutions stay independent and the bus is the only thing that connects them.

## D-018 · The argument is public, the portal is not
`/por-que`, `/marco-legal` and `/arquitectura` render without a session so the case can be shared with legislators
and press by URL. Everything that concerns a citizen (profile, transactions, audit) stays behind the simulated firma
digital, because the identity step is part of what the demo shows.

## D-019 · Every catalogue entry is now a real workflow
Job loss, retirement and licence renewal became specs with three new agencies (operadora/SUPEN, MTSS, COSEVI). SEDIMEC
(the medical college's certificate platform) is simulated inside the Salud mock rather than as an eleventh service; the
legal note says so. José's date of birth moved to 1961 so one seed citizen qualifies for the IVM pension.

## D-020 · Survive browser translation
Chrome translates the Spanish portal for visitors whose browser is in another language and rewrites text nodes as
`<font>` elements; React 18 then throws `NotFoundError` on `insertBefore`/`removeChild` and unmounts to a blank page
(reproduced on the login → dashboard transition). `apps/web/src/dom-guard.ts` makes those two DOM calls tolerant
(the standard workaround for React issue #11538) so translation keeps working, and an `ErrorBoundary` shows a reload
button instead of a blank page if anything else goes wrong. Blocking translation with `notranslate` was rejected: the
audience is often English-speaking.

## D-021 · Five more life events, chosen by cross-country frequency and Costa Rican friction
Death of a spouse, vehicle purchase, home purchase, marriage and school enrolment appear in most life-event portals
(Gosuslugi, Norway's seven, borger.dk, Suomi.fi, Estonia's roadmap, LifeSG, the EU Single Digital Gateway list) and
each costs a Costa Rican several visits today. Residency for foreigners and disability were researched and left as
next steps: the first needs a login that is not a cédula, the second rests on a certification backlog the State is
extending by resolution rather than fixing. Three new mock agencies (INS, MEP, IMAS); the death event is run by a new
seed citizen (Rosa) so José's retirement demo stays intact.

## D-022 · Reference countries are cited for organisation, not politics
Gosuslugi is referenced for its 2010 statutory once-only rule (210-FZ art. 7) and its 2023 "life situations"
grouping, with a note that it is not a political endorsement. The Nordic and Estonian sources include their own
audits (Rigsrevisionen 2015, Riigikontroll 2024), which is why the case page repeats that the law comes before the
platform.
