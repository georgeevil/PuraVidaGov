# Deploying PuraVidaGov, including on free tiers

Three targets, one codebase. Pick by what the audience needs, not by what is cheapest.

| Target | What it is | Cold start | Cost | Use it for |
|---|---|---|---|---|
| **Compose** (`infra/docker-compose.yml`) | 12 containers, one per institution + Caddy | none | your machine | Local demos, CI, showing the architecture |
| **All-in-one** (`infra/Dockerfile.allinone`) | the same 12 Express apps in **one** Node process | 10–60 s on free plans | free tier | The interactive portal on a public URL |
| **Static** (`npm run build:static`) | the three public pages, **no backend** | none | free | The link you send to legislators and press |

The Compose stack is unchanged and remains the reference architecture: twelve separate containers are what
make "the institutions are independent and the bus is the only link" visible. Nothing below replaces it.

**The domain is `sindarvueltas.org`**, registered at Cloudflare Registrar on 8 September 2026 and on
Cloudflare nameservers. The apex serves the static case pages; `demo.sindarvueltas.org` serves the
interactive portal. Why that name and not a `puravida*` one: `docs/DECISIONS.md` D-021.

Hosting facts below were verified on 8 September 2026 against each provider's own pages. Sources and the
things that could **not** be verified are in `docs/research/hosting-free-tier.md`. Free tiers move; re-check
before you commit to one.

---

## 1. The static site — Cloudflare Pages

This is the URL that matters politically, so it must be instant and must not go dark. Cloudflare Pages wins on
all three counts: no documented bandwidth cap (static-asset requests are "free and unlimited"), 500 builds a
month, 100 custom domains, free HTTPS, native SPA fallback, and no term restricting political or governmental
content.

```bash
npm ci
npm run build:static            # → apps/web/dist-static
npx wrangler pages deploy apps/web/dist-static --project-name puravidagov
```

Or connect the repo in the Cloudflare dashboard with:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build:static` |
| Build output directory | `apps/web/dist-static` |
| Environment variable | `VITE_PORTAL_URL` = `https://demo.sindarvueltas.org` |
| Custom domain | `sindarvueltas.org` |

**Add the custom domain in the Pages dashboard** (Workers & Pages → the project → Custom domains), which
creates the record for you. Hand-creating the CNAME instead will not resolve.

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

`scripts/serve-all.mjs` runs the bus and all thirteen agencies on `127.0.0.1` (ports 4000–4010, shift with
`INTERNAL_PORT_BASE`), mounts the portal API, and serves the built SPA. **Only `PORT` is exposed.** The
API → bus → agency calls stay real HTTP, so the audit trail is exactly what the Compose stack produces.

```bash
npm ci && npm run build -w @pvg/web
PORT=8080 npm start
# or
docker build -f infra/Dockerfile.allinone -t puravidagov .
docker run -p 8080:8080 -e AGENCY_LATENCY_MS=150 puravidagov
```

Health check: `GET /healthz` → `{"status":"ok","mode":"all-in-one","agencies":10,...}`. It answers about a
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

### Do not plan around these

- **Koyeb** — the free tier closed to new sign-ups on 17 February 2026 (Mistral AI acquisition).
- **Fly.io** — no free tier, only a 7-day / 2 VM-hour trial; a card is required.
- **Railway** — $1/month of credit, and RAM alone bills at $10/GB/month. Not enough for a running container.
- **Oracle Always Free** — the Ampere allowance was halved in 2026, it is a bare ARM VM you must administer,
  and Oracle documents reclaiming instances that sit under 20 % CPU, network **and** memory for 7 days. An
  idle demo meets all three.
- **Cloudflare Containers** — not free; requires Workers Paid at $5/month. Worth knowing anyway: if $5 is ever
  acceptable, it puts DNS, the static site, the container and TLS with one vendor you already run, and removes
  both the Cloud Run billing risk and the Render cold start.

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
| `sindarvueltas.org` (apex) | static case pages, Cloudflare Pages | added via the Pages dashboard |
| `demo.sindarvueltas.org` | the all-in-one container | `CNAME` to the host, grey-cloud until its cert issues |

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

- **Static** → Cloudflare Pages on `sindarvueltas.org`.
- **Interactive** → `demo.sindarvueltas.org`. Use **Render free** (via `render.yaml`) unless you want to put
  a card on file: it cannot bill you, at the cost of a ~1-minute wake after 15 minutes idle, which the
  static site already warns about next to every portal link. **Cloud Run** in `us-central1` is the swap if
  you would rather have no cold start; both run the same image and switching is one `CNAME` edit.
- Set `VITE_PORTAL_URL=https://demo.sindarvueltas.org` on the Pages build so the two halves link up, and
  pre-warm the container before any live walkthrough.

## 5. What CI already proves

`.github/workflows/ci.yml` builds and exercises all three targets on every pull request: the Compose stack
with the full journey through it, the all-in-one image with the same journey through its single port, and the
static bundle asserted to stand alone with its generated JSON. If a deployment breaks, CI breaks first.
