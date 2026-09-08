# Licensing options for PuraVidaGov

**Research boundary: unbounded** — this memo goes outside the repository to the licence texts, their
stewards' own FAQs, SPDX, OSI, Fair Source, adopter announcements, WIPO/WTO treaty text and Costa Rican
statutes. Every substantive claim carries a URL. Anything not read from a primary source is marked
`[unverified]`.

**Research date: 7 September 2026.** Fee schedules, SPDX contents and licence-steward pages change;
re-check anything time-sensitive before acting.

**This is not legal advice.** It is research to brief a lawyer with, and §6 says exactly where a lawyer
is required rather than optional.

**Method note.** Licence texts were fetched raw (`curl` on the canonical URL or the raw file in the
steward's repository) rather than read through a summariser, so the quoted clauses are verbatim.
Costa Rican statutes and registry fees were researched separately; confidence there is lower and is
flagged per claim in §5 and in the gap list at the end.

---

## 0. The goal, stated precisely

From the author, in his words: prevent "big integrators from just consuming this without paying
royalties or buying this initiative off from me", while still letting the Costa Rican government and
the public see, run and evaluate it, and while keeping the ability to sell or license it himself.

That decomposes into four requirements, and they are not equally achievable:

| # | Requirement | Achievable by licensing? |
|---|---|---|
| R1 | Government and public can read, run, evaluate | Yes, easily |
| R2 | Author keeps the right to sell or licence it himself | Yes — he owns it; only exclusivity promises could remove this |
| R3 | An integrator cannot sell an implementation without paying | Partly — see §2 and §6; every off-the-shelf licence leaks here |
| R4 | Nobody can take "the initiative" without paying | **No.** See §4. This is not a copyright question at all |

Most of the disappointment in these situations comes from expecting a licence to deliver R4.

---

## 1. Why MIT fails, and what relicensing can and cannot do

### 1.1 What the repository currently grants

`/Users/george/dev/PuraVidaGov/LICENSE` is the MIT licence, with the copyright line
`Copyright (c) 2026 PuraVidaGov contributors`. `package.json` line 6 declares `"license": "MIT"`, and
`README.md` line 136 says `MIT.`

MIT's operative sentence grants "any person obtaining a copy" the right "to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies" (LICENSE, lines 6-10). Concretely:

- **Commercial resale is permitted outright.** "sell copies" is in the grant. Accenture may package
  PuraVidaGov, brand it, and sell it to MICITT.
- **Sublicensing is permitted.** A recipient may re-license the code to a third party on *different*
  terms, including proprietary ones, without asking.
- **Closed-source forks are permitted.** MIT imposes no obligation to publish modifications. An
  integrator may take the code, add the production hardening a real deployment needs, and ship only
  binaries.
- **Attribution is minimal.** The only condition is that "the above copyright notice and this
  permission notice shall be included in all copies or substantial portions of the Software"
  (LICENSE, lines 12-13). That is satisfied by a line in a `THIRD-PARTY-NOTICES.txt` nobody reads.
  It does not require crediting the author in marketing, in the product UI, or in a bid document.
- **No royalty, ever.** MIT has no payment term and no field-of-use restriction.

There is nothing defective about MIT here. It is doing exactly what it was written to do. It is simply
the wrong instrument for R3.

### 1.2 Can he relicense?

**Going forward: yes.** He is the copyright holder; the copyright holder may offer the same work under
any number of licences simultaneously or successively. Two things make this clean in his case:

- **Sole authorship.** `git log --format='%an' | sort | uniq -c` returns exactly two names: George
  Chigrichenko (6 commits) and `Claude <noreply@anthropic.com>` (15 commits). There is no third-party
  contributor whose consent would be needed. (§1.4 discusses whether the Claude-authored commits raise
  a different problem.)
- **No copyleft in the dependency tree.** A scan of every `package.json` under `node_modules` found no
  GPL, LGPL, AGPL, MPL, EPL, CDDL, SSPL, BUSL or Elastic-licensed dependency. The licences present are
  MIT (229), ISC (14), Apache-2.0 (5), BSD-3-Clause (2), 0BSD (1), `(MIT AND Zlib)` (1) and CC-BY-4.0
  (1, `caniuse-lite`, a build-time data package). All are permissive and none obstructs relicensing
  the project's own code. *(Verified locally on 7 September 2026 by reading the `license` field of
  every `package.json` in `node_modules`.)*

**Retroactively: no.** He cannot withdraw the MIT grant from versions already published. Two
independent reasons:

1. **Contract/estoppel reality.** The MIT licence's grant is a completed act as to anyone who already
   obtained a copy. There is a genuine academic debate about whether a bare, unaccepted, no-consideration
   permissive licence is revocable in principle — MIT, unlike Apache-2.0, does not contain the word
   "irrevocable". Apache-2.0 §2 grants a "perpetual, worldwide, non-exclusive, no-charge, royalty-free,
   irrevocable copyright license" (https://www.apache.org/licenses/LICENSE-2.0), and its absence from
   MIT is what fuels the debate. **The mainstream practical view is that the grant is not revocable as
   to copies already distributed**, and no court has upheld a retroactive revocation of a permissive
   open-source licence that I could find. `[unverified — I found no controlling case law either way;
   treat "MIT is irrevocable" as the working assumption every practitioner uses, not as a decided
   question.]` The practical point is unaffected: nobody plans a business around winning that argument,
   and neither should he.
2. **It doesn't matter, because the copies exist.** Every commit in the public history carries the MIT
   `LICENSE` file. Anyone may `git clone`, check out `03afb15` (or any earlier commit), and hold a
   perfectly good MIT-licensed copy of the entire codebase and all 405 KB of `docs/`.

### 1.3 Does the public history change anything? Yes, twice over

**First, GitHub's own terms grant fork rights independent of the LICENSE file.** GitHub Terms of
Service, section D.5, "License Grant to Other Users":

> "By setting your repositories to be viewed publicly, you agree to allow others to view and 'fork'
> your repositories (this means that others may make their own copies within the Service in
> repositories they control)."

and

> "By making a repository public, you grant other Users a nonexclusive, worldwide license to use,
> display, perform and reproduce (by forking) Your Content through the Service as permitted by
> GitHub's functionality. You may grant additional rights by adopting a license."

(https://github.com/github/site-policy/blob/main/Policies/github-terms/github-terms-of-service.md,
§D.5, retrieved 7 September 2026.) Note the scope: this ToS grant covers viewing and forking *within
GitHub*. It is narrower than MIT. But it survives a relicence and it survives making the repo private
later — a fork already taken stays taken. Section D.6 codifies inbound=outbound: content added to a
repository is licensed under that repository's licence unless a separate CLA supersedes it — which is
exactly why §1.5 recommends a CLA.

A second thing to be aware of while reading the same terms: a **section D.9, "Access Reciprocity"**,
was present at this fetch. It waives your restrictions on GitHub's own scraping if you scrape publicly
available content to train a commercial AI system, with carve-outs for academic research and entities
under 700M monthly active users. `[unverified: when D.9 was added.]` Not directly relevant to the
licence choice, but relevant to any public-sector publishing policy this project ends up informing.

**Second, the history is the archive.** `github.com/georgeevil/PuraVidaGov` has 20 commits, all public.
Relicensing tomorrow changes the terms of tomorrow's code. It does not change the terms of commit
`03afb15`. Practically: **anyone can fork the last MIT commit and build a product on it, legally,
forever.** Whatever he does next, that base is out.

What relicensing *does* buy, then, is narrower but still real:

- Every improvement from the relicence date forward is under his terms. Software rots; a two-year-old
  fork of a demo that tracks live Costa Rican law is worth much less than the current one.
- The `docs/research/*.md` corpus is the part that ages worst and is hardest to recreate. New research
  is his.
- It changes the *signal*. An integrator's legal department reading "PolyForm Noncommercial, commercial
  licence available, contact the author" behaves very differently from one reading "MIT". Most large
  firms will not knowingly build a bid on a fork of a relicensed project because it looks bad and
  because the diff is discoverable. That deterrent is commercial, not legal, and it is worth more than
  people expect.

**Practical step nobody mentions:** the MIT-era `LICENSE` and the `docs/` under it should be preserved
honestly. Do not rewrite git history to erase the MIT period. It cannot succeed (forks exist), and
attempting it converts a clean licensing change into something that looks like bad faith.

### 1.4 The AI-authorship problem — the biggest unexamined risk here

Fifteen of the twenty commits are authored by `Claude <noreply@anthropic.com>`. **A licence is only as
strong as the copyright underneath it**, and there is a live question about whether machine-generated
expression carries copyright at all.

The U.S. Copyright Office's *Copyright and Artificial Intelligence, Part 2: Copyrightability*,
published **29 January 2025** (https://www.copyright.gov/ai/), concluded that "outputs of generative AI
can be protected by copyright only where a human author has determined sufficient expressive elements",
that protection does not extend to "the mere provision of prompts", and that "the use of AI to assist
in the process of creation or the inclusion of AI-generated material in a larger human-generated work
does not bar copyrightability"
(https://www.copyright.gov/newsnet/2025/1060.html, NewsNet Issue 1060, 29 January 2025).

What this means in practice, stated bluntly:

- U.S. law is not controlling in Costa Rica, but Costa Rica's own statute is likely to reach a similar
  place via its definition of "autor" — see §5.1.
- The parts of this repository with the strongest copyright claim are the ones where his human
  judgement is visible in the output: the **selection and arrangement** of twelve life events, the
  legal statuses assigned to each step, the choice of thirteen agencies and their boundaries, the
  architecture decisions in `docs/DECISIONS.md`, and the editorial framing of `docs/CASE.md` and
  `docs/LEGAL.md`.
- The parts with the weakest claim are boilerplate scaffolding an AI produced from a short instruction.
- **Mitigation, and it is cheap:** keep the record showing human direction. His prompts, his design
  documents (`docs/PRD.md`, `docs/CONTRACTS.md`, `docs/DECISIONS.md` predate and constrain the code),
  his review and revision. `docs/CONTRACTS.md` at 37 KB written before the code is exactly the kind of
  evidence that shows a human determined the expressive elements. Do not delete it, and date it.
- **A lawyer needs to look at this**, and it is a better use of a first consultation than choosing
  between BUSL and PolyForm.

`[unverified: I could not find Costa Rican case law or Registro Nacional guidance on AI-assisted
authorship. Assume the question is open there.]`

### 1.5 The complete list of files a relicence touches

| File | Current | Action |
|---|---|---|
| `/LICENSE` | MIT, "PuraVidaGov contributors" | Replace; and see the note below |
| `/package.json` line 6 | `"license": "MIT"` | Change to the new SPDX id or `"SEE LICENSE IN LICENSE"` |
| `/README.md` line 136 | `MIT.` | Rewrite as a licensing section pointing at LICENSE, LICENSE-docs and COMMERCIAL.md |
| workspace `package.json` files | none declare a licence | Leave, or add explicitly |

**The copyright line is wrong today and should be fixed regardless of which licence he picks.**
"PuraVidaGov contributors" is a phantom entity: it cannot sue, cannot grant a commercial licence, and
implies a multi-party project whose consent a buyer's lawyer will ask about. It should read
`Copyright (c) 2026 George Chigrichenko` (legal name). Add a `CONTRIBUTING.md` stating that outside
contributions are accepted only under a contributor licence agreement or a copyright assignment —
without that, the first accepted pull request permanently costs him the unilateral right to relicense
or to sell.

---

## 2. Candidate licences

A structural fact that frames everything below. The Open Source Definition, clause 6:

> "6. No Discrimination Against Fields of Endeavor — The license must not restrict anyone from making
> use of the program in a specific field of endeavor. For example, it may not restrict the program
> from being used in a business, or from being used for genetic research."

(https://opensource.org/osd)

**Every licence that achieves R3 violates OSD 6 and therefore cannot be OSI-approved.** That is not a
flaw in the licences; it is the definition of the trade. There is no "open source licence that stops
commercial reuse". Anyone who offers one is selling something else.

SPDX status below was read from the machine-readable licence list
(https://github.com/spdx/license-list-data, `json/licenses.json`, list version dated 2026-09-03).

### 2.1 Business Source License 1.1

| | |
|---|---|
| **Exact name** | Business Source License 1.1 |
| **SPDX id** | `BUSL-1.1` — present in the SPDX list, `isOsiApproved: false` |
| **Author/steward** | MariaDB plc. Licence text is copyright MariaDB; "Business Source License" is a MariaDB trademark |
| **Canonical text** | https://mariadb.com/bsl11/ |
| **OSI-approved** | No. The text itself says so |

**How it works.** BUSL is a *template* with five parameters: Licensor, Licensed Work, Additional Use
Grant, Change Date, Change License. The default grant is narrow — verbatim:

> "The Licensor hereby grants you the right to copy, modify, create derivative works, redistribute, and
> make **non-production use** of the Licensed Work. The Licensor may make an Additional Use Grant,
> above, permitting limited production use."

The Additional Use Grant is the whole game: without one, BUSL permits only non-production use, which
would block a government pilot in production.

**The conversion, verbatim:**

> "Effective on the Change Date, or the fourth anniversary of the first publicly available distribution
> of a specific version of the Licensed Work under this License, whichever comes first, the Licensor
> hereby grants you rights under the terms of the Change License, and the rights granted in the
> paragraph above terminate."

So the **four-year cap is hard-coded**, and it applies **per version** ("This License applies separately
for each version of the Licensed Work and the Change Date may vary for each version").

**MariaDB's conditions on reusing the template.** Read these from
https://spdx.org/licenses/BUSL-1.1.html, **not** from https://mariadb.com/bsl11/ — MariaDB's own HTML
page renders the covenant list defectively, flattening four covenants into one paragraph and producing
the garbled reading "(b) insert the text 'None' to specify a Change Date". The canonical text has four:

> "In consideration of the right to use this License's text and the 'Business Source License' name and
> trademark, Licensor covenants to MariaDB, and to all other recipients of the licensed work to be
> provided by Licensor:
>
> 1. To specify as the Change License the GPL Version 2.0 or any later version, or a license that is
>    compatible with GPL Version 2.0 or a later version…
> 2. To either: (a) specify an additional grant of rights to use that does not impose any additional
>    restriction on the right granted in this License, as the Additional Use Grant; or (b) insert the
>    text 'None'.
> 3. To specify a Change Date.
> 4. Not to modify this License in any other way."

MariaDB's adopting FAQ reinforces it: "you covenant to follow the BSL wording and to only make changes
that are allowed by the license" (https://mariadb.com/bsl-faq-adopting/).

Three consequences that matter for §6:

1. **The Change License must be GPL-2.0-compatible.** MIT, Apache-2.0 and MPL-2.0 qualify; a
   proprietary licence does not. He *will* end up giving the code away, on a four-year delay.
2. **The Additional Use Grant may only add rights, never subtract.** He cannot use the AUG to impose
   an extra restriction. Any narrowing has to be achieved by the AUG being narrow in the first place,
   not by adding conditions to the base grant.
3. **The rest of the text is off-limits.** Editing BUSL beyond the parameters breaks the covenant and
   forfeits the right to use the name.

And, from the licence's own Notice: "The Business Source License (this document, or the 'License') is
not an Open Source license."

**Adopters.** HashiCorp announced the move from MPL-2.0 to BUSL 1.1 on **10 August 2023**
(https://www.hashicorp.com/blog/hashicorp-adopts-business-source-license). The licence in
`hashicorp/terraform` today names **International Business Machines Corporation (IBM)** as Licensor,
with `Licensed Work: Terraform Version 1.6.0 or later. The Licensed Work is (c) 2024 IBM Corp.`,
`Change Date: Four years from when the Licensed Work is published`, `Change License: MPL 2.0`
(https://raw.githubusercontent.com/hashicorp/terraform/main/LICENSE, retrieved 7 September 2026 —
IBM's name reflects its acquisition of HashiCorp). Its Additional Use Grant is worth reading as a model
because it is the most heavily lawyered one in existence:

> "You may make production use of the Licensed Work, provided Your use does not include offering the
> Licensed Work to third parties on a hosted or embedded basis in order to compete with IBM Corp.'s
> paid version(s) of the Licensed Work."

with definitions of "competitive offering", "Product" and "Embedded", and this carve-out:

> "Hosting or using the Licensed Work(s) for internal purposes within an organization is not considered
> a competitive offering."

Sentry adopted BSL in November 2019 with a **three**-year change date converting to Apache-2.0, then
left BSL for its own FSL in 2023. CockroachDB went Apache-2.0 → BSL → its own bespoke CockroachDB
Software License in 2024.

**Government internal use? It depends entirely on the adopter's AUG, and at least one adopter
excludes government by name.** Terraform's AUG permits it explicitly ("internal purposes within an
organization"). But Cockroach Labs' licensing FAQ states: "No, government entities do not qualify for
an Enterprise Free license" (https://www.cockroachlabs.com/docs/stable/licensing-faqs).

**That is the single most important warning about BUSL for this project.** BUSL says *nothing* generic
about government. It delegates the question to a blank the licensor fills in, and the delegation can
cut against government. A ministry's procurement lawyer who has met BUSL before may have met
CockroachDB's version of it.

**Does it stop an integrator?** **Only if the AUG is drafted for it, and Terraform's is not.** Under
Terraform's AUG an integrator may deploy Terraform for a ministry and charge for the work, because that
is not "offering the Licensed Work to third parties on a hosted or embedded basis". Terraform's AUG
does sweep in "paid support arrangements … that significantly overlaps with the capabilities of IBM
Corp.'s paid version(s)" — but only where such an overlap exists. A generic BUSL adoption does **not**
solve R3. See §6.

**What relicensing to BUSL triggered, empirically.** HashiCorp announced the switch on 10 August 2023;
the OpenTofu fork of Terraform was publicly available **5 September 2023** — four weeks later
(https://opentofu.org/blog/the-opentofu-fork-is-now-available/) — and was announced as a Linux
Foundation project on **20 September 2023**
(https://www.linuxfoundation.org/press/announcing-opentofu), backed by Harness, Gruntwork, Spacelift,
env0, Scalr and others, with 140+ organisations and 600+ individuals pledged, under MPL-2.0. See
§6.7 for the two cases where the relicensing company later reversed itself. PuraVidaGov has nothing
like Terraform's user base, so a fork is far less likely — but the mechanism is exactly the one
described in §1.2.

### 2.2 Functional Source License 1.1

| | |
|---|---|
| **Exact name** | Functional Source License, Version 1.1, with a named future licence |
| **SPDX ids** | `FSL-1.1-MIT` and `FSL-1.1-ALv2` — both present, both `isOsiApproved: false` |
| **Author** | Sentry (getsentry), published 2023 |
| **Canonical text** | https://fsl.software/ ; templates at https://github.com/getsentry/fsl.software |

**The grant and the restriction, verbatim** (from
`https://raw.githubusercontent.com/getsentry/fsl.software/main/FSL-1.1-ALv2.template.md`):

> "we hereby grant you the right to use, copy, modify, create derivative works, publicly perform,
> publicly display and redistribute the Software for any Permitted Purpose identified below."
>
> "A Permitted Purpose is any purpose other than a Competing Use. A Competing Use means making the
> Software available to others in a commercial product or service that:
> 1. substitutes for the Software;
> 2. substitutes for any other product or service we offer using the Software that exists as of the
>    date we make the Software available; or
> 3. offers the same or substantially similar functionality as the Software."

**And then, decisively for this project, the same section continues:**

> "Permitted Purposes specifically include using the Software:
> 1. for your internal use and access;
> 2. for non-commercial education;
> 3. for non-commercial research; and
> 4. **in connection with professional services that you provide to a licensee using the Software** in
>    accordance with these Terms and Conditions."

**Read clause 4 again. FSL expressly permits an integrator to sell professional services around the
software.** That is precisely the Accenture scenario, and FSL grants it by name. **FSL does not achieve
R3.** This is the single most important finding in §2, and it is easy to miss because FSL markets
itself as a non-compete licence — it is, but the competition it forbids is *productising*, not
*consulting*.

**Conversion.** Two years, not four, and to a real open-source licence — Apache-2.0 for FSL-1.1-ALv2,
MIT for FSL-1.1-MIT. The grant is stated as irrevocable and effective on the second anniversary of each
version's availability.

**How it differs from BUSL:** shorter conversion (2 vs 4 years); a fixed, drafted non-compete rather
than a blank Additional Use Grant you must draft yourself; much shorter and more readable; no
requirement that the future licence be GPL-compatible; no trademark covenant back to a steward.
Sentry's stated reason for dropping the AUG is that it "is a giant fill-in-the-blank that effectively
means that every BSL is a different license" — the same objection §2.1 records against BUSL for
government use. Announced by Chad Whitacre, **17 November 2023**
(https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/).
**Quote the 1.1 template, not that blog post**: the announcement quotes FSL-1.0 wording, which differs
from 1.1 and uses now-obsolete identifiers such as `FSL-1.0-Apache-2.0`. The `-MIT` and `-ALv2`
templates are identical except for the title, abbreviation and future-licence section.

**Fair Source.** FSL is the flagship licence of Fair Source (https://fair.io/licenses/). Fair Source
defines itself as software that "is publicly available to read", "allows use, modification, and
redistribution with minimal restrictions to protect the producer's business model", and "undergoes
delayed Open Source publication (DOSP)" (https://fair.io/about/). It began as a Sentry initiative in
2024, responding to a 2023 call to action from Chef co-founder Adam Jacob. Its recommended set is FSL,
with the **Fair Core License (FCL)** — an FSL variant adding licence-key support, with no SPDX id —
and BUSL as alternates. Note the consequence: **PolyForm Noncommercial and Elastic 2.0 are not Fair
Source**, because they never convert; fair.io does not mention Elastic at all.

**Do not cite `fairsource.org`.** It redirects to fairsource.com, an unrelated small-business
consultancy. The Fair Source project is at **https://fair.io/**.

**Government internal use?** Yes — "your internal use and access" is a Permitted Purpose.
**Stops an integrator?** No. Expressly permits them.

### 2.3 The PolyForm family

Written by the PolyForm Project, "a group of experienced licensing lawyers and technologists developing
simple, standardized, plain-language software source code licenses" (https://polyformproject.org/).
The site names **no individuals** — only "experienced software licensing lawyers … with over 100 years
of combined experience". `[unverified: attribution to Heather Meeker and Kyle E. Mitchell is widely
reported and appears on their own blogs, but is not confirmed anywhere on polyformproject.org.]`
The project is
explicit about what it is not: "Open source or free software. There are plenty of existing open source
licenses. PolyForm is not a substitute for them" (https://polyformproject.org/about).

The suite is larger than the four named in the brief. From https://polyformproject.org/licenses (note:
**no trailing slash** — the trailing-slash URL 404s): Noncommercial, Perimeter, Shield, Strict,
Internal Use, Small Business, Free Trial, Countdown.

**SPDX status is uneven and this matters for tooling.** Read from the SPDX list (2026-09-03):

| Licence | SPDX id |
|---|---|
| PolyForm Noncommercial 1.0.0 | `PolyForm-Noncommercial-1.0.0` — present |
| PolyForm Small Business 1.0.0 | `PolyForm-Small-Business-1.0.0` — present |
| PolyForm Shield 1.0.0 | **not in the SPDX list** |
| PolyForm Perimeter 1.0.1 | **not in the SPDX list** |
| PolyForm Strict / Internal Use / Free Trial | **not in the SPDX list** |

All PolyForm entries that exist are `isOsiApproved: false`.

#### PolyForm Noncommercial 1.0.0 — the one that fits

Text: https://polyformproject.org/licenses/noncommercial/1.0.0

The permitted-purpose clauses, verbatim and in full:

> **Noncommercial Purposes** — "Any noncommercial purpose is a permitted purpose."
>
> **Personal Uses** — "Personal use for research, experiment, and testing for the benefit of public
> knowledge, personal study, private entertainment, hobby projects, amateur pursuits, or religious
> observance, without any anticipated commercial application, is use for a permitted purpose."
>
> **Noncommercial Organizations** — "Use by any charitable organization, educational institution, public
> research organization, public safety or health organization, environmental protection organization,
> **or government institution** is use for a permitted purpose regardless of the source of funding or
> obligations resulting from the funding."

**That clause is written for exactly this situation.** A Costa Rican ministry, municipality, the CCSS or
the TSE is a "government institution"; its use is a permitted purpose by the licence's own terms, with
no Additional Use Grant to draft and no ambiguity to litigate. Meanwhile a systems integrator using the
software in the course of a paid engagement is a commercial user and has no grant — its only route is a
commercial licence from the author.

Other features: grants distribution and modification rights (unlike Strict); requires passing on the
terms and any `Required Notice:` lines; includes a patent licence and a patent-defence termination;
gives a 32-day cure period on first written notice of violation; **no conversion date — it never becomes
open source**; and it explicitly does not permit sublicensing ("These terms do not allow you to
sublicense or transfer any of your licenses to anyone else, or prevent the licensor from granting
licenses to anyone else").

The one soft spot, and it is the same one every candidate has: **the licence says nothing about a
contractor acting *for* a permitted user.** The government's own use is clearly permitted; the
consultancy's for-profit delivery is not obviously covered by any permitted purpose, since the licence
grants by *purpose* and a paid engagement is a commercial purpose. That reading is probably right and
it is not settled. §6 addresses it head on.

**Forward note:** a **PolyForm Noncommercial 2.0.0-pre.1** draft was published on 4 November 2025
(https://writing.kemitchell.com/2025/11/04/PolyForm-Noncommercial-2.0.0-pre.1) and **retains**
government institutions as noncommercial. It has not shipped — `/licenses/noncommercial/2.0.0` returns
404 and the announcements page lists only 1.0.0. **1.0.0 is the operative version.** Watch for 2.0.0.

#### PolyForm Shield 1.0.0 — blocks competitors of *the licensor*

Text: https://polyformproject.org/licenses/shield/1.0.0. Verbatim:

> "Any purpose is a permitted purpose, except for providing any product that competes with the software
> or any product the licensor or any of its affiliates provides using the software."

with a broad Competition clause covering substitutes "regardless how it is designed or deployed …
even if it is provided free of charge."

This is the variant that blocks competitors specifically — and note it is *broader* than Perimeter,
because it also protects products the licensor provides *using* the software. If the author himself
sells implementation services built on PuraVidaGov, then an integrator selling implementation services
built on PuraVidaGov is arguably providing a competing product, and Shield would reach it. That is a
real argument, but it is an argument — it depends on him actually having such an offering, and on a
court reading "product" to include a services engagement. It is materially weaker than Noncommercial's
bright line.

#### PolyForm Perimeter 1.0.1 — blocks competitors of *the software*

Text: https://polyformproject.org/licenses/perimeter/1.0.1. Verbatim:

> "Any purpose is a permitted purpose, except for providing to others any product that competes with
> the software."

Narrower than Shield (protects only the software, not the licensor's other offerings). Same
competition definition. Same weakness against a pure services play. Note it is at **1.0.1**, not 1.0.0.

#### PolyForm Small Business 1.0.0

Text: https://polyformproject.org/licenses/small-business/1.0.0. Verbatim:

> "Use of the software for the benefit of your company is use for a permitted purpose if your company
> has fewer than 100 total individuals working as employees and independent contractors, and less than
> 1,000,000 USD (2019) total revenue in the prior tax year."

(with the revenue figure inflation-adjusted by the U.S. BLS consumer price index). This blocks
Accenture, Deloitte and IBM cleanly by size. But **it says nothing about government**: a ministry is not
a "company" with revenue, so its position under this licence is unclear — arguably no grant at all.
That ambiguity is disqualifying for R1. It would also block a competent 40-person Costa Rican firm,
which may be the wrong outcome commercially.

#### PolyForm Internal Use 1.0.0

Text: https://polyformproject.org/licenses/internal-use/1.0.0. Verbatim:

> "Use of the software for the internal business operations of you and your company is use for a
> permitted purpose."

and, importantly, "you may not distribute the software". This *would* let a ministry run it internally
and would not let an integrator resell it — but it also forbids redistribution entirely, which kills
the "see, run and evaluate" story for the public and forbids the forks and mirrors that make a public
demo useful. Not recommended, but worth knowing it exists.

### 2.4 AGPL-3.0 plus commercial dual licensing

| | |
|---|---|
| **Exact name** | GNU Affero General Public License v3.0 |
| **SPDX ids** | `AGPL-3.0-only`, `AGPL-3.0-or-later` (and the deprecated `AGPL-3.0`) — all `isOsiApproved: true`, `isFsfLibre: true` |
| **Author** | Free Software Foundation, 2007 |
| **Text** | https://www.gnu.org/licenses/agpl-3.0.en.html |

The distinguishing feature is §13, "Remote Network Interaction", and its trigger is narrower than most
people remember: **it requires both modification and network interaction.** If you modify the Program,
your version must "prominently offer all users interacting with it remotely through a computer network"
an "opportunity to receive the Corresponding Source of your version"
(https://www.gnu.org/licenses/agpl-3.0.en.html, §13). Running stock, unmodified AGPL software over a
network triggers nothing at all.

**The model.** Offer the code under AGPL, and sell a separate commercial licence to anyone who cannot
accept AGPL's obligations. Because he is the sole copyright holder, he can do this: the copyright
holder is not bound by his own licence. This is the MongoDB (pre-SSPL) and Grafana model, and it is
the *only* candidate here that is genuinely OSI-approved.

**Does AGPL stop an integrator? No — and the licence says so in terms.** §4: "You may charge any price
or no price for each copy that you convey", and "you may offer support or warranty protection for a
fee." AGPL restricts *source disclosure of modified network-facing versions*, never the fee. An
integrator may:

- charge a ministry any amount to deploy, configure, host, support and operate PuraVidaGov;
- charge for training, integration, data migration, and a multi-year managed-service contract;
- keep every cent.

The only thing AGPL forces is that if they modify it and offer it over a network, users of that
network service must be able to get the modified source. For a systems integrator whose margin is in
bodies and hours rather than in code secrecy, that is a mild inconvenience — they will hand over the
source and bill for the next sprint. **AGPL protects the commons; it does not protect the author's
revenue from a services business.**

Where AGPL *does* bite is a would-be SaaS competitor who wants to run a proprietary hosted fork. If
that is the threat model, AGPL is excellent. For this project it is not the threat model.

**The dual-licensing history, all primary-source verified:**

- **MongoDB → SSPL v1, 16 October 2018** (date on the licence itself,
  https://www.mongodb.com/legal/licensing/server-side-public-license), moving off AGPL.
- **Grafana, Loki and Tempo → AGPLv3 from Apache-2.0, 20 April 2021**
  (https://grafana.com/blog/2021/04/20/grafana-loki-tempo-relicensing-to-agplv3/): Raj Dutt's post
  notes "AGPLv3 is an OSI-approved license that meets all criteria for Free and Open Source Software."
- **Elastic added AGPL alongside ELv2 and SSPL, 29 August 2024**
  (https://www.elastic.co/blog/elasticsearch-is-open-source-again).
- **Redis added AGPLv3, 1 May 2025** (https://redis.io/blog/agplv3/). Redis 8 offers RSALv2, SSPLv1
  **or** AGPLv3.

See §6.7 — the last two are reversals, and the reason Redis gave is directly on point for this memo.

On SSPL: OSI's own position, published 19 January 2021, is that the SSPL "was submitted to the Open
Source Initiative for approval but later withdrawn by the license steward when it became clear that the
license would not be approved", and OSI characterises such licences as failing "the right to make use
of the program for any field of endeavor"
(https://opensource.org/blog/the-sspl-is-not-an-open-source-license); OSI's term for the category is
"fauxpen source". SPDX lists `SSPL-1.0` with `isOsiApproved: false`. **Do not use SSPL**: it carries
the reputational cost of a non-open licence and, being aimed at cloud providers, does nothing about
integrators.

### 2.5 Elastic License 2.0

| | |
|---|---|
| **Exact name** | Elastic License 2.0 |
| **SPDX id** | `Elastic-2.0` — present, `isOsiApproved: false` |
| **Author** | Elastic N.V., 2021 |
| **Text** | https://www.elastic.co/licensing/elastic-license |

The whole restriction, verbatim (from
`https://raw.githubusercontent.com/elastic/elasticsearch/main/licenses/ELASTIC-LICENSE-2.0.txt`):

> "You may not provide the software to third parties as a hosted or managed service, where the service
> provides users with access to any substantial set of the features or functionality of the software.
>
> You may not move, change, disable, or circumvent the license key functionality in the software, and
> you may not remove or obscure any functionality in the software that is protected by the license key.
>
> You may not alter, remove, or obscure any licensing, copyright, or other notices of the licensor in
> the software. Any use of the licensor's trademarks is subject to applicable law."

That is all three limitations. Everything else — use, copy, distribute, make available, prepare
derivative works — is granted, royalty-free and worldwide, with a patent grant and patent-defence
termination.

**Government internal use?** Yes, without qualification.

**Stops an integrator? No — and Elastic answers this exact scenario in its own FAQ.** From
https://www.elastic.co/licensing/elastic-license/faq: "I'm a contractor setting up Elasticsearch and
Kibana for my clients to use internally. This is permitted under ELv2, because you are not providing
the software as a managed service." An MSP whose customers "have access to substantial portions of the
functionality" *is* caught. So ELv2 draws the line at *operating a service*, not at *being paid*: the
consultancy-install case, which is precisely the Accenture case, is expressly permitted. ELv2 also has
no conversion date — it never becomes open source, which is why it does not meet the Fair Source
definition. Better than MIT for R3; far from sufficient.

### 2.6 Creative Commons — for `docs/`, not for code

**Creative Commons itself advises against using CC licences for software**, verbatim from
https://creativecommons.org/faq/:

> "We recommend against using Creative Commons licenses for software."

and

> "We strongly encourage you to use one of the very good software licenses which are already available."

with the stated reason that "CC licenses do not contain specific terms about the distribution of source
code, which is often important to ensuring the free reuse and modifiability of software", and that
software licences typically address patents while CC licences do not (CC BY 4.0 and its siblings
expressly do not grant patent rights).

That advice is about *code*. It is not an argument against CC for prose, and `docs/` is prose:
405 KB of it, of which ~250 KB is `docs/research/*.md` — original sourced legal and policy analysis
(`legal-cr.md` 62 KB, `life-events-abroad.md` 95 KB, `reference-laws-and-evidence.md` 59 KB,
`legal-cr-life-events-2.md` 52 KB, `hosting-free-tier.md` 41 KB). **This is the part of the repository
that a competitor cannot cheaply reproduce**, and it is the part MIT currently gives away with no
attribution requirement beyond a notice file. Splitting code and prose licensing is the right call.

| Licence | SPDX id | OSI | What it does here |
|---|---|---|---|
| CC BY-NC-SA 4.0 | `CC-BY-NC-SA-4.0` | No (`isOsiApproved: false`) | Attribution required; no commercial use; derivatives must carry the same licence |
| CC BY-SA 4.0 | `CC-BY-SA-4.0` | No (but `isFsfLibre: true`) | Attribution + share-alike; commercial use allowed |
| CC BY-ND 4.0 | `CC-BY-ND-4.0` | No (`isFsfLibre: false`) | Attribution; may redistribute verbatim; **no derivatives may be shared** |
| CC BY 4.0 | `CC-BY-4.0` | No (but `isFsfLibre: true`) | Attribution only |

The NonCommercial definition, verbatim from the CC BY-NC-SA 4.0 legal code
(https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en, §1):

> "NonCommercial means not primarily intended for or directed towards commercial advantage or monetary
> compensation."

**Government use is *not* automatically noncommercial under CC, and this is the sharpest contrast in
the memo.** Where PolyForm Noncommercial applies an *entity-status* test that names government
institutions, CC applies a *purpose* test. CC's own interpretation guidance
(https://wiki.creativecommons.org/wiki/NonCommercial_interpretation) says so directly: "NonCommercial
turns on the use, not the identity of the reuser", and "a reuser need not be in education, in
government, an individual, or a recognized charity/nonprofit" — no class of reuser is per se permitted
or excluded. So a ministry must assess each use on its purpose. Reading the research for policy work
is plainly not "primarily intended for or directed towards commercial advantage". A cost-recovery or
revenue-generating public service built on it is a live question. A consultancy reading it to write a
bid is plainly commercial.

Practical consequence for §6: **the entity test belongs in the code licence and the purpose test in
the documents licence**, which is what the recommended split delivers. If maximum certainty for a
ministry reading `docs/` matters more than the NC restriction, CC BY-SA 4.0 removes the question
entirely at the cost of allowing commercial use.

**CC BY-ND 4.0** restricts *sharing*, not *making*: the grant covers "produce and reproduce, but not
Share, Adapted Material". A ministry could adapt the research internally but could not publish the
adaptation — which defeats the point.

**Recommendation for `docs/`: CC BY-NC-SA 4.0.** It requires attribution by name (which MIT does not,
in any meaningful sense), blocks commercial exploitation of the research, and forces derivative
analyses to stay open. **CC BY-ND is the wrong choice** — it would prevent the government from adapting
the legal analysis into its own policy documents, which is the single most valuable thing that could
happen to this work.

### 2.7 Summary table

| Licence | SPDX | OSI | Gov may run internally | Blocks integrator selling services | Converts to OSS |
|---|---|---|---|---|---|
| MIT | `MIT` | Yes | Yes | **No** | n/a |
| BUSL-1.1 | `BUSL-1.1` | No | Only if the AUG says so — CockroachDB's says no | **Only if custom-drafted for it** | Yes, ≤4 yrs, GPL-compatible |
| FSL-1.1-MIT / -ALv2 | both listed | No | Yes, by name | **No — expressly permits it** | Yes, 2 yrs |
| PolyForm Noncommercial | `PolyForm-Noncommercial-1.0.0` | No | **Yes, by name** | Probably — but grey, see §6.1 | No |
| PolyForm Shield | none | No | Yes | Arguably, if he has a competing offering | No |
| PolyForm Perimeter (1.0.1) | none | No | Yes | Weakly | No |
| PolyForm Small Business | `PolyForm-Small-Business-1.0.0` | No | **Unclear — no "company"** | Yes for large firms | No |
| PolyForm Internal Use | none | No | Yes | Yes, but forbids redistribution | No |
| AGPL-3.0 + commercial | `AGPL-3.0-only` | **Yes** | Yes | **No — §4 permits charging** | n/a |
| Elastic 2.0 | `Elastic-2.0` | No | Yes | **No — FAQ permits contractors** | No |
| EUPL-1.2 | `EUPL-1.2` | **Yes** | Yes | **No** | n/a |
| CC BY-NC-SA 4.0 (prose) | `CC-BY-NC-SA-4.0` | No | Yes, but by purpose not status | Yes, for the documents | No |

### 2.8 The two questions that discriminate

Cutting across all of the above, two distinctions do all the work:

**Whose act is restricted?** BUSL restricts *the customer's production use* — so the government's own
use is the gating question and the integrator's fee is irrelevant. FSL, PolyForm Shield/Perimeter and
ELv2 restrict *the provider's offering* — so a government running it internally is always fine, and a
vendor hosting it as a service is not. PolyForm Noncommercial restricts *by the user's character*.
Only the third of these is aimed at the thing he wants to stop.

**How is "noncommercial" defined — by entity or by purpose?** PolyForm Noncommercial uses an
entity-status test and names government institutions. Creative Commons uses a purpose test and says
explicitly that the identity of the reuser does not decide it. That is why the recommendation in §6.2
puts the entity test on the code and the purpose test on the prose.

**And one uncomfortable observation:** FSL is the only licence in this set that answers both the
government question and the integrator question in its own operative text — and it answers *yes* to
both. ELv2 answers both via an official FAQ, also yes to both. The licences that are clearest are
clearest because they have decided *not* to restrict what he wants to restrict.

---

## 3. The adoption tension

The question is usually asked as "can governments adopt non-OSI-licensed software?" That framing is
wrong, and getting it right changes the answer.

**Governments buy proprietary software constantly.** Every ministry in Costa Rica runs licensed
Microsoft, Oracle or SAP products. The US OMB's own source-code memorandum records federal spending of
over $6 billion a year across more than 42,000 transactions covering "proprietary, open source, and
mixed source" code (OMB M-16-21, 8 August 2016,
https://obamawhitehouse.archives.gov/sites/default/files/omb/memoranda/2016/m_16_21.pdf). There is no
general prohibition on procuring software under a restrictive licence — procurement law regulates *how
you buy*, not *what licence the thing carries*. So R1 is never in danger from a licence choice: a
Costa Rican institution can lawfully run PolyForm-licensed software, particularly when the licence
grants it that right for free.

The real cost of leaving OSI-approved licensing is different and narrower. **It is exclusion from the
"public code" ecosystem, not from procurement.**

### 3.1 The concrete, quotable exclusion

The Standard for Public Code, maintained by the Foundation for Public Code, requires — verbatim from
https://standard.publiccode.net/criteria/publish-with-an-open-license.html:

> "All source code and documentation MUST be licensed such that it may be freely reusable, changeable
> and redistributable.
>
> Software source code MUST be licensed under an **OSI-approved or FSF Free/Libre license**.
>
> All source code MUST be published with a license file.
>
> Contributors MUST NOT be required to transfer copyright of their contributions to the codebase."

with the test: "Confirm that the license for the source code is on the OSI-approved or FSF Free/Libre
license list and the license for documentation conforms to the Open Definition."

Two things follow, and they bite:

1. Under BUSL, FSL, PolyForm or ELv2, **PuraVidaGov fails the Standard for Public Code**, and cannot be
   listed as compliant public code, catalogued by the Foundation, or held up as an exemplar in the
   public-code community.
2. Note the fourth requirement too: requiring copyright assignment from contributors *also* fails the
   Standard. So the CLA recommended in §1.5 and the licence change are two independent departures from
   it. He should make that choice knowingly.

**But most public-sector policy is softer than that.** The Standard for Public Code is the outlier, and
the contrast is worth having in front of him:

| Source | Strength | What it actually says |
|---|---|---|
| Standard for Public Code | **MUST** | "Software source code MUST be licensed under an OSI-approved or FSF Free/Libre license" (https://standard.publiccode.net/criteria/publish-with-an-open-license.html) |
| UK Government Service Manual | **SHOULD** | "You should publish your code under an Open Source Initiative compatible licence." Names MIT as GDS's own choice (https://www.gov.uk/service-manual/technology/making-source-code-open-and-reusable) |
| US OMB M-16-21 | descriptive | OSS "is **often** distributed under licenses that comply with the definition of 'Open Source' provided by the Open Source Initiative … and/or … the Free Software Foundation." Not a mandate. §5.1 requires agencies to release 20% of new custom code as OSS |
| FSFE Public Money Public Code | campaign | "Implement legislation requiring that publicly financed software developed for the public sector be made publicly available under a Free and Open Source Software licence" (https://publiccode.eu/) — FSF framing, does not name OSI |

**And one Latin American statute is directly on point.** Uruguay's **Ley 19.179 (2013)**
(https://www.impo.com.uy/bases/leyes/19179-2013) requires, art. 2: "cuando se contraten licencias de
software se dará preferencia a licenciamientos de software libre. En caso de que se opte por software
privativo se deberá fundamentar la razón." Article 5 defines software libre by the four freedoms, the
first being "Pueda ser usado para cualquier propósito", and defines *software privativo* as anything
depriving the user of one of them. **Under that statute, BUSL — and PolyForm Noncommercial — are
software privativo**: still procurable, but only with a written justification on the file. Costa Rica
is not Uruguay, and no equivalent Costa Rican statute was confirmed (see §5.4), but this is the shape
of rule that exists in the region and the shape a Costa Rican institution's legal office may reach for.

### 3.2 The EU picture

**EUPL 1.2** is the European Commission's own licence. The authoritative text is the Annex to
**Commission Implementing Decision (EU) 2017/863 of 18 May 2017**, OJ L 128/59
(https://interoperable-europe.ec.europa.eu/collection/eupl). SPDX lists `EUPL-1.2` as **OSI-approved
and FSF-libre**; it is copyleft (Article 5). Since the Commission Decision of 8 December 2021
(2021/C 495 I/01), art. 5(a), "the open source licence granted by the Commission shall be the EUPL,
except in the cases listed in points (b) and (c)"
(https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021D1209(01)).

Its copyleft reaches network provision, because of how it defines the trigger — verbatim from the
official English text
(https://joinup.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt, §1):

> "'Distribution' or 'Communication': any act of selling, giving, lending, renting, distributing,
> communicating, transmitting, or otherwise making available, online or offline, copies of the Work or
> **providing access to its essential functionalities at the disposal of any other natural or legal
> person**."

**Do not call this a "network clause".** The word "network" does not appear anywhere in EUPL 1.2; the
trigger is "providing access to its essential functionalities". Quote it, don't paraphrase it.

Its grant is expansive: "use the Work in any circumstance and for all usage", including the right to
"sublicense rights in the Work", and Article 9 explicitly contemplates paid services — "you may choose
to conclude an additional agreement, defining obligations or services consistent with this Licence."
So **EUPL does not stop an integrator either** — it is an open-source licence and cannot, by OSD 6.
Article 13 gives all approved linguistic versions "identical value", which is why it is the licence a
European public body expects. If he ever wants maximum institutional legitimacy rather than maximum
control, EUPL 1.2 is the single best-signalling choice available.

**The Interoperable Europe Act, Regulation (EU) 2024/903 of 13 March 2024.** Article numbers
circulating in secondary summaries are wrong; these were read from the OJ text
(https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202400903):

- **Art. 2(12)** defines "open source licence" without reference to OSI: "a licence whereby the reuse,
  redistribution and modification of software is permitted **for all uses** on the basis of a
  unilateral declaration by the right holder… and where the source code of the software is made
  available to users indiscriminately".
- **Art. 4(6)** — Union entities and public sector bodies "shall prioritise the implementation of
  interoperability solutions that do not carry restrictive licensing terms, such as open source
  solutions, where such interoperability solutions are equivalent" on functionality, total cost,
  user-centricity, cybersecurity and other objective criteria.
- **Art. 8(3)(d)** — the binding obligation is only to "use a licence that allows the solution at least
  to be reused by other Union entities or public sector bodies, or be issued as open source".
- **Art. 8(4)** — portals collecting open source solutions "shall allow for the use of the European
  Union Public Licence". **Recital 36** carries the EUPL rationale (not "Article 36(4)", which does not
  exist).

**Would a source-available licence satisfy it?** The Act never requires OSI approval. But Art. 2(12)
requires permission "for all uses" — so BUSL and PolyForm Noncommercial are **not** "open source
licences" for the Act's purposes. The binding duty in Art. 8(3)(d) is weaker and a bespoke
public-sector-reuse licence would clear it. What is lost is the Art. 4(6) prioritisation. This is EU
law and does not bind Costa Rica; it is here because it is the most developed statement anywhere of
what a public body is expected to do, and Costa Rican policy tends to follow European models.

`[unverified: any successor to the European Commission Open Source Software Strategy 2020–2023
("Think Open", adopted 21 October 2020); none is named on the Commission's page.]`

### 3.3 The closest analogue, and it cuts against restriction

**X-Road — the interoperability platform this project is modelled on — is MIT-licensed.**
`https://raw.githubusercontent.com/nordic-institute/X-Road/master/LICENSE` (and the same file on
`develop`, which carries a literal `SPDX-License-Identifier: MIT` header) begins:

> "The MIT License
>
> Copyright (c) 2019- Nordic Institute for Interoperability Solutions (NIIS)
> Copyright (c) 2018 Estonian Information System Authority (RIA), Nordic Institute for Interoperability
> Solutions (NIIS), Population Register Centre (VRK)
> Copyright (c) 2015-2017 Estonian Information System Authority (RIA), Population Register Centre (VRK)"

(retrieved 7 September 2026. A trap: GitHub's API reports `"spdx_id": "NOASSERTION"` for this repo
because the multi-line copyright block defeats its detector. Cite the file, not the API.)

This is worth sitting with. The actual national interoperability platform of Estonia and Finland —
with NIIS members including Estonia and Finland as strategic members, Iceland contributing, and
Ukraine, Schleswig-Holstein, Québec, the Faroe Islands and Åland associated (https://www.niis.org/) —
with a real integrator ecosystem selling real implementations, is under the most permissive licence
there is. And NIIS still exists, is still funded, and is still the recognised authority on X-Road.

**Their moat is not the licence. It is the trademark and the institution.** X-Road® is a registered
trademark of the Estonian Information System Authority. That is the §4.4 argument, demonstrated by the
nearest real-world case there is: give away the code, own the name.

### 3.3a Every verified government reference implementation is OSI-licensed

Checked by reading LICENSE files and the GitHub licence API:

| Project | Licence |
|---|---|
| `alphagov/govuk-design-system`, `govuk-frontend`, `govuk-prototype-kit`, `publisher`, `govuk-infrastructure` | MIT |
| Estonia RIA: `AJ`, `DHX`, `eIDAS-SpecificProxyService-Test`, `Klassifikaatorite-Standard` | MIT |
| Denmark **`OS2web/os2web8`** | **EUPL-1.2** |
| Denmark `OS2iot-backend` / `-frontend` / `-payloaddecoders` | MPL-2.0 |
| Denmark `OS2Forms/os2forms8` | GPL-2.0 |
| Brazil `govbr/caixapostal-cli`, `qwtransfer`, `orgaosbr` | MIT |
| Brazil `govbr/ml-data`, `suindara.govbr`, `wsin.govbr` | GPL-3.0 / GPL-2.0 / Unlicense |
| Argentina `argob/poncho`, `argob/estandares` | MIT |
| Argentina `argob/cuidar-android` | GPL-3.0 |

**Not one uses a source-available licence.** That is not proof that a source-available government
reference implementation cannot work — it may simply be that nobody has tried. But it means
PuraVidaGov would be the first, and being first is a cost as well as an asset.

### 3.4 Costa Rican rules

See §5.4 for Ley 9986 and for the search for a Costa Rican software-libre policy. Summary of what was
and was not found is in the gap list. The short version: **no Costa Rican equivalent of Uruguay's Ley
19.179 was confirmed to exist, and none was confirmed not to exist.** Treat it as an open question and
have a Costa Rican lawyer check before assuming either way.

---

## 4. What a licence cannot protect

This section is the one worth re-reading, because it is where the author's stated goal and the
available instruments diverge most sharply.

### 4.1 Copyright protects expression, not ideas — and this is treaty law, not opinion

TRIPS Article 9.2, verbatim (https://www.wto.org/english/docs_e/legal_e/27-trips_04_e.htm):

> "Copyright protection shall extend to expressions and not to ideas, procedures, methods of operation
> or mathematical concepts as such."

WIPO Copyright Treaty Article 2, verbatim (https://www.wipo.int/wipolex/en/text/295166), in nearly
identical words:

> "Copyright protection extends to expressions and not to ideas, procedures, methods of operation or
> mathematical concepts as such."

And software is protected *as a literary work*, not as an invention — TRIPS Article 10.1:

> "Computer programs, whether in source or object code, shall be protected as literary works under the
> Berne Convention (1971)."

Costa Rica has been a WTO member since 1 January 1995
(https://www.wto.org/english/thewto_e/countries_e/costa_rica_e.htm), so TRIPS binds it.

### 4.2 What that means, concretely, for this project

Anyone — Accenture, a local firm, a ministry's own team — may lawfully:

- **Reimplement the architecture.** "Portal → orchestrator API → interoperability bus → agency mocks,
  with a value-free audit log" is a method of operation. Not protected.
- **Copy the life-event catalogue as a list.** The *idea* of bundling newborn, bereavement, marriage,
  job loss, retirement, home purchase, vehicle purchase, school enrolment, moving, construction,
  driver's licence and starting a business into twelve orchestrated trámites is not protected. His
  particular *selection and arrangement* has a thin compilation copyright at best, and thin
  compilation copyright is the weakest thing in the field.
- **Use every legal conclusion in `docs/LEGAL.md` and `docs/research/`.** The facts about Ley 8454,
  Ley 8220, Ley 9986 and every article number are public-domain facts about public law. The
  *conclusion* that a given step is `hoy`, `parcial` or `ley` is an idea. Only his particular prose
  expressing it is protected — and prose is easy to paraphrase.
- **Read the whole repository as a specification and build a clean-room reimplementation.** This is
  the standard move, it is entirely legal, and for a codebase this size it is cheap. A competent team
  could rebuild the running demo in weeks using the docs as the spec. Under any licence.
- **Cite it.** Nothing stops a bidder writing "as demonstrated by the PuraVidaGov reference
  implementation" in a proposal, then delivering their own build.

### 4.3 So what does "buying the initiative off from me" actually mean?

It cannot mean buying the copyright, because the copyright is not what makes the initiative valuable.
Anyone who wanted only the code could reimplement it. What a buyer would actually be paying for is:

1. **Not having to spend eighteen months** re-deriving the legal analysis, re-reading thirteen
   agencies' processes, and discovering which steps need a statute.
2. **The author's endorsement and involvement** — the ability to say the person who did this work is
   on the project, which is a procurement-grade differentiator no fork can copy.
3. **Removing him as a competitor or a critic**, which has value precisely in proportion to his
   visibility.
4. **Speed and de-risking.** A working demo that a minister can click through today.

Every one of those is a function of *him*, not of the licence file. Which leads to:

### 4.4 What actually creates defensible value

Ranked by how much they survive a determined reimplementation:

1. **Being the recognised author, publicly and verifiably.** Dated, attributed, cited work in a domain
   where almost nobody has done it. A fork can copy the code; it cannot copy the fact that he wrote it
   first. This is why the attribution requirement in a CC licence for `docs/` is worth more here than
   any restriction in the code licence.
2. **Trademark.** Copyright cannot stop reimplementation; trademark can stop them *calling it
   PuraVidaGov*. It is the one right that survives a clean-room rebuild intact, it is cheap, and it is
   the most under-used instrument in this situation. See §5.
3. **The domain name and the running demo.** `puravidagov.*` plus a live instance a minister can open
   is a single point of reference. Cheap to hold; expensive to displace.
4. **Research provenance.** The `docs/research/*.md` files record their own methodology and retrieval
   dates. That is evidence of independent creation and an asset in any dispute — and it is also just a
   better product than an undated summary.
5. **Relationships and timing.** Whoever is in the room when MICITT or the ANGD scopes this work will
   win it, licence or no licence. Being first and being known are the assets.
6. **Ongoing maintenance.** The legal analysis decays. Whoever keeps it current is the authority. This
   is the only moat that compounds, and it is the actual answer to "how do I not get consumed".

The uncomfortable conclusion: **his leverage comes from visibility, not from restriction, and
restriction reduces visibility.** A licence that stops a ministry's contractor from touching the code
also stops the ministry's contractor from becoming dependent on him. The recommendation in §6 tries to
buy R3 at the smallest possible cost in visibility, but there is no version where the cost is zero.

---

## 5. Trademark and copyright registration in Costa Rica

*Confidence in this section is lower than in §§1–4. Costa Rican primary sources are harder to fetch —
SCIJ now redirects to sinalevi.go.cr, which renders through JavaScript, a problem `docs/research/legal-cr.md`
already documents for this project. Fee figures in particular must be re-checked against the Registro
Nacional's current published schedule before anyone spends money.*

### 5.1 Copyright — Ley 6683

Costa Rica's copyright statute is **Ley N.º 6683, Ley de Derechos de Autor y Derechos Conexos** (1982,
much amended). It is the instrument under which the code and the documents in this repository are
protected in Costa Rica.

Costa Rica acceded to the **Paris Act (1971) of the Berne Convention**, depositing its instrument on
**3 March 1978**, with entry into force **10 June 1978**
(https://www.wipo.int/wipolex/en/treaties/notifications/details/treaty_berne_90).

**Registration is not required for protection.** Berne Convention Article 5(2), verbatim
(https://www.wipo.int/wipolex/en/text/283698):

> "The enjoyment and the exercise of these rights shall not be subject to any formality"

So his copyright in PuraVidaGov already exists, in Costa Rica and in all ~180 Berne countries, without
filing anything. Nothing in §5 is a precondition to owning the work or to enforcing the licence.

**What registration adds is evidence, not rights.** Registration with the Registro Nacional de Derechos
de Autor y Derechos Conexos creates a dated, official record of the claim of authorship, which shifts
who has to prove what if authorship is ever disputed. For a project whose commits are half
AI-authored (§1.4), a dated registration naming a human author is a more useful document than usual.

`[unverified: the specific articles of Ley 6683 covering (a) protection of programas de cómputo,
(b) the definition of "autor" and whether it requires a persona física, (c) the presumption arising
from registration, and (d) the term of protection for software; and the Registro Nacional's current
fee and processing time for registering a software work. These were researched but not confirmed from
a fetchable primary text in this pass. Do not cite article numbers for Ley 6683 from this memo — read
the statute at wipolex.wipo.int or sinalevi.go.cr first.]`

The §1.4 point re-enters here: **if Ley 6683 defines an author as a natural person** (which is the
norm in civil-law droit d'auteur systems, and which Costa Rica's tradition follows), the
AI-authored commits raise the same question in Costa Rica as the U.S. Copyright Office raised in
January 2025. Confirming the definition of "autor" in Ley 6683 is a five-minute job for a Costa Rican
lawyer and should be the first question asked.

### 5.2 Trademark — Ley 7978

The statute is **Ley N.º 7978, Ley de Marcas y Otros Signos Distintivos** (2000), administered by the
Registro de la Propiedad Industrial within the Registro Nacional (https://www.rnpdigital.com/).

Costa Rica uses the **Nice Classification** for goods and services. The classes relevant here, from
the WIPO Nice Classification class headings (https://www.wipo.int/classifications/nice/):

| Class | Covers | Why it matters here |
|---|---|---|
| **9** | Computer software; downloadable software | The product itself, if distributed |
| **42** | Design and development of computer hardware and software; SaaS; IT consultancy | **The most important class** — this is where a software platform and its development services live |
| **35** | Business management, business administration, consultancy | Advisory/consulting engagements with institutions |
| **41** | Education; providing of training | Workshops, courses, training material |

If budget is limited, **class 42 is the one to file**, with class 9 second.

`[unverified: (a) whether Ley 7978 requires a foreign applicant to appoint a local apoderado or
establish domicile, and the article that says so; (b) the term of registration and renewal period;
(c) the publication (edicto) and opposition periods and the article numbers; (d) the current official
fee per class and the edicto cost, in colones; (e) realistic filing-to-registration timeline. These
were researched but not confirmed from a fetchable primary source in this pass.]`

Two things I can say with confidence and that do not depend on those gaps:

- **A foreign resident can own a Costa Rican trademark.** Costa Rica is a Paris Convention country and
  is bound by TRIPS national-treatment obligations; refusing registration on nationality grounds is not
  available to it. The practical requirement is usually a local address for service, which any Costa
  Rican IP firm provides as a routine service.
- **Madrid Protocol status is the thing to check before filing anywhere.** I could not confirm from
  WIPO's member pages whether Costa Rica is a Madrid Protocol member
  (https://www.wipo.int/madrid/en/members/ did not render a member list to me).
  `[unverified — check https://www.wipo.int/madrid/memberprofiles/ before deciding between a national
  filing and an international one.]` If Costa Rica is a member, a single international application
  designating Costa Rica plus other markets may be cheaper than separate national filings; if not, a
  direct national filing at the Registro Nacional is the route.

**Practical advice regardless:** trademark is the cheapest, highest-leverage legal step in this whole
memo, and it is the one that is *not* substitutable by anything else (§4.4). Registering
"PuraVidaGov" in class 42 costs a small fraction of a lawyer's time on licence drafting and gives him
something copyright never can: the right to stop someone else using the name.

### 5.3 What registration does and does not buy — summary

| | Copyright (Ley 6683) | Trademark (Ley 7978) |
|---|---|---|
| Needed for protection? | **No** (Berne art. 5(2)) | **Yes** — trademark rights are largely registration-based |
| What it stops | Copying his *expression* | Others using the *name* |
| Stops reimplementation? | No | No — but stops them calling it PuraVidaGov |
| Cost | Low | Low per class |
| Priority | Nice to have; useful evidence given §1.4 | **Do this** |

### 5.4 Procurement — Ley 9986

**Ley N.º 9986, Ley General de Contratación Pública** governs Costa Rican public procurement.

`[unverified: whether Ley 9986 or its reglamento contains any provision on intellectual property in
deliverables, on ownership of software the State procures, or on any preference for software libre.
This was researched but not confirmed from a fetchable primary text in this pass.]`

What can be said on principle, and should be checked rather than assumed:

- Ownership of IP in procured deliverables is, in most jurisdictions and in most standard contract
  templates, a matter of **the contract**, not the statute. The State takes what the cartel/contract
  says it takes. If a Costa Rican institution contracts for a PuraVidaGov deployment, the IP terms
  will be in that contract, and **that is where the author must be careful** — a standard clause
  assigning all deliverables to the State would, if he signed it, hand over the very thing he is
  trying to keep.
- **This is the single place where a Costa Rican lawyer is genuinely indispensable**, more than for the
  licence choice: reviewing the IP and deliverables clauses of any cartel he bids into, before he
  bids.

`[unverified: whether Costa Rica has any decree, directriz or MICITT/ANGD policy mandating or
preferring software libre in the public sector. I could not confirm one exists, and I could not
confirm one does not. Treat as an open question. Note that `docs/research/legal-cr.md` already covers
adjacent ground (Ley 8454, Ley 8220) and may be the better starting point.]`

---

## 6. Recommendation

### 6.1 The problem no off-the-shelf licence solves

Every candidate leaks in the same place, and it is worth naming precisely because it determines the
drafting.

If the licence permits government use, then when a ministry hires Accenture to deploy PuraVidaGov,
**Accenture's activity is arguably use "by" the permitted user**. The ministry is the licensee; the
integrator is its hands. Scoring the candidates on that exact fact pattern:

- **FSL** — explicit and lost. Permitted Purpose clause 4 names "professional services that you
  provide to a licensee using the Software" (§2.2).
- **ELv2** — explicit and lost. Elastic's own FAQ answers the contractor-installs-for-client scenario
  with "This is permitted under ELv2" (§2.5).
- **BUSL** — depends entirely on how the Additional Use Grant is drafted, and the grant can only add
  rights, never restrict (§2.1).
- **PolyForm Noncommercial** — *probably* caught, because the integrator is a company using the
  software for a commercial purpose, and the "Noncommercial Organizations" clause names institutions,
  not their contractors. But "probably" is not a business plan.

Only PolyForm Noncommercial gets to "probably". Everything else gets to "no".

The fix is to make the grant turn on **who performs the work and whether they are paid for it**, not
only on who benefits. And — critically for BUSL — that fix must be expressed as a *narrower grant*,
never as an added restriction, because BUSL's covenant forbids an Additional Use Grant that "imposes
any additional restriction on the right granted in this License."

### 6.2 Recommended setup

**Code (`/`, excluding `docs/`): PolyForm Noncommercial License 1.0.0**
SPDX: `PolyForm-Noncommercial-1.0.0`

Why this over BUSL, which is the obvious alternative:

- It **names government institutions in the licence text itself**. No Additional Use Grant to draft, no
  ambiguity to argue, nothing for a ministry's legal department to escalate. That is worth a great deal
  when the goal is for institutions to actually run it.
- It has an SPDX identifier, so `package.json`, SBOM tooling and dependency scanners understand it.
- It does not force him to give the code away on a four-year timer. BUSL would.
- It is short, plain-language and reads in five minutes — which matters when the audience is a public
  official, not a licensing lawyer.
- It grants distribution and modification, so the "see, run and evaluate" story survives intact.

Why not BUSL: the mandatory GPL-compatible Change License and hard four-year conversion mean the code
becomes freely commercialisable on a schedule, which is the opposite of R3 — and BUSL says nothing
generic about government, with CockroachDB's AUG showing that the blank can be filled in against
government (§2.1). Why not FSL: it expressly permits the professional-services case. Why not ELv2: its
own FAQ expressly permits the contractor case. Why not AGPL: §4 expressly permits charging — though
see §6.7 for when to reconsider it.

**Cost of this choice, stated plainly:** PolyForm Noncommercial is not OSI-approved, has no conversion
date, fails the Standard for Public Code, and is not an "open source licence" under the Interoperable
Europe Act's Art. 2(12) "for all uses" test. He is trading institutional legitimacy for control. §6.7
argues the other side.

**Documents (`docs/`): CC BY-NC-SA 4.0**
SPDX: `CC-BY-NC-SA-4.0`

The research is the asset (§2.6). CC BY-NC-SA gets him a real attribution requirement (MIT does not),
blocks commercial exploitation, and keeps derivative analysis open. CC BY-ND would be a mistake — it
would stop a ministry adapting the legal analysis into policy, which is the best outcome available.

### 6.3 Files to write

```
/LICENSE                  PolyForm Noncommercial 1.0.0, verbatim from
                          https://polyformproject.org/licenses/noncommercial/1.0.0
                          plus the Required Notice line (below)
/LICENSE-docs             CC BY-NC-SA 4.0 (full legal code or the canonical URL)
/NOTICE                   Authorship, scope of each licence, the MIT-history statement
/COMMERCIAL.md            Who needs a paid licence, what is on offer, how to make contact
/CONTRIBUTING.md          CLA / assignment requirement (see §1.5)
/README.md                Rewrite line 136 into a licensing section
/package.json             line 6 → "SEE LICENSE IN LICENSE"
```

`Required Notice:` line to ship with the PolyForm licence — PolyForm requires this text to travel with
every copy:

```
Required Notice: Copyright (c) 2026 George Chigrichenko — https://github.com/georgeevil/PuraVidaGov
```

**`/NOTICE` content:**

```
PuraVidaGov
Copyright (c) 2026 George Chigrichenko. All rights reserved.

Source code in this repository is licensed under the PolyForm Noncommercial
License 1.0.0 — see LICENSE.

Written material under docs/ is licensed under Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International — see LICENSE-docs.

Commercial licences are available. See COMMERCIAL.md.

Prior licensing. Versions of this project published before <DATE> were released
under the MIT License. That grant is not withdrawn and cannot be withdrawn as to
copies already distributed. It does not extend to any version published on or
after <DATE>.

This is a demonstration system. It is not connected to any Costa Rican
institution and is not legally valid for any trámite.
```

That "Prior licensing" paragraph is not a concession — it is protective. Saying it plainly is what a
buyer's diligence would find anyway, and saying it first is what makes the rest of the licensing look
credible.

### 6.4 The Additional Use Grant — drafted

He does not need an AUG if he adopts PolyForm Noncommercial, because its permitted-purpose clauses
already cover (a), (b) and (c) of what he asked for. What he *does* need is a **supplemental grant**
that closes the contractor gap in §6.1 and states the paid-licence boundary explicitly. This belongs
in `COMMERCIAL.md`, referenced from `NOTICE`, as an additional permission from the licensor — which
is always allowed, since the copyright holder may grant more than the licence does.

If he chooses BUSL instead, the same text goes in the `Additional Use Grant:` parameter, and it works
there because **it is drafted purely as a grant of rights, never as a restriction** — required by
BUSL's covenant.

> **Additional Use Grant.**
>
> In addition to the rights granted by the License, the Licensor grants the following permissions.
> Any use not described below requires a separate commercial licence from the Licensor.
>
> **(a) Public institutions.** Any public institution of the Republic of Costa Rica — including any
> ministry, autonomous or semi-autonomous institution, municipality, public university, or public
> enterprise — may install, run, modify, evaluate and operate the Licensed Work for its own
> institutional purposes, in evaluation and in production, without charge and without limit of time.
> This permission extends to the institution's own employees and to public servants seconded to it.
>
> **(b) Contractors of public institutions — evaluation.** A third party engaged by a public
> institution described in (a) may install, configure, operate and modify the Licensed Work on that
> institution's behalf, and may charge that institution for doing so, **for the purposes of
> evaluation, proof of concept, or pilot deployment, for a period not exceeding twelve (12) months
> from that party's first such use.** The Licensor grants this permission so that a public institution
> may obtain competent technical help in assessing the Licensed Work.
>
> **(c) Contractors of public institutions — production.** Beyond the twelve-month period in (b), or
> for any deployment that is not an evaluation, proof of concept or pilot, a third party that receives
> or expects to receive any fee, consideration or contract award in connection with installing,
> configuring, hosting, operating, maintaining, integrating or supporting the Licensed Work for
> another person requires a separate commercial licence from the Licensor. The permission in (a) is
> granted to the public institution for its own use and does not extend to such a third party.
>
> **(d) Individuals and non-commercial use.** Any natural person may use, study, modify and share the
> Licensed Work for any purpose that is not primarily intended for or directed towards commercial
> advantage or monetary compensation.
>
> **(e) Education and research.** Any educational institution, public or private, and any person
> engaged in academic teaching or non-commercial research, may use, study, modify, share and publish
> the Licensed Work and works derived from it for teaching, study, research and publication.
>
> **(f) Commercial licence required.** Any other commercial use — including offering the Licensed
> Work or any derivative of it as a product or a service, incorporating it into an offering provided
> to third parties for a fee, or providing paid services in connection with it outside the permissions
> above — requires a separate written commercial licence from the Licensor. Enquiries: <contact>.
>
> **(g) No trademark licence.** No permission above grants any right in the Licensor's names, logos or
> trademarks, including "PuraVidaGov".

Notes on the drafting choices, since they are all deliberate:

- **(b) is the compromise that makes (a) real.** A ministry cannot meaningfully evaluate a
  thirteen-service distributed system with no external help. Twelve months is generous enough to be
  used honestly and short enough that a production programme cannot hide inside it. Without (b), the
  licence would be technically compliant with R1 and practically useless.
- **(c) does the actual work.** It reaches the *performer* and the *fee*, not the beneficiary. This is
  the clause that says Accenture pays.
- **(c) will still be argued about.** "In connection with" is doing heavy lifting; a firm bundling
  PuraVidaGov work inside a larger fixed-price contract will say no fee was received "in connection
  with" it. This is a real weakness and no drafting removes it entirely.
- **(d) borrows CC's wording** ("primarily intended for or directed towards commercial advantage or
  monetary compensation") on purpose: it is well-known, widely construed, and consistent with the
  `docs/` licence.
- **(g)** matters more than it looks. Trademark is the durable right (§4.4); nothing here should
  accidentally license it away.

### 6.5 Where a lawyer is genuinely required

Not "consult a lawyer" as boilerplate. These specific questions:

1. **The AI-authorship question (§1.4).** Does Ley 6683 define "autor" as a natural person, and what is
   the status of the fifteen AI-authored commits? Ask this **first** — a licence over a work of
   uncertain copyright is a weak instrument, and the answer may change how he documents everything
   going forward. Cheap to answer.
2. **The contractor clause (§6.4(c)).** Whether a Costa Rican court would read it as drafted, and
   whether it survives as a *grant* rather than being recharacterised as a restriction. Also whether
   any consumer-protection or competition rule constrains it.
3. **Procurement IP clauses (§5.4).** Before he bids into or signs any cartel, someone must read the
   IP and deliverables clauses. A standard assignment-to-the-State clause would hand over exactly what
   this whole memo is about.
4. **Enforceability of a browse-wrap licence in Costa Rica.** PolyForm's Acceptance clause requires
   agreement "as both strict obligations and conditions". Whether that binds someone who merely cloned
   a repository is jurisdiction-specific.
5. **Trademark filing (§5.2).** A local IP firm files this, provides the address for service, and
   answers the fee and timeline questions this memo could not confirm. Small money.

### 6.6 What to do first, in order

1. **Fix the copyright line and add `CONTRIBUTING.md`** — today, before anything else, and regardless
   of which licence he picks. "PuraVidaGov contributors" must become his legal name (§1.5). One commit.
2. **File the trademark in class 42** (§5.2). It is the only right that survives a clean-room
   reimplementation and it is cheap. Do it before any publicity.
3. **Ask a Costa Rican lawyer question 1** (§6.5). Cheap, fast, and it may change the plan.
4. **Then relicense**: PolyForm Noncommercial for code, CC BY-NC-SA 4.0 for `docs/`, with `NOTICE`,
   `COMMERCIAL.md` and the honest MIT-history paragraph.
5. **Keep publishing.** The moat is being the author and staying current (§4.4), and neither of those
   survives going quiet.

### 6.7 The honest counter-argument

It should be on the record, because the case against relicensing is not weak.

X-Road is MIT and its moat is its trademark (§3.3). Every verified government reference implementation
is OSI-licensed (§3.3a). The Standard for Public Code requires an OSI licence and PuraVidaGov would
fail it (§3.1). Under the Interoperable Europe Act's own definition, a "for all uses" test, PolyForm
Noncommercial is not an open source licence (§3.2). A ministry's procurement team meeting a licence
they have not seen before will escalate it, and escalation is where unfunded projects die. The demo's
value is as a conversation-starter, and restrictive licensing makes the conversation harder to start.
Meanwhile the MIT-era fork already exists and cannot be recalled (§1.2), so relicensing buys future
versions only — and the durable assets are trademark, authorship and relationships, none of which need
the licence change at all.

**And the strongest evidence is not the forks — it is that the relicensers reversed.**

| Relicence | Fork it triggered | Outcome |
|---|---|---|
| Terraform → BUSL 1.1, 10 Aug 2023 | OpenTofu, repo public 5 Sep 2023, Linux Foundation project 20 Sep 2023, MPL-2.0 | HashiCorp acquired by IBM; Terraform still BUSL |
| Elasticsearch → SSPL/ELv2, Jan 2021 | OpenSearch, 1.0 GA 12 Jul 2021 (AWS), Apache-2.0; OpenSearch Software Foundation under the LF, 16 Sep 2024 | **Elastic added AGPL back, 29 Aug 2024** |
| Redis → RSALv2/SSPLv1, Mar 2024 | Valkey, 28 Mar 2024, Linux Foundation, BSD-3-Clause, backed by AWS, Google Cloud, Oracle, Ericsson, Snap | **Redis added AGPLv3 back, 1 May 2025** |

Elastic's Shay Banon, 29 August 2024: the company "will be adding AGPL as another license option next
to ELv2 and SSPL in the coming weeks", so that Elasticsearch and Kibana "can be called Open Source
again" because AGPL is OSI-approved
(https://www.elastic.co/blog/elasticsearch-is-open-source-again).

Redis, at the Redis 8 GA on 1 May 2025, gave a reason that lands squarely on this project:

> "**We heard from some customers that it is easier for them to operate under an OSI-approved
> license**, so we've added that option."

(https://redis.io/blog/redis-8-ga/. Redis also renamed the product from "Community Edition" back to
"Open Source".) Redis reversed roughly fourteen months after relicensing and thirteen months after
Valkey forked. Elastic took three and a half years.

Two companies with far more leverage than this project ran the experiment, and both walked it back —
one of them explicitly because *customers* found the non-OSI licence harder to operate under. If
"customers" in that sentence is read as "public institutions", it is a direct warning.

A defensible alternative, if he decides visibility matters more than control: **keep the code under a
permissive or OSI licence, move `docs/` to CC BY-NC-SA 4.0, register the trademark, and sell his time.**
That is, precisely, the NIIS/X-Road model, and it is the only model in this memo with a proven track
record in exactly this domain.

The recommendation in §6.2 is the right answer to the goal *as stated*. §6.7 is the right answer if
the goal turns out to be "get this built in Costa Rica with my name on it."

---

## 7. Gaps — what could not be verified

Listed so the reader knows where to spend their own scepticism. Everything here was attempted, not
skipped.

**Costa Rican law (lowest confidence in this memo):**
- Ley 6683: article numbers for protection of programas de cómputo, the definition of "autor", the
  evidential effect of registration, and the term of protection for software.
- Registro Nacional de Derechos de Autor: registration procedure, fee and timeline for a software work,
  and whether a foreign resident may file directly.
- Ley 7978: whether a local apoderado or domicile is required for a foreign applicant; term and renewal;
  opposition and edicto periods; **current official fees per class**.
- Whether Costa Rica is a Madrid Protocol member — WIPO's member page did not render a list.
- Ley 9986 and its reglamento: whether either addresses IP in deliverables, State ownership of procured
  software, or any software-libre preference. **Also unverified: the reglamento's decree number.**
- Whether any MICITT / ANGD / MIDEPLAN decree or directriz on software libre in the public sector
  exists. Neither existence nor non-existence confirmed.
- Any Costa Rican authority on AI-assisted authorship. None found.

**Licences and policy:**
- Heather Meeker's and Kyle E. Mitchell's authorship of the PolyForm licences is widely reported and
  appears on their own blogs, but is not confirmed anywhere on polyformproject.org.
- PolyForm Perimeter 1.0.0 was not fetched; what changed in 1.0.1 is unknown.
- FSL 1.1's release date and the 1.0 → 1.1 transition were not checked against the repo history.
- CockroachDB's 2019 BSL parameters (change date, change licence) were not verified; the 2024 move to
  its own bespoke licence was not read from the licence text.
- MongoDB's SSPL *rationale* is paraphrase; only the licence header (v1, 16 October 2018) was verified.
- HashiCorp's August 2023 announcement page is behind bot protection; the date is verified but the AUG
  details came from Terraform's LICENSE file, which is the better source anyway.
- IBM appears as Licensor in Terraform's LICENSE; the acquisition date and terms were not verified.
- Whether any BUSL adopter other than CockroachDB excludes government was not surveyed.
- When GitHub ToS section D.9 "Access Reciprocity" was added.
- Whether MIT is legally revocable is genuinely unsettled; §1.2 states the practitioner consensus, not
  a decided rule.
- Successor to the EC Open Source Software Strategy 2020–2023: none found named.
- Germany's ZenDiS/openCode licensing rule and France's SILL inclusion criteria could not be confirmed
  from a primary rules page.
- Uruguay AGESIC, Chile Digital Government and Costa Rican government GitHub organisations: no primary
  source located; the probed organisation names do not exist.
- Whether Brazil's Portal do Software Público uses a Brazilian public-administration licence rather
  than an OSI one.
- Exact OpenSearch *fork announcement* date (only "established 2021" and "1.0 GA 12 July 2021" are
  verified).

**Verified directly and quotable with confidence:** the MIT, BUSL 1.1 (via SPDX's canonical text, not
MariaDB's defective HTML), FSL 1.1, all PolyForm variants cited, Elastic 2.0 and its official FAQ,
AGPL-3.0 §4 and §13, EUPL 1.2 (OJ text) and CC BY-NC-SA 4.0 texts; the SPDX licence list (version dated
2026-09-03) and the OSI approved list; OSD clause 6; OSI's SSPL statement; the Standard for Public Code
licensing criterion; OMB M-16-21; the UK Service Manual; FSFE Public Money Public Code; Uruguay's Ley
19.179; Interoperable Europe Act arts. 2(12), 4(6), 8(3)(d), 8(4); the Commission Decision of
8 December 2021; GitHub ToS D.5, D.6 and D.9; X-Road's LICENSE file and the government-repo licence
table; Fair Source's definition and licence list at fair.io; CC's FAQ on software and its
NonCommercial interpretation wiki; TRIPS art. 9.2 and 10.1; WCT art. 2 and 4; Berne art. 5(2) and Costa
Rica's accession dates; Costa Rica's WTO membership date; the U.S. Copyright Office's January 2025
conclusions; the OpenTofu, OpenSearch and Valkey fork dates and the Elastic and Redis reversals; and
this repository's own licence files, `package.json`, git history and dependency licences.

**Two corrections to widely repeated claims, worth carrying forward:** EUPL 1.2 has no "network
clause" — the word does not appear; the trigger is "providing access to its essential functionalities".
And the Interoperable Europe Act article numbers in circulating secondary summaries are wrong; the
operative provisions are arts. 2(12), 4(6), 8(3)(d), 8(4) and Recital 36.
