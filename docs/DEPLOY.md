# Deploying PuraVidaGov

**Live:** the public site is at <https://sindarvueltas.org> (Cloudflare Pages) and the interactive portal at
<https://demo.sindarvueltas.org> (Cloudflare Containers). Both are deployed from this repo; see §1 and §2 option C.

Three targets, one codebase. Pick by what the audience needs, not by what is cheapest.

| Target | What it is | Cold start | Cost | Use it for |
|---|---|---|---|---|
| **Compose** (`infra/docker-compose.yml`) | 17 containers: 13 agencies + bus + API + web + Caddy | none | your machine | Local demos, CI, showing the architecture |
| **All-in-one** (`infra/Dockerfile.allinone`) | the same 15 Express apps in **one** Node process | 20 s on Cloudflare, up to 60 s on free plans | free tier, or included in Workers Paid | The interactive portal on a public URL |
| **Static** (`npm run build:static`) | the three public pages, **no backend** | none | free | The link you send to legislators and press |

The Compose stack is unchanged and remains the reference architecture: seventeen separate containers are what
make "the institutions are independent and the bus is the only link" visible. Nothing below replaces it.

**The domain is `sindarvueltas.org`**, registered at Cloudflare Registrar on 8 September 2026 and on
Cloudflare nameservers. The apex serves the static case pages; `demo.sindarvueltas.org` serves the
interactive portal. The name is deliberately not a `puravida*` one, because `puravidadigital.go.cr` is the real
Costa Rican national trámites portal — a name and function collision.

Hosting facts below were verified on 8 September 2026 against each provider's own pages. Sources and the
things that could **not** be verified are in `docs/research/hosting-free-tier.md`. Free tiers move; re-check
before you commit to one.

---

## 0. Independent verification of the live deployment

Checked against the public URLs on 8 September 2026, from outside the deploying session.

| URL | Checked | Result |
|---|---|---|
| `https://sindarvueltas.org` | apex, `/por-que`, `/marco-legal`, `/arquitectura`; generated JSON; headless browser | all 200 through the SPA rule; `workflows.json` 12, `registry.json` 13; all thirteen agencies named on `/arquitectura` with no DOWN state; DEMO banner present; **zero console or page errors** |
| `https://demo.sindarvueltas.org` | `/healthz`, then the full journey | `{"status":"ok","mode":"all-in-one","agencies":13}`, and `node scripts/smoke.mjs https://demo.sindarvueltas.org` → **SMOKE OK**: 13 trámites, three citizens, 59 exchanges across 13 institutions, 71.5 s |

WHOIS redaction is on and confirmed: RDAP returns a registrar entity only, with no registrant name, e-mail,
telephone or address.

Both hostnames are proxied, so the origin is not visible in response headers — only `x-powered-by: Express`
leaks from the container. That is why §2 is the only place that records which host actually runs it.

**The Pages project is `sindarvueltas`.** The root `wrangler.jsonc` used to say `puravidagov`, which would
have created a second project with no custom domain attached and left the live site stale, with nothing
failing to say so. Both names now agree; do not reintroduce the old one.

**The deployed static bundle has `VITE_PORTAL_URL=https://demo.sindarvueltas.org` baked in**, so every
"Probar el demo" affordance links to `https://demo.sindarvueltas.org/login`. Correct only while the container
is up — see the `VITE_PORTAL_URL` note in §1 before rebuilding.

---

## 1. The static site — Cloudflare Pages

This is the URL that matters politically, so it must be instant and must not go dark. Cloudflare Pages wins on
all three counts: no documented bandwidth cap (static-asset requests are "free and unlimited"), 500 builds a
month, 100 custom domains, free HTTPS, native SPA fallback, and no term restricting political or governmental
content.

```bash
npm ci
npm run build:static            # → apps/web/dist-static
npx wrangler pages deploy apps/web/dist-static --project-name sindarvueltas
```

Or connect the repo in the Cloudflare dashboard with:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build:static` |
| Build output directory | `apps/web/dist-static` |
| Environment variable | `VITE_PORTAL_URL` = `https://demo.sindarvueltas.org` |
| Custom domain | `sindarvueltas.org` |

**Already configured.** The apex and `www` are attached to the `sindarvueltas` Pages project and the proxied
`CNAME`s to `sindarvueltas.pages.dev` exist. If you ever rebuild this from scratch: attach the domain first
(Pages dashboard → the project → Custom domains, or the Pages domains API), then let it create the record —
hand-creating the CNAME without attaching the domain will not resolve.

`wrangler.jsonc` at the repo root already sets the output directory.

**What the static build contains.** The full "Por qué", "Marco legal" and "Cómo funciona" pages, backed by
five JSON files generated at build time from the same source of truth as the API (`api-static/workflows.json`,
`legal.json`, `registry.json`, `benefits.json`, `activities.json`). No login, no trámites, no audit trail —
those need the backend.

**`VITE_PORTAL_URL`.** Set it and every "Probar el demo" affordance becomes an absolute link to your
interactive deployment, with an honest note that the portal sleeps and the first visit can take a minute.
Leave it unset and those buttons are replaced by one line saying the portal is not deployed. Either way there
are no dead links.

**Gotcha.** Pages' automatic SPA behaviour switches off if the build emits a top-level `404.html`. The
generated `_redirects` (`/*  /index.html  200`) covers it explicitly, so do not delete it.

### Why not the others

- **Netlify.** The free plan is now 300 credits a month, bandwidth costs 20 credits per GB, so roughly **15 GB
  a month** — and at the cap the site is *paused* and serves "Site not available". Free plans cannot buy
  credits. That is the wrong failure mode for a press link.
- **Vercel.** Hobby is "non-commercial personal use only", and their definition of commercial includes
  **anyone being paid to create or maintain the site**. A grant-funded or consultancy-built advocacy site is
  outside Hobby terms. The risk is the funding model, not the politics.
- **GitHub Pages.** No rewrite support: deep links need the `404.html` redirect trick and serve an HTTP 404
  before the redirect. Also bars commerce (not advocacy).

---

## 2. The interactive portal — one container

`scripts/serve-all.mjs` runs the bus and all thirteen agencies on `127.0.0.1` (ports 4000–4013, shift with
`INTERNAL_PORT_BASE`), mounts the portal API, and serves the built SPA. **Only `PORT` is exposed.** The
API → bus → agency calls stay real HTTP, so the audit trail is exactly what the Compose stack produces.

```bash
npm ci && npm run build -w @pvg/web
PORT=8080 npm start
# or
docker build -f infra/Dockerfile.allinone -t puravidagov .
docker run -p 8080:8080 -e AGENCY_LATENCY_MS=150 puravidagov
```

Health check: `GET /healthz` → `{"status":"ok","mode":"all-in-one","agencies":13,...}`. It answers about a
second after the process starts; the rest of any cold start is the platform pulling and scheduling the image.

Set `SESSION_SECRET` in production. Everything else has a demo-safe default; `.env.example` documents the lot.
Nothing is persisted, so a restart resets the demo — which is what you want.

### Option A — Render (simplest, ~1 minute cold start)

`render.yaml` is a ready blueprint: free plan, Docker runtime, health check on `/healthz`, generated
`SESSION_SECRET`. Connect the repo as a Blueprint and Render builds the Dockerfile itself — no registry.

What the free instance actually is: **512 MB RAM, 0.1 CPU, 750 instance-hours per workspace per month**
(744 hours is a full month, so exactly one always-on service). Render spins a free service down after
**15 minutes** idle and documents the wake as **"about one minute"**. Custom domains with managed TLS are
included on free.

The 0.1 CPU makes that wake slower than it sounds. **Pre-warm it before any live demo.** Its virtue is that
there is no card and therefore no way to accidentally incur a bill.

### Option B — Google Cloud Run (genuinely always-free at this volume)

The Always Free grant is 2 M requests, 180,000 vCPU-seconds and 360,000 GiB-seconds a month, with no end date
(revocable on 30 days' notice). Scale-to-zero is the default and there is no idle-reclamation rule.

```bash
gcloud run deploy puravidagov \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 --max-instances 2 \
  --memory 512Mi --cpu 1
```

Three warnings, in order of how much they will cost you:

1. **A billing account with a card is required.** A misconfiguration bills you instead of stopping you:
   `min-instances > 0`, instance-based billing, or a traffic spike past the **1 GB/month** free egress. Set a
   budget alert at $1 and cap `max-instances`.
2. **Custom domain mapping is still Preview** and only in certain regions — `us-central1` and `us-east1` are
   the closest eligible to Costa Rica. The GA alternative is a global load balancer, which is **not free**.
3. `--source` builds through Cloud Build and stores images in Artifact Registry, whose free storage is
   **0.5 GB**. A Node image plus a few retained revisions exceeds that, so set a cleanup policy.

### Option C — Cloudflare Containers (what sindarvueltas.org actually runs)

If you are already paying the $5/month Workers Paid plan, this keeps the static site and the portal on one
platform, one bill and one domain.

```bash
npx wrangler deploy -c infra/cloudflare/wrangler.jsonc
```

`infra/cloudflare/worker.ts` is a Worker whose only job is to hand the request to a container running
`infra/Dockerfile.allinone` — the same image as Option A and B. `infra/cloudflare/wrangler.jsonc` pins it to the
`lite` instance type (1/16 vCPU, 256 MiB, 2 GB disk), `max_instances: 1`, and `sleepAfter = '10m'`.

**Why those numbers.** Measured footprint of the all-in-one after a full thirteen-trámite journey is **79 MiB**, so
256 MiB is ample. The Workers Paid plan includes 25 GiB-hours of memory, 200 GB-hours of disk and 375 vCPU-minutes a
month. At 256 MiB and 2 GB that works out to roughly **100 hours of awake time a month before anything is billed on
top of the $5**, and the same 100 hours is where the CPU allowance lands if the container ever saturated its 1/16
vCPU. A demo that sleeps after ten minutes idle does not come close. Cold start measured at **20 seconds**.

**Keep the ceiling.** `max_instances: 1` is the thing that makes the bill predictable — remove it and a traffic spike
scales out and bills per instance. Watch usage under Workers & Pages → sindarvueltas-portal → Metrics.

Custom domain (`demo.sindarvueltas.org`) is a Worker Custom Domain, not a DNS record you write by hand:

```bash
# once, then Cloudflare manages the record and the certificate
npx wrangler triggers deploy -c infra/cloudflare/wrangler.jsonc
```

Then rebuild the static site so its "Probar el demo" buttons point at it:

```bash
VITE_PORTAL_URL=https://demo.sindarvueltas.org npm run build:static
npx wrangler pages deploy apps/web/dist-static --project-name sindarvueltas
```

### Do not plan around these

- **Koyeb** — the free tier closed to new sign-ups on 17 February 2026 (Mistral AI acquisition).
- **Fly.io** — no free tier, only a 7-day / 2 VM-hour trial; a card is required.
- **Railway** — $1/month of credit, and RAM alone bills at $10/GB/month. Not enough for a running container.
- **Oracle Always Free** — the Ampere allowance was halved in 2026, it is a bare ARM VM you must administer,
  and Oracle documents reclaiming instances that sit under 20 % CPU, network **and** memory for 7 days. An
  idle demo meets all three.
Cloudflare Containers is **not** in this list any more: it is what the demo actually runs (option C). It is
not free — it needs Workers Paid at $5/month — but that $5 buys DNS, the static site, the container and TLS
from one vendor, with no Cloud Run billing risk and no Render cold start.

---

## 3. Custom domains from Cloudflare DNS

Put the static site on the apex or a subdomain and the container on a **separate subdomain**, so the container
can move without touching the apex.

Rules that apply to every host:

- **Grey-cloud (DNS only) while the certificate issues.** All of these validate over HTTP or a DNS challenge
  that Cloudflare's proxy or "Always Use HTTPS" can intercept. Proxy afterwards if you want.
- **SSL/TLS mode Full or Full (strict), never Flexible.** Every one of these origins force-redirects HTTP to
  HTTPS, and Flexible against that is an infinite redirect loop.
- **Do not enable "Flatten all CNAMEs"** while a host is validating a subdomain — the flattened record breaks
  CNAME-based domain verification.
- **Render does not support IPv6**; delete any `AAAA` record for its subdomain.
- **Cloud Run:** turn "Always Use HTTPS" off during domain-mapping validation, then back on.

For this project specifically, the layout is:

| Host | Serves | Record |
|---|---|---|
| `sindarvueltas.org` (apex) and `www` | static case pages, Cloudflare Pages | proxied `CNAME` → `sindarvueltas.pages.dev`, created by attaching the domain to the project |
| `demo.sindarvueltas.org` | the all-in-one container | Worker Custom Domain on `sindarvueltas-portal`; Cloudflare manages the record and the certificate |

`sindarvueltas.org` is its own zone at Cloudflare Registrar, so nothing here touches `denuncia.cr` (whose
registrar NIC.cr needs manual DNS changes) or `cartacaribesur.org` (which hosts other production sites).
That separation is the point: the container can move between hosts by editing one `CNAME`, and neither
existing domain is at risk.

Registrar notes for this domain: it is locked to Cloudflare nameservers, cannot transfer out for 60 days
from registration, and WHOIS redaction is free — worth confirming it is on, since this is an advocacy
project criticising government inaction. Cloudflare publishes no price list anywhere, so the dashboard
search is the only authoritative price; `.org` has flat registry pricing, so unlike `.xyz` or `.site` there
is no promotional first year that renews at a cliff.

---

## 4. Recommended combination

**What is deployed** — and, having now been measured, what to keep:

- **Static** → Cloudflare Pages project `sindarvueltas`, on the apex and `www`.
- **Interactive** → **Cloudflare Containers** (option C) on `demo.sindarvueltas.org`: `lite`, 79 MiB measured
  against a 256 MiB instance, `max_instances: 1`, `sleepAfter: 10m`, 20 s cold start. The two limits are what
  keep the $5 predictable — remove either and a traffic spike becomes a bill.
- Keep `VITE_PORTAL_URL=https://demo.sindarvueltas.org` on the Pages build so the two halves link up, and
  pre-warm the container before any live walkthrough — 20 s is short, but it is not zero.

**Render (option A) and Cloud Run (option B) stay documented as fallbacks**, not recommendations. They run
the same image, so switching is a DNS change plus a redeploy. Take Render if the $5 ever has to go: it cannot
bill you, at the cost of a ~1-minute wake. Take Cloud Run only with a budget alert and a `max-instances` cap,
since it needs a card and a misconfiguration bills instead of stopping.

## 5. What CI already proves

`.github/workflows/ci.yml` builds and exercises all three targets on every pull request: the Compose stack
with the full journey through it, the all-in-one image with the same journey through its single port, and the
static bundle asserted to stand alone with its generated JSON. If a deployment breaks, CI breaks first.

## Correo de contacto — `contact@sindarvueltas.org`

**Live since 8 September 2026**, confirmed by a message from an address that is not the forwarding
destination — which is the only test that proves it, per step 5 below.

The site publishes this address on `/quien-lo-hace`, `/seguimiento` and the footer of every page. **It had to
deliver before those pages shipped**: a published address that bounces costs more credibility than having none, and the whole posture of the
site is that its claims can be checked.

Delivery is Cloudflare Email Routing on the `sindarvueltas.org` zone — free, and the domain is already at
Cloudflare Registrar with Cloudflare nameservers, so nothing else has to move. **This cannot be done from the
build environment**: it needs zone-level DNS permissions that the deploy token deliberately does not carry, and
the destination address has to confirm by clicking a link in its own inbox. So it is done by hand, once:

1. Cloudflare dashboard → the `sindarvueltas.org` zone → **Email** → **Email Routing** → Get started.
2. Cloudflare offers to add the MX and TXT (SPF) records for the zone. **Accept.** Without the MX records the
   address silently does not exist.
3. **Destination addresses** → add the inbox that should receive it → open that inbox and click Cloudflare's
   verification link. Routing does nothing until this is confirmed.
4. **Custom addresses** → create `contact@sindarvueltas.org` → action *Send to an email* → the verified
   destination.
5. Verify from outside: send a message from an address that is not the destination, and confirm it arrives.
   Checking `dig MX sindarvueltas.org` proves the records exist, not that the route works.

Notes worth having in advance:

- Email Routing is **receive-only**. Replying as `contact@sindarvueltas.org` needs the destination provider
  configured to send as that address (in Gmail, *Send mail as* with an SMTP relay). Until then, replies come
  from the personal address, which is a privacy consideration rather than a technical one.
- Adding the MX records makes this zone an email domain. If `sindarvueltas.org` ever needs to *send* mail, add
  SPF, DKIM and DMARC then — do not leave a permissive SPF sitting there in the meantime.
- The address appears in `apps/web/src/content/contacto.ts`, in one place, used by both pages. Change it there.
