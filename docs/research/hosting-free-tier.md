# Free-tier hosting research — PuraVidaGov demo

**Researched: 8 September 2026.** Every claim below was checked against the provider's own
current pricing or documentation page on that date. Where a claim could only be found on a
secondary source, or could not be found at all, it is marked **NOT VERIFIED**. Vendor pages
rarely carry a visible "last updated" stamp; where one exists it is quoted.

**What we are placing:**

- **Part A** — one Docker container, Node 22, ~150–250 MB RAM, no DB, no persistent storage,
  one HTTP port, `/healthz`, 5–15 s startup. Stable public URL, custom domain, HTTPS.
- **Part B** — a built SPA (a few hundred KB + small JSON), SPA fallback (all paths →
  `index.html`), custom domain, HTTPS, **no cold start** — this is the link that goes to
  legislators and press.

Two things changed materially in 2026 and invalidate most older advice: **Koyeb's free tier is
closed to new sign-ups** (Mistral AI acquisition), and **Oracle halved the Always Free Ampere
allowance**. Netlify also moved to a credit model that makes its free plan much smaller than
its reputation suggests. Details below.

---

## 1. Part A — the container. What is genuinely free today?

### Summary table

| Provider | Perpetual free tier for a container? | Resources | Idle behaviour | Cold start | Card required |
|---|---|---|---|---|---|
| **Google Cloud Run** | **Yes** (Always Free, request-based billing) | 180,000 vCPU-s + 360,000 GiB-s + 2M requests/mo | Scales to zero by default | ~1–3 s typical for a small Node image (secondary sources); our 5–15 s boot dominates | Yes (billing account) |
| **Azure Container Apps** | **Yes** (monthly grant per subscription) | 180,000 vCPU-s + 360,000 GiB-s + 2M requests/mo | Scales to zero by default | Not stated by Microsoft; secondary sources 1–3 s small, 15–30 s heavy | Yes (Azure account) |
| **Render** | **Yes** (Free instance) | 512 MB RAM, 0.1 CPU, 750 instance-hours/workspace/mo | Spins down after **15 min** idle | **"about one minute"** (Render's own words) | Not verified |
| **Oracle Cloud Always Free** | **Yes** (a VM, not a container service) | 1,500 OCPU-h + 9,000 GB-h/mo Ampere A1 (= 2 OCPU / 12 GB always-on), or 2× AMD micro (1/8 OCPU, 1 GB), 200 GB block, 10 TB egress | Always on — but **idle instances can be reclaimed** | None (always on) | Yes at signup |
| **Koyeb** | **No — closed to new users since 17 Feb 2026** | (was 512 MB / 0.1 vCPU / 2 GB SSD) | Scaled to zero after 1 h idle | n/a | Yes |
| **Fly.io** | **No** — 7-day / 2 VM-hour trial only | Trial: 2 VM-hours, 10 machines, 4 GB/machine | Trial machines auto-stop after 5 min | n/a | Yes ("all organizations require a credit card on file") |
| **Railway** | Technically yes, but **$1/month of credit** | $1 credit; RAM billed $10/GB/mo, vCPU $20/vCPU/mo | n/a | n/a | Yes ("post-paid card" required) |
| **Cloudflare Containers** | **No** — requires Workers Paid ($5/mo) | Free tier column is "N/A" | Sleeps after a timeout | Not documented | n/a |

### Google Cloud Run — best free container option

- Free tier: **"2 million requests per month", "360,000 GB-seconds of memory, 180,000 vCPU-seconds
  of compute time", "1 GB of outbound data transfer from North America per month"**.
  Source: <https://docs.cloud.google.com/free/docs/free-cloud-features>
- Perpetuity: the page says the Free Tier **"has no end date, but Google reserves the right to
  change the offering… with 30 days' advance notice."** So: free indefinitely, revocable with notice.
- Billing account with a payment method **is required**: *"A Google Cloud billing account is
  required to access the Google Cloud Free Tier."*
- Scale-to-zero is the default. The free tier applies to **request-based billing** (CPU allocated
  only during requests) — if you set `min-instances > 0` or instance-based billing you leave the
  free tier.
- Sizing check: at 0.25 vCPU / 512 MiB the grant covers roughly 720,000 instance-seconds of vCPU
  and 720,000 of memory per month — i.e. **~200 hours of actual request-serving time per month**,
  far beyond what a demo needs. (Arithmetic ours, from the published grant.)
- Cold start: Google documents no number. Secondary sources put a small Node.js container at
  **~0.5–2 s** platform-side; our app's own 5–15 s boot is the dominant term, so budget
  **~10–20 s** for a first hit. Not verified on an official page.
- No documented "suspended after N days idle" rule for Cloud Run. Cloud Run limits:
  no image-size limit, 4-minute startup timeout, 32 GiB max memory.
  Source: <https://docs.cloud.google.com/run/quotas>
- **Egress gotcha: only 1 GB/month of North-America egress is free.** A press-driven traffic spike
  through Cloud Run would bill. This is another reason Part B belongs on Cloudflare, not here.

### Azure Container Apps — the closest equivalent

- *"The first 180,000 vCPU-seconds, 360,000 GiB-seconds, and 2 million HTTP requests per
  subscription per month are free."* — **per subscription, per calendar month**, and
  *"Free usage doesn't appear on your bill."*
  Sources: <https://learn.microsoft.com/en-us/azure/container-apps/billing> (`ms.date` 2025-12-09,
  page updated 2026-03-25) and <https://azure.microsoft.com/en-us/pricing/details/container-apps/>
- Scale to zero: *"An application can be configured to scale to zero replicas when there are no
  requests or events to process. No usage charges apply when an application is scaled to zero."*
  *"By default, applications scale to zero."*
- Cold start: Microsoft has a whole page on it and **states no duration** — *"A cold-start is the
  time-consuming process of pulling your container image, provisioning resources, and starting your
  application code."* Mitigations are image size, registry proximity, custom liveness probes.
  Source: <https://learn.microsoft.com/en-us/azure/container-apps/cold-start> (updated 2026-03-25).
  Numbers in the 1–3 s (small) to 15–30 s (heavy) range come only from secondary blogs — **NOT VERIFIED**.
- Gotcha the billing page flags: *"If you use Container Apps with your own virtual network or your
  apps utilize other Azure resources, additional charges might apply."* An ACA environment is
  normally created with a Log Analytics workspace, which bills separately on ingestion — budget for
  it or pick the "none" logging destination. (The separate-billing point is documented; the
  Log Analytics default is **NOT VERIFIED** on an official page.)
- Note the health-probe carve-out: *"Health probe requests aren't billable"* — so `/healthz`
  polling does not eat the request grant, though probe-driven traffic does keep replicas warm only
  if you set `min-replicas ≥ 1`, which leaves scale-to-zero.

### Render — the simplest, with a one-minute cold start

- *"Render grants 750 Free instance hours to each workspace per calendar month"*; services are
  suspended if the hours run out until the next month.
- *"Render spins down a Free web service that goes 15 minutes without receiving any inbound
  traffic"*, and spin-up takes **"about one minute."**
  Source: <https://render.com/docs/free>
- Free instance = **512 MB RAM, 0.1 CPU**. Source: <https://render.com/docs/compute-plans>
- Free web services **do support custom domains with managed TLS**.
  Source: <https://render.com/docs/custom-domains> and <https://render.com/docs/free>
- Bandwidth and pipeline-minute allowances: the free page defers to
  *"your workspace's Monthly Included Usage"* rather than printing numbers.
  Community/secondary sources say 100 GB bandwidth and 500 build minutes — **NOT VERIFIED**
  on an official page.
- Credit card requirement: **NOT VERIFIED**. Render's docs note that without a payment method on
  file, services are suspended when usage limits are exceeded, but do not say a card is required
  to create a free service.
- Suspension for prolonged inactivity beyond the monthly hour cap: **NOT VERIFIED** — nothing on
  the free-tier page states a "deleted after N days idle" rule for web services. (The 30-day
  expiry applies to free Postgres, which we do not use.)
- Render's own free page notes free services serve a **disallow-all `robots.txt` while asleep** —
  irrelevant for us (Part B is the indexed surface) but worth knowing.

### Oracle Cloud Always Free — most compute, most operational burden, and it shrank

- Current documented Always Free compute: **1,500 OCPU hours/month and 9,000 GB hours/month** of
  Ampere A1 (equivalent to 2 OCPU / 12 GB running continuously), plus up to 2× `VM.Standard.E2.1.Micro`
  (1/8 OCPU, 1 GB each), 200 GB total block volume, **10 TB/month outbound**.
  Source: <https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm>
- **This is half what it used to be.** The long-standing allowance was 4 OCPU / 24 GB. The official
  doc now reads 1,500/9,000, which corroborates the widely reported June-2026 reduction; Oracle
  published no announcement. Reports of an 18 August 2026 termination deadline for over-limit
  instances come from secondary sources (InfoQ, TerminalBytes) — **the reduction is verified from
  Oracle's own doc; the dates and the email notice are NOT VERIFIED.**
  Secondary: <https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/>
- **Idle reclamation is real and is documented.** Oracle may stop and reclaim an Always Free compute
  instance when, over a **7-day period**, all of: CPU utilisation (95th percentile) < 20%,
  network utilisation < 20%, and (A1 shapes) memory utilisation < 20%. A demo container idling at
  a few percent CPU **meets all three conditions**. Same source as above.
- It is a VM: you install Docker, a reverse proxy and certbot yourself, on `aarch64` for A1 — so
  your image must be multi-arch or ARM-built. Nothing scales to zero, nothing cold-starts.
- The perennial *"Out of capacity"* error when creating A1 instances is well known but is a
  community observation — **NOT VERIFIED** on an Oracle page.

### Koyeb — do not plan around it

- Koyeb was acquired by Mistral AI, announced **17 February 2026**. The announcement states new
  users can sign up only for Pro/Scale/Enterprise: *"New users will only be able to sign up for
  those plans"*, and *"If you have an existing organization on an existing plan, nothing will
  change for you."*
  Source: <https://www.koyeb.com/blog/koyeb-is-joining-mistral-ai-to-build-the-future-of-ai-infrastructure>
- The instance and pricing docs still describe the free tier (512 MB / 0.1 vCPU / 2 GB SSD,
  one per organisation, Frankfurt or Washington DC only, scale-to-zero after **1 hour** idle) —
  those pages have not been updated to reflect the closure, which is itself a warning sign.
  Sources: <https://www.koyeb.com/docs/reference/instances>, <https://www.koyeb.com/docs/faqs/pricing>
- **Conclusion: unavailable to a new account, and the surviving platform is being folded into
  Mistral Compute. Exclude.**

### Fly.io — no free tier

- *"2 hours of machine runtime or 7 days of access, whichever comes first"*; 2 total VM hours,
  10 machines max, trial machines auto-stop after 5 minutes; when it ends *"your apps will stop
  running."*  Source: <https://fly.io/docs/about/free-trial/>
- *"All organizations (except for Linked Organizations) require a credit card on file."*
  Source: <https://fly.io/docs/about/pricing/>
- Fly's own community answer is blunt: there is no free account/free tier, only a free trial.
  (Community post, secondary.) **Fly is pay-as-you-go. Exclude for "free indefinitely".**

### Railway — free in name, ~$1/month in substance

- Free plan: *"for running small apps with $1 of free credit per month"*, 0.5 GB RAM, 1 vCPU,
  1 replica, 4 GB image size, images retained 24 hours.
  Source: <https://docs.railway.com/reference/pricing/plans>
- Rates: **$10/GB/month RAM, $20/vCPU/month, $0.05/GB egress.**
  Source: <https://docs.railway.com/reference/pricing>
- Arithmetic: 250 MB always-on ≈ $2.50/month of RAM alone, before any CPU. **$1 does not cover a
  24/7 container.** It could cover a scale-to-zero service, but Railway's app-sleeping/serverless
  behaviour on the Free plan is **NOT VERIFIED** — the pricing docs do not mention it.
- A post-paid card is required ("as of March 30th, Railway requires the use of a post-paid card").
- **Exclude for a permanently-free demo.**

### Cloudflare Containers — not free

- The pricing page shows **"N/A" in the Free column for every resource**; Containers require the
  **Workers Paid plan, $5 USD/month**, which then includes 25 GiB-hours memory, 375 vCPU-minutes,
  200 GB-hours disk.
  Source: <https://developers.cloudflare.com/containers/pricing/>
- Containers do sleep: *"charges stop after the container instance goes to sleep, which can happen
  automatically after a timeout."* Cold-start latency is **not documented**.
- **Exclude for "free", but note: $5/month buys the tidiest single-vendor story, since Part B is
  already on Cloudflare.**

---

## 2. Part B — the static site

| Provider | Bandwidth / usage on free | Builds | Custom domain + HTTPS free | SPA fallback mechanism |
|---|---|---|---|---|
| **Cloudflare Pages** | No documented bandwidth or request cap; static-asset requests are *"free and unlimited"* | **500 builds/month**, 1 concurrent, 20-min timeout | Yes, up to **100 custom domains per project** | Automatic if no top-level `404.html`, or explicit `_redirects`: `/* /index.html 200` |
| **GitHub Pages** | **100 GB/month soft limit**, 1 GB site size | 10 builds/hour soft limit (not applied to Actions workflows) | Yes, Let's Encrypt, "Enforce HTTPS" | **No rewrite support** — only the `404.html` trick (community pattern) |
| **Netlify** | **300 credits/month, hard cap.** Bandwidth = 20 credits/GB → **~15 GB/month** minus 15 credits per production deploy | Build minutes not metered separately; 1 concurrent build | Yes, "Custom domains with SSL" | `_redirects`: `/* /index.html 200` (or `netlify.toml`) |
| **Vercel** | Hobby guideline **up to 100 GB** Fast Data Transfer; 1M edge requests | 100 deployments/day, 2 build vCPUs | Yes, 50 domains per project | `vercel.json` `rewrites` |

### Cloudflare Pages

- Free plan limits: *"500"* builds/month, *"1 build at a time"*, *"Builds will timeout after
  20 minutes"*, *"up to 20,000 files"*, *"25 MiB"* max asset size, *"100"* custom domains per project.
  Source: <https://developers.cloudflare.com/pages/platform/limits/>
- The limits page **does not state a bandwidth cap**, and the Workers pricing page says
  *"Requests to static assets are free and unlimited"* on both Free and Paid, with
  *"no additional charges for data transfer (egress) or throughput (bandwidth)"*.
  Source: <https://developers.cloudflare.com/workers/platform/pricing/>
  (The egress sentence is stated for the Paid plan; the "free and unlimited static assets" line
  covers both. A hard, printed "unlimited bandwidth on Pages Free" statement is
  **NOT VERIFIED** — treat it as very generous rather than contractually unlimited.)
- **SPA fallback, two ways.** Built in: *"Pages' default single-page application behavior matches
  all incoming paths to the root (`/`), allowing you to capture URLs like `/about` or `/help` and
  respond to them from within your SPA"* — this kicks in **when the project has no top-level
  `404.html`**. Source: <https://developers.cloudflare.com/pages/configuration/serving-pages/>
  Explicit: a `_redirects` file containing `/* /index.html 200`. Limits: 2,000 static + 100 dynamic
  rules, 2,100 total, 1,000 chars per line.
  Source: <https://developers.cloudflare.com/pages/configuration/redirects/>
  **Gotcha:** if your build emits a `404.html`, the automatic SPA behaviour switches off — add the
  explicit `_redirects` line rather than relying on the default.

### Netlify — read this before assuming the old free plan

- New accounts since **4 September 2025** are on credit-based plans. The Free plan gets
  **300 credits/month**, they **reset monthly and do not roll over**, and it is a hard limit:
  *"Once your credit balance is completely used up, all of your web projects (sites/apps) are
  paused and visitors to your web projects will find a `Site not available` page at each of your
  web project's URLs."* Free plans **cannot** buy credit packs or enable auto-recharge.
  Source: <https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/>
- Credit rates: **bandwidth 20 credits/GB**, web requests 2 credits per 10,000, **production deploys
  15 credits each**, compute 10 credits/GB-hour. Bandwidth went from 10 to 20 credits/GB in the
  **April 2026** pricing update.
  Sources: as above and <https://www.netlify.com/changelog/2026-04-14-pricing-updates-april-2026/>
- **Arithmetic: 300 credits ÷ 20 = 15 GB of bandwidth per month, and every production deploy costs
  the equivalent of another 0.75 GB.** For a site handed to press, that is a plausible amount to
  blow through in a day — and the failure mode is the site going dark, not a bill.
  **This alone disqualifies Netlify for Part B.**
- SPA fallback: `_redirects` with `/*  /index.html  200`; the 200 makes it a rewrite, and `200!`
  forces it even where a real file exists. `netlify.toml` equivalent documented.
  Source: <https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/>

### GitHub Pages

- *"GitHub Pages source repositories have a recommended limit of 1 GB"*; *"Published GitHub Pages
  sites may be no larger than 1 GB"*; **soft 100 GB/month bandwidth**; **soft 10 builds/hour**
  (does not apply to custom Actions workflows).
  Source: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- HTTPS on custom domains is free and automatic via Let's Encrypt; you tick **Enforce HTTPS**,
  which can take up to 24 h to become available and up to an hour for the site to serve over HTTPS.
  GitHub Pages is available on public repos with GitHub Free.
  Source: <https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https>
- **No rewrites.** GitHub Pages serves static files only; the standard workaround is the
  `404.html` trick — ship a `404.html` that stores the requested path and redirects to `/`, where
  a snippet in `index.html` restores it via `history.replaceState` (the `rafgraph/spa-github-pages`
  pattern). GitHub documents custom 404 pages but **does not document or endorse the SPA trick** —
  **NOT VERIFIED as supported**. It also means every deep link serves an HTTP 404 status before the
  redirect, which is bad for a URL you hand to a journalist or paste into a legislative document.
- **Terms restriction — this one matters.** GitHub Pages *"is not intended for or allowed to be
  used as a free web-hosting service to run your online business, e-commerce site, or any other
  website that is primarily directed at either facilitating commercial transactions."* A
  non-commercial advocacy site is outside that prohibition, but the phrasing is discretionary.

### Vercel

- Hobby included usage: 1M function invocations, 4 CPU-hrs Active CPU, 360 GB-hrs provisioned
  memory, up to 1,000,000 edge requests; guideline **up to 100 GB Fast Data Transfer/month**;
  50 domains per project; 100 deployments/day.
  Sources: <https://vercel.com/docs/plans/hobby> (`last_updated: 2026-08-31`),
  <https://vercel.com/docs/limits/fair-use-guidelines> (`last_updated: 2026-07-29`)
- Exceeding a Hobby limit is also a hard stop: *"in most cases, if you exceed your usage limits on
  the Hobby plan, you will have to wait until 30 days have passed before you can use the feature
  again."*
- SPA fallback: `vercel.json` rewrites —
  ```json
  { "$schema": "https://openapi.vercel.sh/vercel.json",
    "rewrites": [{ "source": "/:path*", "destination": "/index.html" }] }
  ```
  Source: <https://vercel.com/docs/rewrites>. Note `/.well-known` is reserved and cannot be
  rewritten. (The exact SPA catch-all snippet is our construction from the documented
  `source`/`destination` wildcard syntax; Vercel's page does not print an SPA example —
  **the mechanism is verified, the exact snippet is not quoted from Vercel**.)

### Terms: is a political-advocacy / government-adoption demo allowed on these free tiers?

- **Vercel — the real constraint.** *"Hobby teams are restricted to non-commercial personal use
  only. All commercial usage of the platform requires either a Pro or Enterprise plan."* Commercial
  usage is *"any Deployment that is used for the purpose of financial gain of anyone involved in
  any part of the production of the project, including a paid employee or consultant writing the
  code."* Explicitly listed: payment processing, advertising a product or service, **"receiving
  payment to create, update, or host the site"**, affiliate links, ads. And: *"Asking for Donations
  does not fall under commercial usage."*
  Source: <https://vercel.com/docs/limits/fair-use-guidelines>
  **Reading for us:** an unpaid advocacy demo is not commercial. But the moment anyone is *paid* to
  build or maintain it — a consultancy pitching this to an agency, a grant-funded developer — it
  becomes commercial usage by Vercel's own definition and Hobby is no longer permitted. Nothing in
  the guidelines mentions political or governmental content either way. Given that this project's
  whole point is government adoption, **Vercel Hobby is the riskiest of the four**, and the risk is
  the sponsorship model, not the politics.
- **Cloudflare.** The self-serve agreement's plan-specific restriction we could find is
  §2.2.1(h): you may not *"process or collect personal or business credit card information on any
  web property that is receiving Free Services."* We found **no restriction on political,
  advocacy or governmental content**, and no non-commercial-only clause for Pages.
  Source: <https://www.cloudflare.com/terms/>
  Caveat: the long-cited §2.8 limit on serving disproportionate non-HTML content (video, large
  images) did not appear in the version we read — **NOT VERIFIED either way**; our payload is
  HTML/JS/JSON, so it is moot.
- **Netlify.** The Acceptable Use Policy (effective **8 March 2023**) says only that
  *"The Netlify Services and website may only be used for lawful purposes"* and terminates accounts
  using the service *"solely as a remote storage server."* **No political-content restriction and
  no plan-tiered commercial restriction found.**
  Source: <https://www.netlify.com/legal/acceptable-use-policy/>
- **GitHub Pages.** The commercial-transactions prohibition quoted above; nothing about political
  content beyond the general Terms of Service.

**Bottom line on terms:** Cloudflare and Netlify impose no relevant content or commercial limit;
GitHub bars commerce, not advocacy; **Vercel bars any paid involvement in the project** on Hobby.

---

## 3. Custom domains from Cloudflare DNS

You own `denuncia.cr` and `cartacaribesur.org` and run Cloudflare DNS. All four Part A candidates
can be reached by a `CNAME` from a subdomain on the **free** Cloudflare plan. The gotchas differ.

**General shape:** put Part A on a subdomain (`api.denuncia.cr`, `demo.cartacaribesur.org`) and
Part B on the apex or a subdomain. Never put the interactive container on the apex — you want the
freedom to move it.

### Render (documented precisely, and the docs are strict)

Render's Cloudflare guide, <https://render.com/docs/configure-cloudflare-dns>:

- **Set Proxy status to *DNS only* (grey cloud) first**: *"This ensures that requests go to Render
  instead of Cloudflare, so that we can verify the domain and issue a certificate."*
- **Set SSL/TLS encryption mode to *Full*.** (Not Flexible — Flexible would cause a redirect loop
  against Render's automatic HTTP→HTTPS redirect.)
- Only **after** Render shows the certificate as issued may you optionally flip to **Proxied**
  (orange cloud).
- **Remove `AAAA` records**: *"Render does not yet support IPv6 addresses. As a result, `AAAA`
  records can interfere with your custom domain's behavior on Render."*
- CAA records, if you have any, must authorise **Let's Encrypt and Google Trust Services**.
  Source: <https://render.com/docs/custom-domains>

### Google Cloud Run — the awkward one

- Three options: **global external Application Load Balancer (recommended)**, **Cloud Run domain
  mappings (Preview)**, or **Firebase Hosting**.
  Source: <https://docs.cloud.google.com/run/docs/mapping-custom-domains>
- Domain mappings are **"in preview launch stage… not production-ready and are not supported at
  General Availability"**, and only in `asia-east1`, `asia-northeast1`, `asia-southeast1`,
  `europe-north1`, `europe-west1`, `europe-west4`, `us-central1`, `us-east1`, `us-east4`,
  `us-west1`. **Deploy in `us-central1` or `us-east1`** if you want to use them — the closest to
  Costa Rica of the eligible set. `southamerica-*` is not on the list.
- The recommended load balancer is **not free** — a global external ALB carries forwarding-rule and
  data-processing charges. Choosing the ALB route breaks "free indefinitely".
- Google's own warning: *"Some third-party CDN providers might inadvertently intercept validation
  requests"* and specifically that **Cloudflare's "Always Use HTTPS" must be disabled** in SSL/TLS
  settings for domain-mapping validation to succeed.
- Practical free path: subdomain → `CNAME` to `ghs.googlehosted.com` via a Cloud Run domain mapping,
  **grey cloud**, Cloudflare SSL/TLS mode **Full (strict)** if you later proxy. Proxying Cloudflare
  in front of a `*.run.app` URL directly does not work cleanly because Cloud Run routes on the Host
  header; you would need a Worker to rewrite it. **NOT VERIFIED** on an official page — treat the
  Worker workaround as folklore.

### Azure Container Apps

Custom domain + managed certificate on Container Apps requires adding the domain in the portal and
creating a `CNAME` plus a `TXT`/`asuid` validation record. We did **not** verify the current ACA
custom-domain doc in this pass — **NOT VERIFIED**. Assume the same pattern as Render: grey cloud
until the managed certificate issues.

### Cloudflare-side gotchas that apply to all of them

- **Orange cloud vs the host's TLS.** If you proxy, Cloudflare terminates TLS at the edge and makes
  its own connection to the origin. That connection must be HTTPS with a valid cert, so the
  encryption mode must be **Full** (Render's requirement) or **Full (strict)**. **Flexible** will
  produce infinite redirects against any origin that force-redirects HTTP→HTTPS — which all four do.
- **Grey cloud during issuance, always.** Every one of these hosts validates domain ownership over
  HTTP or via a DNS challenge that Cloudflare's proxy or "Always Use HTTPS" can intercept. Turn
  proxying on only after the certificate is live.
- **CNAME flattening at the apex.** Cloudflare *"finds the IP address that a CNAME points to"* and
  *"returns the final IP address instead of a CNAME record"*, which is what lets you `CNAME` the
  apex at all. The documented hazard: *"If a CNAME target is being used to verify a domain for a
  third-party service, turning on CNAME flattening for all CNAME records may cause the verification
  to fail since the CNAME record itself will not be returned directly."* So: **do not set
  "Flatten all CNAMEs"** while a host is validating a subdomain.
  Source: <https://developers.cloudflare.com/dns/cname-flattening/>
- Flattening at the apex also means the apex resolves to whatever IPs the target had at query time.
  For a host that changes IPs (all of these do), keep the apex on Part B (Cloudflare Pages, where a
  custom domain is native and needs no flattening) and give Part A a subdomain.
- `denuncia.cr` already has an existing production role and a `.cr` registrar (NIC.cr) whose DNS
  changes are manual. **Prefer a subdomain of `cartacaribesur.org` for anything experimental** —
  that zone already hosts other production sites, so scope any redirect or page rule to the exact
  host, exactly as the existing `reporta.cartacaribesur.org` rule is scoped.

---

## 4. Recommendation

**Part B (the link you hand to legislators and press): Cloudflare Pages. Not close.**

No documented bandwidth cap, static-asset requests explicitly free and unlimited, 500 builds/month,
100 custom domains, free HTTPS, native SPA fallback, no cold start, and no term restricting
political or governmental use. You already run Cloudflare, so the DNS is a single record with no
validation dance. Netlify's free plan is now roughly **15 GB/month with a hard site-pause** at the
cap — exactly the wrong failure mode for a press link. Vercel Hobby forbids "commercial usage"
defined so as to include *anyone being paid to build the site*. GitHub Pages cannot do a real SPA
rewrite and serves a 404 status on every deep link.

**Part A, first choice: Google Cloud Run.**

Genuinely Always Free at our volume, scales to zero with a documented no-end-date grant, no idle
reclamation, no monthly hour ceiling to exhaust, and container-native (no VM to patch). Deploy in
`us-central1` so the Preview domain mapping is available.

*Failure modes, plainly:*
1. **It needs a billing account with a card.** A misconfiguration — `min-instances=1`,
   instance-based billing, a traffic spike past 1 GB of free monthly egress — bills you rather than
   stopping you. **Set a budget alert at $1 and cap `max-instances` low.** This is the single
   biggest risk in the whole plan.
2. **Custom domain mapping is Preview**, not GA, and region-restricted. The GA alternative (global
   external ALB) costs money. If the Preview mapping is withdrawn, you fall back to the `*.run.app`
   URL or start paying.
3. **Cold start.** Platform overhead is small; our 5–15 s Node boot is the real number. Budget
   ~10–20 s for the first request and warn the audience.
4. Google reserves the right to change the free tier on 30 days' notice.

**Part A, runner-up: Render Free.**

*Why it is the runner-up and not the first choice:* it is dramatically simpler — connect the repo,
Render builds the Dockerfile, custom domain and TLS are one form, and **there is no card and no way
to accidentally incur a bill**. The costs are a documented **~1-minute cold start** after 15 minutes
idle, 512 MB / 0.1 CPU (fine for us), and 750 instance-hours/workspace/month (fine for a
scale-to-zero demo; ~31 days is 744 hours, so it is *exactly* one always-on service and no more).

*Failure modes:* the one-minute wake is on the edge of what a live walkthrough tolerates — it must
be pre-warmed before any demo; 0.1 CPU makes the wake itself slower than the number suggests;
bandwidth and build-minute allowances are not published on the free page; and Render has cut its
free tier before (30 → 15 minute spin-down), so assume it can shrink again.

**The pragmatic answer, if $5/month is ever acceptable:** put Part A on **Cloudflare Containers**
under the Workers Paid plan and keep everything — DNS, Pages, container, TLS — in one vendor you
already administer. That is not "free", but it removes the billing-surprise risk of Cloud Run and
the cold-start risk of Render in one move. Worth naming when you present the options.

**What we would actually deploy:**

- `cartacaribesur.org` or a subdomain → **Cloudflare Pages**, `_redirects` with `/* /index.html 200`.
- `demo.<domain>` → **Cloud Run** (`us-central1`, request-based billing, `min-instances=0`,
  `max-instances=2`, budget alert at $1), with **Render Free as a warm standby** on a second
  subdomain in case Cloud Run's billing or Preview domain mapping becomes a problem.
- Put the cold-start warning in the demo banner, next to the existing DEMO disclaimer.

---

## 5. Things a deployer will trip over

**Build vs. push.**

- **Render** builds your `Dockerfile` itself from a connected Git repo. No registry needed.
- **Cloud Run** can build from source: `gcloud run deploy --source` uses **Cloud Build** and pushes
  to an **Artifact Registry** repo named `cloud-run-source-deploy`. Both are **billed separately**
  from Cloud Run. Free tiers: Cloud Build **2,500 build-minutes/month** (`e2-standard-2`),
  Artifact Registry **0.5 GB storage/month**.
  Sources: <https://docs.cloud.google.com/run/docs/deploying-source-code>,
  <https://docs.cloud.google.com/free/docs/free-cloud-features>
  **Gotcha: 0.5 GB of registry is small.** A Node 22 image is easily 150–400 MB; two or three
  retained revisions blow past the free storage. **Use `node:22-alpine` or distroless, and prune
  old Artifact Registry versions** (or set a cleanup policy) or you will get a small but nonzero bill.
- **Azure Container Apps** normally pulls from a registry (ACR or any public registry). Microsoft's
  cold-start guidance is explicit: *"Use container registries close to your Container Apps
  environment"* — a far-away registry directly lengthens every cold start.
- **Oracle** is a bare VM: you build and run Docker yourself, on **ARM (`aarch64`)** for Ampere A1.
  A `linux/amd64`-only image will not run. Build multi-arch or use the AMD micro shapes (1 GB RAM,
  1/8 OCPU — tight but within our 150–250 MB budget).

**Image size and build time.**

- Cloud Run: *"no direct limit for the size of container images you can deploy"*, but a **4-minute
  startup timeout per container instance** and 32 GiB max memory.
  Source: <https://docs.cloud.google.com/run/quotas>
- Railway free: **4 GB image size**, images retained only **24 hours** (so rollbacks are gone).
- Cloudflare Pages: **20,000 files** per site and **25 MiB** per asset; **20-minute build timeout**,
  1 concurrent build, 500 builds/month.
- GitHub Pages: **1 GB** published site.
- Render free build-minute allowance: not published on the free page — **NOT VERIFIED**.

**Health checks.**

- ACA sets up a liveness probe automatically when ingress is enabled and *"could kill the starting
  application because it fails the liveness probe"* if startup is slow. With a 5–15 s boot,
  **configure a custom liveness/startup probe against `/healthz` with a generous initial delay**, or
  start listening on the port early. Same page notes health-probe requests are not billed.
- Cloud Run's 4-minute startup timeout is generous for us but the health check must answer on
  `$PORT`, which Cloud Run injects — **do not hardcode the port.**

**IPv6 and DNS.**

- **Render does not support IPv6**; its own docs tell you to delete `AAAA` records for the custom
  domain. If Cloudflare has auto-created any, remove them.
- Cloudflare's proxy will happily serve your site over IPv6 to visitors regardless of the origin —
  so proxying (after cert issuance) actually *adds* IPv6 to a v4-only origin.

**TLS mode and redirect loops.**

- Cloudflare **Flexible** SSL + any origin that redirects HTTP→HTTPS = infinite redirect. Render,
  Cloud Run, ACA and Pages all force HTTPS. **Full** (or Full strict) always.
- Cloud Run domain-mapping validation fails if Cloudflare's **"Always Use HTTPS"** is on — turn it
  off during setup and back on after.

**Netlify's failure mode is silence.** At 300 credits the site is *paused* and shows
"Site not available". There is no way to buy your way out on the Free plan. If you use Netlify for
anything, put a monitor on it.

**Oracle's failure mode is deletion.** An idle demo VM meets all three reclamation thresholds
(<20% CPU / network / memory over 7 days). If you go the Oracle route, run something that keeps
utilisation above the line, or accept that the instance can be stopped and reclaimed.

**Things we could not confirm and would check before committing:**

- Whether Render requires a credit card to create a free web service — **not verified**.
- Whether Render suspends free web services after prolonged inactivity (beyond the monthly hour
  cap) — **not verified**; nothing on the free page says so.
- Render's published free bandwidth and build-minute figures (100 GB / 500 min are widely repeated
  but appear only on secondary sites) — **not verified**.
- Azure Container Apps custom-domain procedure and whether an ACA environment forces a billed
  Log Analytics workspace — **not verified**.
- Railway app-sleeping / scale-to-zero on the Free plan — **not verified**.
- Cloudflare Pages having a contractually unlimited bandwidth allowance (as opposed to simply no
  documented cap) — **not verified**.
- Cloud Run cold-start latency for a Node 22 image on an official Google page — **not verified**;
  all figures are from blogs.
- The Oracle 18 August 2026 termination deadline and the customer email — **not verified**; only
  the reduced allowance itself is confirmed, from Oracle's own doc.

---

## Sources

Consulted 8 September 2026. Official pages unless marked *(secondary)*.

**Part A — containers**

- Render, Deploy for Free — <https://render.com/docs/free>
- Render, Compute Plans — <https://render.com/docs/compute-plans>
- Render, Custom Domains — <https://render.com/docs/custom-domains>
- Render, Configuring Cloudflare DNS — <https://render.com/docs/configure-cloudflare-dns>
- Koyeb, "Koyeb is Joining Mistral AI…", 17 Feb 2026 — <https://www.koyeb.com/blog/koyeb-is-joining-mistral-ai-to-build-the-future-of-ai-infrastructure>
- Koyeb, Instances reference — <https://www.koyeb.com/docs/reference/instances>
- Koyeb, Pricing FAQ — <https://www.koyeb.com/docs/faqs/pricing>
- Koyeb, "Sustaining free compute in a hostile environment", 27 Oct 2023 (carries an acquisition disclaimer) — <https://www.koyeb.com/blog/sustaining-free-compute-in-a-hostile-environment>
- Fly.io, Free Trial — <https://fly.io/docs/about/free-trial/>
- Fly.io, Resource Pricing — <https://fly.io/docs/about/pricing/>
- Railway, Plans — <https://docs.railway.com/reference/pricing/plans>
- Railway, Pricing — <https://docs.railway.com/reference/pricing>
- Google Cloud, Free Cloud Features / Free Tier — <https://docs.cloud.google.com/free/docs/free-cloud-features>
- Google Cloud Run, Quotas and limits — <https://docs.cloud.google.com/run/quotas>
- Google Cloud Run, Deploying from source code — <https://docs.cloud.google.com/run/docs/deploying-source-code>
- Google Cloud Run, Mapping custom domains — <https://docs.cloud.google.com/run/docs/mapping-custom-domains>
- Oracle, Always Free Resources — <https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm>
- InfoQ, "Oracle Quietly Halves Free Tier Ampere A1 Compute Limits", Jul 2026 *(secondary)* — <https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/>
- Azure Container Apps pricing — <https://azure.microsoft.com/en-us/pricing/details/container-apps/>
- Azure Container Apps, Billing (ms.date 2025-12-09, updated 2026-03-25) — <https://learn.microsoft.com/en-us/azure/container-apps/billing>
- Azure Container Apps, Reducing cold-start time (updated 2026-03-25) — <https://learn.microsoft.com/en-us/azure/container-apps/cold-start>
- Cloudflare Containers pricing — <https://developers.cloudflare.com/containers/pricing/>

**Part B — static**

- Cloudflare Pages, Limits — <https://developers.cloudflare.com/pages/platform/limits/>
- Cloudflare Pages, Serving Pages (SPA behaviour) — <https://developers.cloudflare.com/pages/configuration/serving-pages/>
- Cloudflare Pages, Redirects — <https://developers.cloudflare.com/pages/configuration/redirects/>
- Cloudflare Workers, Pricing (static assets free and unlimited) — <https://developers.cloudflare.com/workers/platform/pricing/>
- Netlify, How credits work — <https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/>
- Netlify, Pricing — <https://www.netlify.com/pricing/> and <https://www.netlify.com/pricing.md>
- Netlify, Pricing updates April 2026 — <https://www.netlify.com/changelog/2026-04-14-pricing-updates-april-2026/>
- Netlify, Rewrites and proxies — <https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/>
- GitHub Pages, Usage limits — <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- GitHub Pages, Securing your site with HTTPS — <https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https>
- Vercel, Hobby plan (last_updated 2026-08-31) — <https://vercel.com/docs/plans/hobby>
- Vercel, Fair Use Guidelines (last_updated 2026-07-29) — <https://vercel.com/docs/limits/fair-use-guidelines>
- Vercel, Rewrites (last_updated 2026-08-11) — <https://vercel.com/docs/rewrites>

**Terms and DNS**

- Cloudflare, Self-Serve Subscription Agreement — <https://www.cloudflare.com/terms/>
- Cloudflare, CNAME flattening — <https://developers.cloudflare.com/dns/cname-flattening/>
- Netlify, Acceptable Use Policy (effective 8 Mar 2023) — <https://www.netlify.com/legal/acceptable-use-policy/>


---

# Addendum — Cloudflare Registrar (researched 8 September 2026)

Added when choosing the project's domain. Same rule as above: verified against Cloudflare's own pages, with
anything unconfirmed marked NOT VERIFIED.

## The headline: there is no published price list

Checked [products/registrar](https://www.cloudflare.com/products/registrar/),
[tld-policies](https://www.cloudflare.com/tld-policies/), the
[Registrar FAQ](https://developers.cloudflare.com/registrar/faq/) and
[low-cost-domain-names](https://www.cloudflare.com/application-services/solutions/low-cost-domain-names/).
**None of them carries per-TLD prices.** The only figure anywhere is a generic "some costing as little as
$0.99". `domains.cloudflare.com` returns 403 to automated fetches because it is the live search UI.
Cloudflare's own community guidance is that you must check the dashboard search
([thread](https://community.cloudflare.com/t/domain-registration-renewal-price/637491)).

So: no sourced price table is possible, and any that appears elsewhere is someone's stale memory.

## What is verified

| Point | Finding | Source |
|---|---|---|
| New registrations | Direct registration works, not transfer-in only; Free plan is enough; verified email and ASCII-only contact required | [register-domain](https://developers.cloudflare.com/registrar/get-started/register-domain/) |
| "At cost" | "you pay the registry and ICANN list price with no markup" — the ICANN fee is passed through, not absorbed | [FAQ](https://developers.cloudflare.com/registrar/faq/) |
| Renewal | Auto-renew on by default; "renew at the list price set by the registry"; renewals non-refundable; 1–10 year terms | [renew-domains](https://developers.cloudflare.com/registrar/account-options/renew-domains/) |
| No year-1 trap **from Cloudflare** | Zero margin on year 1 and renewals alike, so renewal ≈ registration by construction. The trap that remains is registry-side promos (XYZ, Radix: `.xyz`, `.site`, `.online`, `.space`, `.website`) passed straight through. `.com`/`.org`/`.net` have flat registry pricing. Specific promo deltas: **NOT VERIFIED** | [FAQ](https://developers.cloudflare.com/registrar/faq/) |
| WHOIS privacy | Free, ICANN-compliant redaction of name, email and postal address. On-by-default for new registrations: **partially NOT VERIFIED**, confirm in settings | [whois-redaction](https://developers.cloudflare.com/registrar/account-options/whois-redaction/) |
| **`.cr` support** | **Not supported.** Absent from the TLD table; NIC.cr is the only path | [tld-policies](https://www.cloudflare.com/tld-policies/) |
| Nameserver lock | "You will not be able to change to another DNS provider's nameservers while using Cloudflare Registrar" | [register-domain](https://developers.cloudflare.com/registrar/get-started/register-domain/) |
| 60-day transfer-out lock | ICANN rule: no transfer within 60 days of registration, transfer, or a registrant WHOIS change | [transfer-out](https://developers.cloudflare.com/registrar/account-options/transfer-out-from-cloudflare/) |
| Expiry timeline | Days 1–30 grace (still resolves); **31–40 suspended, site goes dark**; 41–70 redemption with a restore fee; 71–75 pending delete; 76+ released | [FAQ](https://developers.cloudflare.com/registrar/faq/) |
| Pages custom domains | Work with no extra steps on a Registrar domain, but must be added **in the Pages dashboard** — a hand-created CNAME will not resolve | [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/) |
| No IDN | No accented characters | [register-domain](https://developers.cloudflare.com/registrar/get-started/register-domain/) |
| `.dev` / `.app` | HSTS-preloaded by Google Registry, HTTPS mandatory forever. Cloudflare's table only links to Google's policy: **NOT VERIFIED on a Cloudflare page** | [tld-policies](https://www.cloudflare.com/tld-policies/) |
| `.us` | Registry forbids WHOIS privacy and requires a US nexus — avoid for an advocacy project | [us-domains](https://developers.cloudflare.com/registrar/top-level-domains/us-domains/) |

## Name collisions found while checking availability

Not a hosting fact, but the most consequential finding of this pass, so it is recorded here with its sources:

- **`puravidadigital.go.cr` is the real national trámites portal** (MICITT, IDB-supported), plus a companion
  "Pura Vida Móvil" app. Same name family *and* same function as this demo.
  ([Presidencia](https://www.presidencia.go.cr/comunicados/2019/11/micitt-lanza-portal-nacional-pura-vida-digital/),
  [MICITT](https://www.micitt.go.cr/pura-vida-movil),
  [La República](https://www.larepublica.net/noticia/portal-pura-vida-digital-le-permite-hacer-en-linea-tramites-de-instituciones-publicas))
- **`gobiernoabierto.go.cr`** is a live government open-government initiative.
- Anything containing `gov`/`gob` reads as official; `.gov` is US-restricted and `.gob.cr` is NIC.cr-controlled.

The decision log recording what was chosen is kept privately.
