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
