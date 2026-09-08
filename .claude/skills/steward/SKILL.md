---
name: steward
description: How to act on CI failures and review comments on a PuraVidaGov pull request. Read before pushing anything to an open PR in this repo.
---

# Stewarding a PuraVidaGov PR

This is repo-specific guidance about **conventions and how proactive to be**. It does not relax any
"never" in the default rules: no skipping or quarantining tests, no empty commits to kick CI, no
force-push to someone else's branch, no approving or merging.

`CLAUDE.md` states the hard rules and `docs/CONTRACTS.md` fixes the interfaces. This file is only the
part that decides whether a push is safe.

## Before any push

```bash
npm run typecheck && npm test && npm run e2e
```

That is the repo's own stated minimum ("before calling anything done"), and it is also what CI runs, so
a clean local run is a real prediction of a green CI run. `npm run e2e` starts what it needs; do not
skip it because it is the slow one — it is the only check that exercises the bus.

For a change touching the SPA, also `npm run build -w @pvg/web`, and for the static target
`npm run build:static`. All three deployment targets are in CI; a change that builds one and breaks
another is a red run you could have caught locally.

## Fixes that are never in scope, however green they look

These are load-bearing. A CI failure or a reviewer nit is never a reason to cross one — if the only way
to green appears to cross one, that is the finding, and it goes in a comment rather than a commit.

- **Topology.** `apps/web` calls only `/api`; `apps/api` calls only the bus; agencies call nobody. A
  shortcut that skips the bus also skips the audit log and breaks the once-only story the demo exists
  to make.
- **The audit log never contains values.** `fieldsReturned` is a list of field names. Do not "improve" it.
- **Types and schemas live in `packages/shared` only.** `types.ts`, `schemas.ts` and
  `docs/CONTRACTS.md` change together or not at all.
- **`apps/web` must never pull Express into the bundle.** Import from `@pvg/shared` with `import type`
  plus plain-data constants only. This does not fail typecheck; it fails as a bloated or broken bundle.
- **Never let a static bundle end up in front of a live backend.** `dist` is what the all-in-one serves;
  `dist-static` is the backendless one.
- **Compose stays the reference architecture.** Do not collapse `infra/docker-compose.yml` to fit a host.

## Copy and legal claims — escalate, do not fix

Wording on `/por-que`, `/marco-legal`, `/quien-lo-hace` and anything in `docs/research/` is not ordinary
copy.

- **Never recreate `docs/DECISIONS.md`, `docs/research/foreigner-advocacy-cr.md` or
  `docs/research/licensing-options.md` here.** They were deliberately removed from this public repository and
  live privately. Do not restate their contents in a comment either.
- **Every `LegalNote` and `LegalRef` traces to `docs/research/*.md`.** Never add or change a legal status,
  an article number or a figure without a source there. A reviewer asking for a stronger claim is a
  request to do research, not to edit a string — say so rather than pushing it.
- **Never add a support, donation or funding affordance to `/por-que` or `/marco-legal`** (D-026). The
  Ko-fi link belongs on `/quien-lo-hace` alone. `apps/web/src/content/author.ts` carries the reasoning at
  the top of the file; the research behind it is in a private companion repository.
- **Never add** *campaña*, *movimiento*, *únase*, *firme aquí*, or the name of any party, diputado or
  candidate, and never reference an electoral cycle. Same source, §6c.
- Do not weaken the DEMO disclaimer in the banner, the PDF or the README, and do not make seed citizens
  look real. Both are risk controls, not decoration.

If a reviewer asks for something in this section, reply with the constraint and the source. Pushing the
change and explaining afterwards is the wrong order here.

## Repo mechanics that cause avoidable red

- **Local imports need the `.js` extension** (NodeNext). `import { x } from './y'` typechecks in some
  editors and fails at runtime under `tsx`.
- Every service exports `createApp()` from `src/app.ts` and listens in `src/index.ts`. Tests import
  `createApp()` without binding a port; putting `listen` in `app.ts` breaks the whole suite at once.
- `apps/web` has its own bundler-style tsconfig. A path that works in a service may not work there.
- Counts appear in prose in several files (13 agencies, 12 life events, 15 Express apps in the
  all-in-one, 17 Compose containers). If a change moves one, grep for the old number — nothing checks this.

## How proactive to be

Push without asking: lint and type errors, a broken import, a stale count in prose, a test the change
itself broke, a dependency or lockfile fix.

Ask first: anything touching the bus contract or `packages/shared`, anything that changes what an agency
returns, any new dependency in `apps/web`, and every item in the copy-and-legal section above.
