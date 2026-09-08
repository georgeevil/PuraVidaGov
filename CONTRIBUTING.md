# Contributing

Corrections are the most valuable thing this project can receive, especially to the legal research. If a
citation is wrong, a date is off, or a trámite has changed since it was checked, please say so.

## The most useful contributions

1. **Corrections to `docs/research/`, `docs/LEGAL.md` or the `LegalNote` text in the workflows.** Cite the
   source you checked and when. If you could not verify something, say that too — the files mark unverified
   claims deliberately and that convention matters more than completeness.
2. **Reports that something no longer matches reality** — a platform launched, a bill passed, a procedure
   moved online.
3. **Bugs in the demo**, with the steps to reproduce.

Open an issue at <https://github.com/georgeevil/PuraVidaGov/issues>. An issue with a source in it is worth
more than a pull request without one.

## Before you send code

**Code contributions are accepted only with a copyright assignment or a contributor licence agreement.**

This is not the usual arrangement for a public repository, so here is the honest reason. The project is
licensed so that governments and individuals may use it freely while firms billing for its delivery may not
(see [COMMERCIAL.md](COMMERCIAL.md)). That arrangement only works while one person holds the copyright and
can therefore grant commercial licences. A single merged pull request from someone who retains their
copyright would permanently remove the ability to relicense or to sell — which would end the model rather
than dilute it.

The cost of this policy is real and worth naming: it means the project does not meet the
[Standard for Public Code](https://standard.publiccode.net/), which requires both an OSI-approved licence
and that contributors *not* be asked to transfer copyright. That is a deliberate trade, not an oversight.

So: if you want to send code, open an issue first and we will sort out the paperwork. If you would rather
not sign anything — which is completely reasonable — describe the change in an issue instead and it can be
implemented independently.

## Conventions

Read [`CLAUDE.md`](CLAUDE.md) before changing any package; it fixes the rules that keep the demo honest.
The two that matter most:

- **Legal claims are sourced.** No status, article number or figure enters the code without a source in
  `docs/research/`, and unverified items are marked as such.
- **No real personal data, ever.** Every citizen in the demo is fictional and stays that way.

Run `npm run typecheck && npm test && npm run e2e` before proposing anything.
