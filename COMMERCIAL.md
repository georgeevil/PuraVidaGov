# Commercial licensing

The code in this repository is under the [PolyForm Noncommercial License 1.0.0](LICENSE). The research and
the argument — `docs/research/`, `docs/LEGAL.md`, `docs/CASE.md` and the Spanish page copy — are under
[CC BY-NC-SA 4.0](LICENSE-docs). The program's own technical documentation follows the code licence, because
Ley 6683 art. 4 treats it as part of the program. This page says who needs something else.

## You do not need a commercial licence

- **Any government institution**, in Costa Rica or elsewhere, running or evaluating this software. The
  PolyForm licence names government institutions as a permitted purpose, "regardless of the source of
  funding". A ministry can deploy it, modify it, and put it in front of citizens without asking anyone.
- **Universities, public research organisations, charities, and public health or safety organisations**,
  named on the same terms.
- **Anyone using it personally** — studying it, running it, experimenting, or building on it without an
  anticipated commercial application.
- **Reading, quoting and criticising the research**, with attribution, for any noncommercial purpose.

If you are in one of those groups, take it and use it. Nothing below applies to you.

## You do need a commercial licence

- **Systems integrators and consultancies** delivering, deploying, customising or operating this software
  as part of a paid engagement — including where the client is a government institution. The client's
  permission does not extend to a contractor being paid to do the work.
- **Anyone selling** a product, a hosted service or a support offering that includes this software or a
  derivative of it.
- **Anyone reusing the research commercially** — for example in a paid report, a proposal, or a
  consultancy deliverable.

This is the point of the licence. A ministry should be able to run this for free. A firm billing that
ministry to deploy it should not get the work for free.

## What a commercial licence costs

Priced per deployment, not per seat and not per line of revenue. A percentage of your engagement fee would
mean auditing your books, which neither of us wants; a flat figure per deployment is checkable by both sides
and needs no accountant.

| | |
|---|---|
| **Per-deployment licence** | TBD, once per deployment. Perpetual for that deployment at the version delivered. |
| **Annual renewal** | TBD per deployment per year, for as long as it runs. Covers updates and the right to keep operating it. |
| **Firm-wide annual licence** | TBD per year. Unlimited deployments; worth it from roughly the fourth concurrent deployment. |
| **Co-delivery** | No licence fee. The author joins the engagement on normal professional terms instead. |
| **Exclusivity or ownership** of some part | By negotiation. Say what you need and why. |

Rates are the same whoever the client is. A licence bought for a ministry costs what one bought for a bank costs.

### What counts as one deployment

**One client, one set of environments.** Everything you run for a single client organisation — production plus
whatever staging, test and demo environments serve it — is one deployment and attracts one fee. A second client
is a second deployment, even if you reuse the same build, the same pipeline and the same people.

Splitting one client's system into several instances to make it cheaper is not how this works, and neither is
running one instance for several clients to make it cheaper. If your architecture genuinely does not fit the
unit — a shared multi-tenant platform, say — say so and we will price the actual shape of it.

### Telling me about a deployment

**Write to me before it goes live**, naming the client, the environments and the intended go-live date. That is
the whole administrative burden, and it is a condition of the licence rather than a courtesy: a per-deployment
fee nobody reports is not a fee.

There is no audit clause, no telemetry and no licence key. The software does not phone home and it never will —
it would contradict the demo's own argument about what public systems should do with people's data. The model
runs on you telling me, which is why the figures are set where a firm can pay them without a conversation with
its finance department.

## Contact

Open an issue at <https://github.com/georgeevil/PuraVidaGov/issues> saying what you want to do, or reach the
author through the contact details on <https://sindarvueltas.org/quien-lo-hace>.

## Two things worth stating plainly

**The MIT history.** Every version up to and including commit `7efbf07` was MIT licensed, and that grant cannot be withdrawn for
copies already distributed. Anyone can fork that commit. The current licence governs everything after it.
Saying so up front is more useful than letting a lawyer discover it.

**What the licence does not cover.** Copyright protects this particular expression, not the idea. Anyone is
free to build a once-only life-event portal for Costa Rica, and the legal conclusions in `docs/` describe
public law that belongs to everyone. What is actually hard to reproduce is the research and the judgement
behind it — and that is why the more useful conversation is usually about working together rather than
about the licence.
