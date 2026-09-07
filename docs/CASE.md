# The case for an integrated digital government in Costa Rica

This is the argument the `/por-que` page makes, with its sources. It answers two questions: *how can Costa Rica make
government more budget-efficient by integrating its platforms across ministries, agencies and municipalities?* and
*could the automation benefits eventually lower taxes?* Short answer to the second: yes, but only after integration,
process redesign and independently verified savings, and only through a rule written into law. Sources: `docs/research/`.
Portal copy: `apps/web/src/content/case.ts`.

## 1. The problem is not technology

Costa Rica already runs firma digital (Ley 8454, 2005), SICOP (mandatory by Ley 9986 art. 16), TRIBU-CR (October
2025), the CCSS Oficina Virtual, EDUS, the CFIA's APC and, since September 2025, the TSE's digital identity (IDC). The
Government has even chosen X-Road as its national interoperability platform (project Conecta, March 2026, 30
institutions, first pilot June 2026). What is missing is the layer that obliges these systems to talk to each other
and the rule that stops institutions from asking citizens for what the State already holds.

The result is measurable. Starting a business took 10 procedures and 23 days (World Bank Doing Business 2020, rank
144 of 190); a construction permit 17 procedures and 138 days. Costa Rica scored lowest of 33 countries in the OECD's
2023 Digital Government Index (0.22 against an average of 0.61) and ranks 61st of 193 in the UN's 2024 e-government
index, behind Uruguay (25th). In Latin America a trámite takes 5.4 hours on average, one in four needs three or more
interactions, 89 % are done in person and 29 % of people report paying a bribe; the digital version costs 1.5–5 % of
the in-person one (IDB, *El fin del trámite eterno*, 2018). Costa Rica is the region's second best on hours, yet only
7 % of people did their last trámite online.

Ley 8220 has prohibited since 2002 asking for documents another institution holds (arts. 2 and 8). It is broken daily,
not from bad faith, but because there is no channel through which Hacienda can ask the Registro Civil. MICITT's own
2025 interoperability report names as a risk the "lack of a binding legal framework obliging autonomous institutions
and municipalities to interoperate".

## 2. What the reference countries actually did

- **Estonia** did not invent technology; it legislated. The Public Information Act makes X-Road mandatory for every
  state and municipal database (§43⁹(3)), fixes once-only as a principle (§43¹(3)), bans duplicate databases (§43³(2))
  and designates base registries (§43⁶). About 1,500 organisations exchange 600 million queries a year; RIA's own
  method values the citizen-initiated 3 % of that traffic at roughly 1,000 working years saved per year. The widely
  quoted "2 % of GDP" is a 2002 expectation, never a measurement.
- **Singapore** authorised sharing by ministerial direction with criminal penalties for misuse (PSGA 2018, ss. 6–8),
  set measurable targets (100 % of services pre-filled with government-verified data; 90–95 % of transactions digital)
  and reports 99 % digital transactions and 83 % satisfaction. MyInfo's "tell us once" is consent-based per data item.
- **The EU** made cross-border once-only mandatory at the citizen's request with a preview (Regulation 2018/1724
  art. 14, live December 2023; justified with up to €5 billion a year in savings) and, with eIDAS 2 (2024), obliges
  public bodies and regulated sectors to accept a national digital identity wallet whose transaction log the person
  can see.
- **Uruguay** (Ley 18.719 arts. 157–160, AGESIC with binding dispute powers) and **Brazil** (Lei 14.129/2021 art. 3
  XIII, art. 24 IV) are the regional precedents.

## 3. The sequence

Integrate first, reengineer processes, measure verified savings, then use part of the savings for relief.

1. **Backbone**: one national digital identity that every entity must accept (IDC by statute, not by TSE resolution)
   and a mandatory interoperability bus with designated base registries. Law needed: an interoperability and base
   registries act modelled on Estonia's databases chapter and Brazil's Lei 14.129.
2. **One front door** by life events: start a business, I had a child, I am building, I moved, I lost my job, I am
   retiring. Quick wins: business in 1–3 days; construction permits through APC with all 84 municipalities; a single
   beneficiary registry for social programmes (SINIRUBE already exists); pre-filled VAT and income tax from electronic
   invoicing.
3. **Shared services and government cloud**: one payroll and HR system for central government, one accounting and
   treasury system under Hacienda, automation of repetitive back-office work. Law needed: a shared-services mandate
   with sanctions for unnecessary duplication.
4. **Procurement**: SICOP is mandatory; exploit it with e-catalogues, framework agreements, price analytics, open
   contract data and automatic invoice verification. E-procurement reforms save 5–20 % of procurement spend
   (European Commission; KONEPS in Korea; Prozorro in Ukraine).
5. **Governance**: a digital government authority with real power over IT budgets; every major IT project must show
   process redesign, expected savings, integration with the bus and measurable KPIs. Law needed: a Digital Efficiency
   Act (mandatory interoperability, once-only, digital-first but not digital-only, shared services, open standards,
   cybersecurity, data protection, penalties).
6. **Municipalities and autonomous institutions**: mandatory use of the identity, the bus and SICOP (the Ley 9986
   template); a shared municipal platform for small cantons; open municipal finances. Law needed: Código Municipal
   and patente-law reform.
7. **Financing**: IDB, World Bank or CAF loans for digital government; a transformation fund fed by part of the future
   savings; business cases per institution; 5–10 year phasing.
8. **The digital dividend**: once savings are verified by the Contraloría, a statutory allocation rule.

## 4. The digital dividend rule

Costa Rica closed 2025 with central government debt at 60.4 % of GDP, interest at 4.4 % of GDP and remuneration at
5.5 % (₡2.9 trillion) (Hacienda, CP-06-2026). Automation lowers the cost per transaction, but savings appear gradually.
Promising tax cuts before measuring would be irresponsible; never sharing them would be unfair. The proposal:

| Share | Destination |
|---|---|
| 40 % | Debt reduction and fiscal stabilisation |
| 30 % | Reinvestment in digital services and cybersecurity |
| 20 % | Direct tax relief or avoidance of future tax increases |
| 10 % | Digital inclusion: connectivity, training, assisted channels |

Best later reliefs: lower employer social charges to formalise employment; simpler VAT for small businesses; lower
municipal fees once municipalities are more efficient. Avoid broad income-tax cuts until debt is clearly under control.

**Honesty note.** No jurisdiction has tied verified digital savings to a fund or tax relief by law. The nearest
precedent is Denmark's mandatory Digital Post: half the estimated savings were deducted from municipal block grants
in advance, and the national auditor (Rigsrevisionen 9/2015) later found the savings over-estimated. The UK's GDS
savings claims were likewise judged "hard to follow" by the NAO (2017). That is why the rule distributes only
*verified* savings, measured after the fact.

## 5. Realistic savings potential

International experience points to 15–30 % lower administrative cost in the processes digitalisation actually
touches. For Costa Rica a credible long-term target is 0.5–1.5 % of GDP per year after 5–10 years, of which
e-procurement alone could contribute 0.3–0.7 %. On a 2025 nominal GDP of about ₡51.8 trillion (IMF; Hacienda), 0.5 %
is roughly ₡259 billion a year. These are estimates, not measurements; the calculator on `/por-que` lets the audience
move the percentage.

## 6. Avoid the common failures

Do not digitise a bad process; reengineer first. Do not build one giant custom system; use open standards, APIs and
modular platforms. Do not exclude people: keep telephone, in-person and assisted channels. Do not underestimate
cybersecurity. Do not let each ministry buy its own system.

## 7. What we ask

- **Asamblea Legislativa**: a Digital Efficiency Act with mandatory interoperability, once-only with sanctions, a
  digital identity every entity must accept, and a digital-dividend rule.
- **Poder Ejecutivo**: a decree designating base registries (TSE, Registro Nacional, Hacienda, CCSS) and giving the
  ANGD power over IT spending.
- **Autonomous institutions and municipalities**: connect to the bus as they connected to SICOP.
- **Citizens**: demand compliance with Ley 8220. Every time an institution asks for a certificate another one issues,
  it is breaking article 8 of a 2002 law.
