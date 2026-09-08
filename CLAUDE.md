# PuraVidaGov — conventions

Demo of a citizen-centric e-government platform for Costa Rica: portal → orchestrator API → interoperability bus →
thirteen mock agencies. **Read `docs/CONTRACTS.md` before touching any package**; it fixes the interfaces. PRD in
`docs/PRD.md`, decisions in `docs/DECISIONS.md`.

## Vocabulary
Spanish domain nouns stay Spanish in code and copy: `cédula`, `patente`, `NITE`, `trámite`, `patrono`. UI copy and
the PDF are es-CR; code, identifiers, comments and docs are English.

## Hard rules
- **Topology is the demo.** `apps/web` calls only `/api`. `apps/api` calls only the bus. Agencies call nobody.
  A shortcut that skips the bus also skips the audit log and breaks the once-only story.
- **The audit log never contains values.** `fieldsReturned` is a list of field names. Do not "improve" it.
- **Configs are data.** Registry (`services/bus/src/registry.ts`), life events (`apps/api/src/workflows/*.ts`, one
  `WorkflowSpec` each), legal catalogue (`packages/shared/src/legal.ts`), activities (`packages/shared/src/activities.ts`),
  cantons (`services/municipalidad/src/store.ts`). Never hardcode an agency list in a route or a page.
- **Legal claims are sourced.** Every `LegalNote` and `LegalRef` traces to `docs/research/*.md`. Do not add a status,
  an article number or a figure without a source there; mark unverified items as such.
- **Types and schemas live in `packages/shared` only.** Change `types.ts`, `schemas.ts` and `docs/CONTRACTS.md` together.
- **No real personal data, ever.** Seed citizens are fictional; keep it that way. No persistence, no analytics.
- **No secrets.** `.env` is git-ignored; `.env.example` documents every variable with demo values.
- **DEMO disclaimer stays** in the banner, the PDF and the README.
- **Letter size, not A4** for anything printable.

## Layout
```
packages/shared · services/{registro-civil,tributacion,ccss,municipalidad,registro-nacional,salud,cfia,supen,mtss,cosevi,ins,mep,imas,bus} · apps/{api,web}
infra/ (Dockerfiles, compose, Caddyfile) · scripts/ (dev, e2e, smoke, serve-all, build-static-api) · docs/ · .github/workflows/ci.yml
```

## Run and verify
```bash
npm install && npm run dev                                   # everything on localhost (web :5173)
docker compose -f infra/docker-compose.yml up --build        # web :3000, https :8443
npm run typecheck && npm test && npm run e2e                 # minimum before calling anything done
npm start                                                    # all 15 apps in ONE process on $PORT (free-tier target)
npm run build:static                                         # public pages only, no backend → apps/web/dist-static
```
Three deployment targets, all in CI; see `docs/DEPLOY.md`. **Compose stays the reference architecture** — do
not collapse it to fit a host. `apps/web/dist` is the default bundle the all-in-one serves; `dist-static` is
the static one. Never let a static bundle end up in front of a live backend.
Every service is ESM TypeScript run by `tsx`, exports `createApp()` from `src/app.ts` (tests import it without
binding a port) and listens in `src/index.ts`. Local imports need the `.js` extension (NodeNext). `apps/web` has its
own bundler-style tsconfig and must never pull Express into the bundle: import from `@pvg/shared` with `import type`
plus plain-data constants only.

## Demo login
`1-2345-6789` / `demo` / OTP `123456` (shown on screen); José `7-0123-0456` for the pension; Rosa `7-0111-0222` for the bereavement; Diego `1-1111-2222` is María's fiancé. Reset: `POST /api/__demo/reset`.
`/por-que`, `/marco-legal`, `/arquitectura` and the non-citizen API routes are public by design; keep everything about a
citizen behind `requireAuth`.
