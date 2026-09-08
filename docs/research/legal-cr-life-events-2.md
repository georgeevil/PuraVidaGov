# Costa Rica legal / policy research — life events, part 2

Research date: 7 September 2026. Companion to `legal-cr.md` (same method, same legend); written for the PuraVidaGov
demo (portal → orchestrator → interoperability bus → agencies). Every claim below carries the URL it was checked
against on the research date; items that could not be confirmed are marked **not verified**. Spanish law names and
domain nouns stay in Spanish; commentary is in English.

**Verification notes on method and on the confidence of this file.** The research plan was one researcher per life
event plus one for cross-cutting statistics, with primary-source checks by the coordinating researcher. The session's
web-search quota was exhausted early in the run and the eight parallel researchers had not returned by the time this
file had to be written, so **this version rests only on the sources the coordinating researcher opened directly**:
law texts parsed locally from PDF (Ley 8764 from asamblea.go.cr; the TSE requisitos sheet for inscripción de
defunción; the PGR notarial-requirements sheet for vehicle traspasos; the Registro Nacional slide deck on traspasos;
CONAPDIS resolución DE-RAR-338-2026), the delfino.cr bill tracker, the CCSS trámites catalogue, and a handful of
press pieces. Everything else — including several article numbers, rates and platform names that the task brief
itself hedged — is marked **not verified** in the sentence where it appears and collected in a "Could not verify"
list per event. Sections 1, 4, 6 and 7 are the best-sourced; sections 2, 3, 5 and 8 are the thinnest. As in the
companion file: pgrweb.go.cr/SCIJ redirects to sinalevi.go.cr, which renders through JavaScript and cannot be read by
the fetch tool; tse.go.cr PDFs were readable, its HTML pages are behind a bot-manager; migracion.go.cr and
publications.iadb.org returned HTTP 403; csv.go.cr (COSEVI) sits behind a Radware bot-manager; tramitescr.meic.go.cr
has a self-signed certificate and is a JavaScript app.

**Legend** (the code's `LegalStatus` vocabulary): **HOY** = exists as a digital service with a legal basis;
**PARCIAL** = digital but siloed (separate login, paper fallback, certificate carried by the citizen, consent/convenio
dependent) or in person only; **LEY** = no legal basis for an automatic once-only flow — **LEY (decreto)** when an
executive decree or institutional reglamento would suffice, **LEY (estatuto)** when a statute is needed (constitutional
autonomy of TSE, CCSS, municipalities and universities; taxes; Ley 8968 art. 14 / Ley 8220 art. 2 para. 2 consent).

Cross-cutting facts already established in `legal-cr.md` and relied on here without re-citation: Ley 8220 art. 2
(intra-entity once-only), art. 8 (coordination duty "por los medios a su alcance"); Ley 8968 art. 5 c) ("disposición
legal" exception) and art. 14 (transfer needs express consent); Ley 9943 (ANGD; no once-only rule); IDC (TSE digital
identity, mandatory acceptance 1 Jan 2027 by TSE resolución); TSE hospital birth registration online since 2016
(Ley 3504, registradores auxiliares); CCSS IVM vejez fully online since 21 July 2025; Ley 7983 arts. 3 and 6 (FCL).

---

## 1. Death of a relative ("Falleció un familiar")

### (a) The procedure today

- **Medical certificate and civil inscription — one step when the death is in a hospital.** The TSE trámite
  "Inscripción de defunción ocurrida en el país" requires the declarant's valid identity document, the "Certificado
  médico original, cuando proceda", and an email address/phone for notifications; it is **free** and resolved in
  **8 días hábiles** from receipt at the Sección de Inscripciones (Oficinas Centrales, San José, or regional offices).
  Its own note reads: "Para realizar la inscripción a través del sistema 'Defunción en Línea', la persona profesional
  en medicina debe contar con la investidura de registrador auxiliar ante el Registro Civil y encontrarse habilitada
  para utilizar el sistema de SEDIMEC." — https://www.tse.go.cr/pdf/requisitosytramites/Inscripcion-de-defuncion-ocurrida-en-el-pais.pdf
  (PDF parsed locally). So yes: like births, deaths certified by a physician who is a *registrador auxiliar* are
  declared electronically, through the Colegio de Médicos' SEDIMEC (the same system that carries the driving-licence
  dictamen, see `legal-cr.md` B.6).
- **Origin of the electronic death certificate:** announced 29 May 2018 by the Colegio de Médicos y Cirujanos with
  the TSE and the CCSS; pilot at Hospital San Vicente de Paúl (Heredia) and one private hospital; transition of
  3 months for private physicians and 12 months for CCSS physicians, after which only the electronic certificate is
  accepted — https://crhoy.com/nacionales/certificado-de-defuncion-sera-emitido-de-forma-electronica/ (press).
  Current share of deaths declared through "Defunción en Línea" and whether the hospital declaration also removes
  the person from the padrón and flags the cédula: **not verified** (a search-engine summary of TSE material said the
  Registro Civil uses the record for "exclusión del padrón electoral" and the "estado de fallecido" in public
  consultation, but the TSE page itself could not be opened).
- **Deaths outside hospitals** (home, accident): the family or the funeral home files the paper form and the
  physician's or Medicatura Forense certificate at a TSE office — same TSE sheet ("Formulario de declaración de
  defunción, cuando proceda"). Role of the OIJ/Medicatura Forense in violent deaths: **not verified**.
- **Burial / cremation permit.** The funeral home needs the death certificate and the cemetery (municipal or
  private) applies the Reglamento General de Cementerios; the decree number (the brief suggests 32833-S) and whether
  the Ministerio de Salud issues a separate permit: **not verified** — no primary source opened.
- **CCSS pensión por muerte (IVM: viudez, orfandad, padres).** The CCSS trámites catalogue lists "Solicitud Pensión
  por Muerte" as a trámite, alongside "Solicitud Pensión RNC por Vejez, Invalidez, Viudez, Orfandad, Indigencia y
  Ley 8769" for the non-contributory scheme — https://www.ccss.sa.cr/tramites. Whether the death pension can be
  requested in Oficina Virtual (as vejez can since July 2025), which TSE certificates the survivor must bring
  (defunción, matrimonio, nacimiento of children) versus what CCSS pulls from the TSE padrón, and the resolution
  time: **not verified** (the ficha pages were not opened).
- **ROP / FCL to beneficiaries.** Ley 7983 governs; the operadora pays the balance to the beneficiaries designated
  by the affiliate or, failing that, to the heirs (article number **not verified** — the SUPEN PDF was not re-opened
  for this section). Whether SUPEN or the operadoras learn of the death from the TSE automatically: **not verified**.
- **Succession.** Proceso sucesorio notarial (Código Notarial, Ley 7764) vs judicial (Código Procesal Civil,
  Ley 9342, 2016, in force 2018): conditions (heirs of age and in agreement for the notarial route), cost, duration,
  and the Registro Nacional inscription of inherited property and vehicles: **not verified** — no primary text opened.
- **Bank accounts of the deceased:** rules and practice **not verified**.
- **Cancellation of the cédula:** the TSE record itself is the cancellation; whether CCSS (aseguramiento), Hacienda
  (RUT) and the Registro Nacional are notified or merely *consult* the TSE padrón: **not verified** (institutions are
  known to consult the padrón — CCSS "verifies Costa Rican minors electronically", `legal-cr.md` B.2 — but a push
  from TSE on death was not found).
- **Volume:** deaths per year (INEC/TSE) **not verified**.

### (b) Legal basis

- **Ley 3504** (Ley Orgánica del TSE y del Registro Civil) **art. 95 inc. c)** and **Reglamento del Registro
  del Estado Civil arts. 41 and 42** — cited as the legal basis on the TSE requisitos sheet above; the sheet also cites
  Ley 8764 art. 33.2 (foreigners' duty to carry identity documents), Ley 8454 and Ley 8968.
- **SEDIMEC** — Colegio de Médicos system; its regulatory instrument for death certificates: **not verified**.
- **Ley 7983** (ROP/FCL beneficiaries) — see `legal-cr.md` B.5 for the text; beneficiary article **not verified**.
- **Ley 8769** — exists as an RNC pension category (CCSS catalogue above); title and amount **not verified**.
- Reglamento IVM (CCSS Junta Directiva), Código Notarial 7764, Código Procesal Civil 9342, Reglamento General de
  Cementerios: **not verified** (not opened).

### (c) What a single once-only workflow would need: decree vs statute

- **Hospital → TSE:** exists (Defunción en Línea); nothing needed except coverage of all hospitals — TSE reglamento
  (TSE autonomy: only the TSE can regulate its registradores auxiliares). **LEY (decreto)** = TSE reglamento.
- **TSE → CCSS (end coverage of the deceased, open a survivor pension case):** CCSS is an institución autónoma; a push from TSE needs (i) a Ley 8968 art. 5 c) "disposición legal" or a convenio plus survivor consent and
  (ii) a CCSS Reglamento IVM change making the death record sufficient proof. The consent route is possible today
  under a convenio (**PARCIAL**); the automatic route is **LEY (estatuto)** for the data basis, decree-level for the
  CCSS reglamento.
- **TSE → SUPEN/operadoras (ROP/FCL payout):** SUPEN could regulate operadoras' duty to check the TSE padrón under
  Ley 7983 (**LEY (decreto)** = SUPEN reglamento); a TSE push needs the same data basis as above.
- **TSE → Registro Nacional (flag assets of the deceased) / banks:** no legal basis for a push; banks are private
  and would need a SUGEF norm — **LEY (estatuto)** for the public-to-private step.
- **Succession itself** cannot be automated: it is a notarial or judicial act by nature.

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Medical certificate + civil inscription (hospital death) | Colegio de Médicos → TSE | SEDIMEC "Defunción en Línea"; Ley 3504 art. 95 c), Reglamento arts. 41–42 | **HOY** (free, 8 días hábiles; hospital coverage % not verified) |
| Civil inscription (death outside hospital) | TSE | Paper form + certificate at TSE office | **PARCIAL** (in person) |
| Burial / cremation permit | Municipality / cemetery, Ministerio de Salud | Reglamento de Cementerios (number not verified) | **PARCIAL** (in person, citizen carries the certificate) |
| Pensión por muerte IVM | CCSS | "Solicitud Pensión por Muerte" (ccss.sa.cr/tramites); Reglamento IVM | **PARCIAL** (online availability not verified; survivor supplies TSE certificates) |
| Pensión RNC viudez/orfandad | CCSS | RNC trámite incl. Ley 8769 | **PARCIAL** |
| ROP / FCL payout | Operadora, SUPEN | Ley 7983 | **PARCIAL** (family initiates, brings death certificate) |
| Succession, inscription of inherited property | Notary / courts → Registro Nacional | Código Notarial 7764; CPC 9342 | **PARCIAL** (notarial route digital-capable; not once-only) |
| Automatic notification of CCSS, Hacienda, Registro Nacional, banks on death | TSE → others | none | **LEY (estatuto)** for the data push; **LEY (decreto)** for each receiving reglamento |

### Could not verify
- Share of deaths declared through Defunción en Línea; whether it auto-excludes from the padrón.
- Reglamento General de Cementerios decree number and whether Salud issues a separate burial permit.
- CCSS pensión por muerte: online availability, documents, time; Reglamento IVM article numbers.
- Ley 7983 beneficiary article; whether operadoras learn of deaths from the TSE.
- Sucesorio notarial vs judicial conditions, cost, duration (Ley 7764, Ley 9342 articles).
- Bank-account rules on death; any TSE → institutions death feed; deaths per year.

---

## 2. Buying or selling a vehicle ("Compré un carro")

### (a) The procedure today

- **Traspaso before a notary and inscription at the Registro de Bienes Muebles.** The Registro Nacional's own
  requirements deck lists the *requisitos generales* of a traspaso: "Escritura Pública de traspaso; Entero pago de
  Timbres e Impuesto de transferencia por el valor más alto entre valor contractual y fiscal; Marchamo al día; Si
  tiene gravámenes, infracciones, debe ser aceptados" —
  https://www.rnpdigital.com/Requisitos%20para%20el%20Traspaso%20de%20Vehiculos%20Exonerados.pdf (PDF parsed
  locally). The same deck records that Hacienda's **EXONET** electronic system is mandatory for exemption requests
  since Decreto Ejecutivo 31611-H of 29 Jan 2004, that the Registro cannot apply exemptions of its own motion (Código
  Tributario art. 99), and that customs (Aduanas) transmits nationalisation data (DUA) to the Registro electronically.
- **The PGR's sheet for state vehicle deeds** confirms the tax and timbre references a notary applies to any
  traspaso: "Pago de impuesto de trasferencia, y timbres por traspaso … (Art 13 Ley 7088. Art 3 Ley 7293, Art 2, 3
  Ley 4564)"; "Estar al día con el pago de derecho de circulación del año en curso. (Art. 9 Ley 7088. Art. 39 Ley
  7331)"; vehicles "Nacionalizado[s]" owe "el 30 por ciento del valor aduanero Art 10 Ley 7088"; placas and their
  deposit under Decreto 26883-J art. 110 —
  https://www.pgr.go.cr/wp-content/uploads/2026/01/elaboracion_PG000135_v3.pdf (PDF parsed locally).
- **Rate of the impuesto de transferencia:** a search-engine summary of the SCIJ article page gave **2.5 %**
  (Ley 7088 art. 13); the SCIJ page itself redirects to sinalevi.go.cr and could not be read, so the rate is
  **not verified against the text** (secondary source only). Timbre amounts, notary honorarios (arancel) and a
  worked total cost: **not verified**.
- **Online presentation.** Whether the Registro Nacional accepts the testimonio through an electronic presentation
  channel ("Ventanilla Digital" or similar) and any "traspaso digital" service, inscription times, and traspaso
  volumes: **not verified** (registronacional.go.cr pages not opened).
- **Marchamo (derechos de circulación).** Legal anchor confirmed only as Ley 7088 art. 9 (impuesto a la propiedad)
  plus Ley 7331 art. 39 (PGR sheet above); that it bundles the SOA under Ley 9078 and is collected by the INS in
  November–December, and the 2024–2026 changes to the property tax: **not verified** (grupoins.com/marchamo returned
  404; no law text opened).
- **COSEVI fines and RTV (DEKRA).** csv.go.cr is behind a bot-manager; the DEKRA start date (July 2022 per the
  brief), the inspection tariff and the online consulta URLs: **not verified**. What *is* verified is the Registro's
  rule that pending "gravámenes, infracciones" must be *accepted* by the buyer for the traspaso to inscribe (deck
  above) — i.e. fines are annotated on the vehicle in the Registro.

### (b) Legal basis

- **Ley 7088 (1987)**: art. 9 impuesto a la propiedad de vehículos (paid with the derecho de circulación); art. 10
  vehicles nationalised with pending duties (30 % of customs value on transfer); **art. 13 impuesto de transferencia**
  — references verified through the PGR and Registro Nacional documents above; article text and 2.5 % rate
  **not verified**.
- **Ley 4564** arts. 2–3 (timbres of the Registro / placas) and **Ley 7293** art. 3 (exonerations) — cited by PGR;
  texts not opened.
- **Ley 7331** art. 39 (cited by the PGR for the derecho de circulación; its title was not checked) and **Decreto 26883-J**
  (Reglamento del Registro de Bienes Muebles, art. 110 on placas) — cited by PGR; texts not opened.
- **Decreto 31611-H** (2004) — EXONET mandatory (Registro Nacional deck).
- Ley 9078 (SOA, RTV) — see `legal-cr.md` B.6; SOA and RTV articles **not verified**.

### (c) What a single once-only workflow would need: decree vs statute

- **Notary → Registro Nacional:** already a single act; making it end-to-end digital is Registro Nacional
  reglamento territory (Junta Administrativa del Registro Nacional, Ley 5695) — **LEY (decreto)** if not already live
  (**not verified**).
- **Registro → Hacienda (tax) and INS (marchamo/SOA holder change):** the tax is *paid before* inscription via
  entero bancario; an automatic liquidation inside the platform needs a Hacienda resolución (decree level); INS is
  an autonomous institution and the marchamo follows the placa, not the owner, so no change is strictly needed.
- **Registro → COSEVI (fines follow the vehicle):** already effectively integrated through the annotation of
  infracciones on the Registro record (deck above); the Ley 9078 article on owner liability **not verified**.
- **Removing the "bring the marchamo/RTV receipt" step:** the Registro already checks marchamo status; a decree
  could oblige it to check RTV status through the concessionaire — **LEY (decreto)**.
- **Changing the tax rate or base** — **LEY (estatuto)** (reserva de ley tributaria).

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Escritura de traspaso | Notary | Código Notarial; firma digital possible | **HOY** (notarial act) |
| Impuesto de transferencia + timbres | Hacienda / Registro Nacional | Ley 7088 art. 13; Ley 4564; entero bancario | **PARCIAL** (paid outside the inscription flow; rate not verified) |
| Inscription | Registro de Bienes Muebles | Ley 5695; Decreto 26883-J; requires marchamo al día, acceptance of gravámenes/infracciones | **PARCIAL** (electronic presentation status not verified) |
| Marchamo / SOA | INS | Ley 7088 art. 9; Ley 9078 SOA (not verified) | **HOY** (online payment — not verified for 2026) |
| Fines check | COSEVI | csv.go.cr (bot-blocked) | **PARCIAL** |
| RTV | DEKRA (concession) | Ley 9078 | **PARCIAL** (in person by nature; status query not verified) |
| Automatic owner-change propagation (INS policy, municipality, COSEVI) | Registro → others | none | **LEY (decreto)** for Registro/Hacienda/MOPT; INS by convenio |

### Could not verify
- Ley 7088 art. 13 text and the 2.5 % rate; timbre amounts; notary arancel; typical total cost.
- Registro Nacional electronic presentation / "traspaso digital"; inscription time; volumes.
- Marchamo composition, dates, online channels; 2024–2026 property-tax reform.
- DEKRA start date and legal basis; RTV tariff; COSEVI consulta URL; Ley 9078 owner-liability article.

---

## 3. Buying a home ("Compré una casa")

**Confidence: low — no primary text was opened for this event; everything below is the brief's framing, marked.**

### (a) The procedure today

- Transfer by escritura pública before a notary, estudio registral and plano catastrado, inscription at the
  Registro de Bienes Inmuebles; the free consulta and paid certificaciones on rnpdigital.com are verified in
  `legal-cr.md` B.3. Electronic presentation channel, inscription time and volumes: **not verified**.
- Impuesto de traspaso de bienes inmuebles **1.5 %** (Ley 6999, 1985) on the higher of price and valor fiscal, plus
  Registro Nacional, Colegio de Abogados, fiscal, Parques Nacionales, Archivo Nacional and municipal timbres and the
  notary's arancel: **not verified** (no text opened).
- Municipal impuesto sobre bienes inmuebles (Ley 7509, 1995): declaración every five years (art. 16), 0.25 % rate,
  exemption for a single home below a salario-base threshold, and the Registro Nacional's duty to feed the
  municipality: **not verified**.
- Utilities (AyA, ESPH, ICE/CNFL) change of holder: **not verified**.
- Impuesto Solidario (Ley 8683, 2008): 2026 threshold and filing in TRIBU-CR: **not verified**.
- Bono familiar de vivienda (BANHVI, Ley 7052): eligibility, amount, documents and SINIRUBE use: **not verified**.

### (b) Legal basis

- Ley 6999 (impuesto de traspaso), Ley 7509 (bienes inmuebles), Ley 8683 (impuesto solidario), Ley 7052 (Sistema
  Financiero Nacional para la Vivienda), Ley 5695 (Registro Nacional), Código Notarial 7764 — all **not verified**
  in this file (numbers as given in the brief).

### (c) What a single once-only workflow would need: decree vs statute

- **Registro Nacional → municipality (new owner, tax base):** if Ley 7509 already obliges the Registro to inform
  municipalities (**not verified**), the gap is implementation, i.e. **LEY (decreto)** / convenio; the citizen's
  five-yearly *declaración* is statutory and would need a Ley 7509 amendment to be replaced by a registry feed —
  **LEY (estatuto)**. Municipal autonomy (Constitución art. 170) means the *procedure* can be legislated but each
  municipality keeps its own systems.
- **Registro → Hacienda (impuesto solidario liability):** Hacienda is central government; a decree can order the
  cross-check — **LEY (decreto)**.
- **Registro → AyA/ICE/CNFL (holder change):** AyA and ICE are autonomous, ESPH municipal; needs convenios plus
  buyer consent — **PARCIAL** today, **LEY (estatuto)** for an automatic rule.
- **BANHVI bono:** eligibility data (income, family, "no posee bienes") already sits in CCSS, TSE, Registro Nacional
  and SINIRUBE (Ley 9137); a once-only application is a BANHVI reglamento + SINIRUBE matter — **LEY (decreto)**.

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Escritura + inscription | Notary → Registro de Bienes Inmuebles | Ley 5695; rnpdigital.com | **PARCIAL** (electronic presentation not verified) |
| Impuesto de traspaso + timbres | Hacienda / Registro | Ley 6999 (1.5 % not verified) | **PARCIAL** |
| Declaración de bienes inmuebles | Municipality (82 cantons) | Ley 7509 art. 16 (not verified) | **PARCIAL** (in person in most cantons — not verified) |
| Utilities holder change | AyA / ESPH / ICE / CNFL | institutional rules (not verified) | **PARCIAL** |
| Impuesto solidario | Hacienda | Ley 8683; TRIBU-CR | **HOY** (filing online — threshold not verified) |
| Bono de vivienda | BANHVI / entidad autorizada | Ley 7052; SINIRUBE | **PARCIAL** |
| Automatic propagation of the new owner | Registro → municipality, utilities, Hacienda | none | **LEY (decreto)** for central bodies; **LEY (estatuto)** for the municipal declaración and autonomous utilities |

### Could not verify
- Everything in (a) and (b) above except the rnpdigital.com consulta (verified in the companion file).

---

## 4. Marriage ("Me caso") and divorce

### (a) The procedure today

- **Civil marriage** is celebrated by a notary or a judge (and Catholic marriage has civil effects) and inscribed at
  the TSE Registro Civil; requisitos (TSE certificación de estado civil, two witnesses), notary honorarios, the
  deadline for the notary to send the acta, and whether notaries file it electronically: **not verified** (TSE HTML
  pages unreadable; no Código de Familia text opened).
- **Minimum age 18** — Ley 9406 (2017) per the brief: **not verified**. **Same-sex marriage** in force since
  26 May 2020 (Sala Constitucional 2018-12782): **not verified** in this file.
- **CCSS aseguramiento familiar del cónyuge:** the CCSS trámite "Solicitud de Aseguramiento por Protección
  Familiar" exists (https://www.ccss.sa.cr/tramites) and, per `legal-cr.md` B.2, CCSS verifies Costa Rican family
  links electronically against TSE but the request is citizen-initiated. Requisitos specific to spouses: **not
  verified**.
- **Name and status propagation:** whether any surname change occurs on marriage was not checked (**not verified**);
  the estado civil changes in the TSE record and institutions that consult the padrón see it on their next query. No automatic feed to Hacienda, CCSS or banks
  was found (**not verified — searched only before the quota ran out**).
- **Divorce — the key finding.** *Divorcio notarial is not law as of the research date.* Exp. **23.982**, "Ley para
  la promoción de la autonomía de la voluntad en los procesos de divorcio y en la unión de hecho" (dip. Johana
  Obando et al.), presented 4 Oct 2023, dictamen 5 Mar 2025, **approved in first debate 21 Apr 2026**; no second
  debate, sanción or law number is recorded: the tracker's status label is **"Aprobado en Primer Debate"** and its
  last dated events are "21 de abril de 2026 - Primer debate - Aprobado" and "23 de abril de 2026 - Texto final"
  (re-checked on the research date) — https://delfino.cr/asamblea/proyecto/23982. Its text reforms Código de
  Familia arts. 37, 39, 48 and 60 and adds arts. 37 bis and 48 ter; the new art. 48 reads: "Tratándose de matrimonios
  en los cuales no existen hijos menores de edad comunes ni bienes a los cuales se hace referencia en el convenio,
  la escritura se presentará directamente al Registro Civil para su aprobación e inscripción"; with minor children
  or assets "el trámite se verificará judicialmente"; the convenio must be filed "dentro de los tres meses siguientes
  a su celebración notarial" — https://vlex.co.cr/vid/asamblea-legislativa-republica-costa-1074895659 (vLex copy of
  the La Gaceta text of 20 March 2025, which is the *dictamen* publication, not a law). The earlier exp. **21.826**
  "Ley de Procedimientos No Contenciosos en Sede Notarial" (2020) passed first debate 21 Mar 2022, was returned to
  committee 31 Mar 2022 and produced no law — https://delfino.cr/asamblea/proyecto/21826. The brief's "Ley 9xxx /
  10xxx divorcio notarial" therefore does not exist; the demo must present notarial divorce as a **bill**. Judicial
  divorce (Código de Familia art. 48 grounds; Código Procesal de Familia Ley 9747): articles and in-force date
  **not verified**.
- **Volume:** marriages/divorces per year **not verified**.

### (b) Legal basis

- Código de Familia (Ley 5476) — marriage, art. 48 divorce grounds (the article number 48 is confirmed only as the
  one exp. 23.982 rewrites), art. 41 régimen patrimonial: **not verified** here.
- Ley 3504 — inscription of marriages: article **not verified**.
- Exp. 23.982 — bill text and status verified (above).

### (c) What a single once-only workflow would need: decree vs statute

- **Notary → TSE (marriage acta):** if not yet electronic, a TSE reglamento suffices (TSE autonomy) —
  **LEY (decreto)** = TSE reglamento.
- **TSE → CCSS (spouse as beneficiario familiar):** same analysis as birth in `legal-cr.md` B.2 — CCSS Reglamento
  del Seguro de Salud (decree level) plus a data basis (**LEY (estatuto)** for automatic push; **PARCIAL** today via
  citizen request + CCSS lookup).
- **TSE → Hacienda / banks (estado civil):** Hacienda can be ordered by decree to consult the padrón; banks need a
  SUGEF norm; neither needs the *citizen* to carry a certificate if they query the TSE — **LEY (decreto)** for
  Hacienda, private-sector step **LEY (estatuto)**.
- **Notarial divorce with direct filing at the Registro Civil:** **LEY (estatuto)** — exp. 23.982 must pass second
  debate.

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Celebration + acta | Notary / judge | Código de Familia; Código Notarial | **HOY** (notarial act) |
| Inscription | TSE Registro Civil | Ley 3504 (article not verified) | **PARCIAL** (electronic filing by notaries not verified) |
| Spouse as CCSS beneficiary | CCSS | Protección Familiar trámite | **PARCIAL** (citizen-initiated; TSE lookup exists) |
| Estado civil at Hacienda / banks | Hacienda, SUGEF entities | padrón consultation | **PARCIAL** |
| Divorce by mutual consent before a notary, direct to Registro Civil | Notary → TSE | Exp. 23.982 (first debate 21 Apr 2026) | **LEY (estatuto)** |
| Divorce today | Courts (→ TSE) | Código de Familia art. 48; Ley 9747 (not verified) | **PARCIAL** (judicial) |

### Could not verify
- Marriage requisitos, notary honorarios, filing deadline and electronic filing; Ley 9406 and same-sex marriage
  dates; CCSS spouse requisitos; any TSE → Hacienda/CCSS/bank status feed; Código de Familia article numbers;
  Ley 9747 in-force date; marriage/divorce volumes; whether exp. 23.982 passed second debate after the delfino data.

---

## 5. School enrolment ("Mi hijo entra a la escuela")

### (a) The procedure today

- **Prematrícula for the 2026 school year ran 4–8 August 2025; ratificación de matrícula 8–9 December 2025.**
  It applies to children entering preescolar (Materno, Transición), first grade and secondary; preschool entrants
  must be 4 by 15 Feb 2026 and first-graders 6 by 15 Feb 2026 with the preschool completion certificate; "cada
  familia debe acudir directamente al centro educativo" and "algunos centros permiten parte del proceso en línea",
  with **no national online platform for parents named** — https://tomepalpinto.com/2025/08/10/prematricula-mep-2026-fechas-requisitos/
  (press; cites "el MEP confirmó" without a linked comunicado). The MEP's **Resolución MEP-0248-2026** on rangos de
  matrícula (19 Feb 2026; class-size ranges per level, replacing Resolución 2728-MEP-2017; grounded on Ley
  Fundamental de Educación 2160 and Ley Orgánica del MEP 3481 arts. 1 and 16; it does not cite the Reglamento de
  Matrícula y Traslados) — https://www.colypro.com/wp-content/uploads/2026/02/RESOLUCION-MEP-0248-2026-Rangos-de-Matricula.-firmado-sellado.pdf
  (PDF parsed locally) — shows the MEP still governs enrolment by ministerial resolución. The brief's "SABER platform / matrícula en línea since 2023": **not verified — no official page
  found**; treat MEP enrolment as in person at the school.
- **Educación Abierta** (adult/open education) does have an online registration, "Yo Aplico" —
  https://portaldgec.mep.go.cr/yo_aplico — which is not the regular-school matrícula.
- Documents parents bring (birth data / TIM, CCSS vaccination card, proof of address, photos), the Reglamento de
  Matrícula y Traslados decree number, the Ley 8111 vaccination requirement, the voluntary Junta de Educación fee,
  and whether MEP verifies the child against the TSE electronically: **not verified**.
- **IMAS Avancemos / Crecemos, PANEA comedor, transporte estudiantil, FONABE → IMAS merger:** legal instruments,
  amounts and application channels **not verified** (imas.go.cr and mep.go.cr not opened before the quota ran out).
  SINIRUBE (Ley 9137) as the eligibility backbone is verified in `legal-cr.md` A.4.

### (b) Legal basis

- Reglamento de Matrícula y Traslados (MEP) — number **not verified**; Resolución MEP-0248-2026 (rangos de matrícula;
  Ley 2160, Ley 3481 arts. 1, 16 — verified from the text). Ley 8111 (vacunación), Ley 9137 (SINIRUBE), Ley 4760 (IMAS), decrees creating Avancemos and
  Crecemos: **not verified**.

### (c) What a single once-only workflow would need: decree vs statute

- **TSE/CCSS → MEP (identity, vaccination):** MEP is central government; a decree can order MEP to obtain birth data
  from the TSE and vaccination status from CCSS instead of asking parents — **LEY (decreto)** for MEP, plus a convenio
  with CCSS (autonomous) and the consent/legal basis of Ley 8968 art. 14.
- **MEP → IMAS (beca) / comedor / transporte from one enrolment:** IMAS is autonomous (Ley 4760) but already runs on
  SINIRUBE (Ley 9137), which is the one statutory data-sharing basis in the social sector — the realistic path is a
  SINIRUBE-based rule, **LEY (decreto)** for MEP's side and IMAS Consejo Directivo reglamento for its side.
- **A national online matrícula:** MEP reglamento — **LEY (decreto)**.

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Prematrícula / matrícula | MEP school | in person; Reglamento de Matrícula (number not verified) | **PARCIAL** (in person; some schools partly online) |
| Identity / birth check | MEP ← TSE | not verified | **PARCIAL** (parents bring documents — not verified) |
| Vaccination card | MEP ← CCSS | Ley 8111 (not verified) | **PARCIAL** |
| Beca Avancemos / Crecemos | IMAS | SINIRUBE (Ley 9137) | **PARCIAL** (application separate from enrolment — not verified) |
| Comedor (PANEA), transporte | MEP | not verified | **PARCIAL** |
| One enrolment → beca, comedor, transporte | MEP → IMAS | none | **LEY (decreto)** + IMAS reglamento |

### Could not verify
- Any MEP online matrícula platform; SABER's nature; documents list; Reglamento number; Ley 8111 article; Avancemos/
  Crecemos instruments and amounts; PANEA and transporte rules; FONABE merger law; enrolment volumes.

---

## 6. Coming to live in Costa Rica ("Vengo a vivir a Costa Rica")

### (a) The procedure today

- **Categories and amounts (verified from the law text).** Ley 8764 art. 79: temporary residence "por un tiempo
  definido, superior a noventa días y hasta por dos años, prorrogable en igual tanto" for listed subcategories
  (spouse of a Costa Rican, religious, executives/technical staff, investors, scientists/professionals, athletes,
  correspondents, rentistas, pensionados…); **art. 81 pensionado: "pensiones mensuales, permanentes y estables
  provenientes del exterior, cuyo monto no podrá ser inferior a mil dólares… (US $1000,00)"**; **art. 82 rentista:
  "rentas mensuales, permanentes y estables… por un monto mínimo de dos mil quinientos dólares… (US $2500,00)"**,
  dependents may be covered; **art. 78 residente permanente** after "una residencia temporal durante tres años
  consecutivos" (and first-degree relatives of Costa Ricans); **art. 125 change of category costs US$200**; art. 33
  inc. 3: US$100 per month of irregular stay —
  https://asamblea.go.cr/sd/Documents/BIBLIOTECADIGITAL/DOCUMENTOS/LEYES/LEY%208764-LEY%20GENERAL%20DE%20MIGRACI%C3%93N%20Y%20EXTRANJER%C3%8DA.pdf
  (PDF parsed locally; the site's TLS certificate fails validation, fetched with verification disabled). The
  inversionista amount (US$150,000 after Ley 9996 of 2021) and the nómada digital category (Ley 10008): **not
  verified** in this file.
- **Mandatory CCSS insurance — the exact article is art. 7 inc. 7**, not a residency article: "La tramitación de
  toda gestión migratoria deberá garantizar el aseguramiento a la seguridad social por parte de las personas
  migrantes. Tal garantía obligará a que todo trámite migratorio deba contemplar, como uno de sus requisitos
  básicos, contar con los seguros que brinda la Caja Costarricense de Seguro Social (CCSS)." Reinforced by art. 31
  inc. 6 (foreigners "tendrán acceso al sistema de seguridad social… Asimismo, tendrán el deber de contribuir"),
  **art. 83 in fine** ("deberán acreditar su adscripción a un seguro de la CCSS, para efectos de optar por la
  renovación de su cédula de extranjería") and **art. 86** (prórroga of temporary residence requires that the person
  "se adscriba a un seguro de la CCSS") — same PDF. The CCSS's guidelines for insuring migrants as voluntary/
  independent contributors under Ley 8764 are in a CCSS circular extract of 30 Nov 2012 that also cites arts. 81–82
  and Ley 8923 (Costa Rica's adhesion to the Hague Apostille Convention) —
  http://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/A/2010-2019/2010-2014/2012/1208B/EA688.HTML. Whether DGME verifies
  CCSS status electronically or the applicant brings a constancia, and the 2026 contribution base: **not verified**.
- **Apostille:** the law contains no article using the word "apostilla"; the requirement comes from Ley 8923 (Hague
  Convention) and the Reglamento de Extranjería (Decreto 37112-GOB per the brief — **not verified**).
- **Change of domicile:** art. 33 inc. 1 obliges legally resident foreigners "a comunicar por escrito, a la Dirección
  General, todo cambio de su domicilio" and to designate a notification address or electronic means — a written
  duty that a once-only address service would absorb (see `legal-cr.md` B.4).
- **Plazo to resolve:** no fixed deadline for residency decisions was found in the law text (searched "tres meses",
  "noventa días", "plazo máximo"); Ley 8220 art. 7 / LGAP default would apply in principle — **not verified** in
  practice.
- **What is online:** migracion.go.cr returned HTTP 403 to the fetch tool; the DGME platform names ("Trámite Ya",
  "Migración Digital"), the online appointment system, USD fees other than those in the law, DIMEX issuance channel
  (BCR/Correos), fingerprinting at Seguridad Pública, backlog and processing-time figures from press or
  Defensoría/CGR reports: **not verified**.

### (b) Legal basis

- **Ley 8764**, Ley General de Migración y Extranjería (La Gaceta 170, 1 Sept 2009 per the ILO/Poder Judicial
  mirrors' titles; in-force date **not verified**): arts. 7.7,
  31.6, 33, 78, 79, 81, 82, 83, 86, 125 — verified from the text above.
- **Ley 8923** (Apostille Convention) — cited in the CCSS circular; text not opened.
- Reglamento de Extranjería (Decreto 37112-GOB), Ley 9996 (2021), Ley 10008 (2021): **not verified**.

### (c) What a single once-only workflow would need: decree vs statute

- **DGME ↔ CCSS (insurance as a requisito):** the *requirement* is statutory (art. 7.7) but the *proof* is not —
  the Reglamento de Extranjería can say DGME verifies affiliation by querying CCSS; CCSS side needs a convenio
  (autonomy) or a Ley 8968 art. 5 c) basis — **LEY (decreto)** on DGME's side, convenio/consent for CCSS.
- **Residency approval → automatic CCSS enrolment, Hacienda RUT, DIMEX:** DGME and Hacienda are central government
  (decree); CCSS enrolment as *asegurado voluntario* is a CCSS reglamento matter plus the person's declared income —
  **LEY (decreto)** + CCSS Junta Directiva.
- **Fees and amounts** (arts. 81, 82, 125) — **LEY (estatuto)**.
- **Apostille** — international treaty; cannot be removed by decree, but *digital* apostilles (e-APP) can be
  accepted by regulation — **LEY (decreto)**.

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Residency application | DGME | Ley 8764 arts. 78–82; platform not verified | **PARCIAL** (online components not verified; site blocked) |
| Apostilled foreign documents | Foreign authority / Cancillería | Ley 8923 | **PARCIAL** (paper by nature) |
| Fingerprints | Ministerio de Seguridad Pública | not verified | **PARCIAL** (in person) |
| CCSS insurance as requisito | CCSS → DGME | Ley 8764 art. 7.7, 83, 86 | **PARCIAL** (applicant proves it — not verified) |
| DIMEX issuance | DGME (BCR/Correos channel not verified) | Ley 8764 | **PARCIAL** (in person) |
| Change of domicile | DGME | Ley 8764 art. 33.1 (written) | **PARCIAL** |
| Approval → CCSS voluntary enrolment, RUT, DIMEX in one flow | DGME → CCSS, Hacienda | none | **LEY (decreto)** + CCSS reglamento |

### Could not verify
- DGME platforms, appointment system, fees, DIMEX channel, processing times and backlog; Decreto 37112-GOB;
  Ley 9996 investor amount and validity; Ley 10008; CCSS contribution base for residents; DGME–CCSS electronic check.

---

## 7. Disability / long-term illness ("Tengo una discapacidad")

### (a) The procedure today

- **Certification of disability is a CONAPDIS service — SECDIS (Servicio de Certificación de la Discapacidad),
  created by Decreto Ejecutivo 40727-MP-MTSS.** Verified from CONAPDIS Resolución Administrativa DE-RAR-338-2026
  (1 July 2026), which describes SECDIS as "un mecanismo estatal orientado a verificar y evaluar las condiciones
  asociadas a la discapacidad de las personas solicitantes, con el propósito de facilitar el acceso a servicios
  selectivos, sociales, de salud, empleo, educación, transporte y otros beneficios" and grounds itself on Constitución
  arts. 11, 21, 33, 50, 51; Ley 7600 arts. 1, 3, 4; Ley 8661 art. 4 (CRPD); **Ley 9303 art. 2 e)** (creation of
  CONAPDIS); LGAP arts. 4, 11, 16, 214, 221 —
  https://conapdis.go.cr/wp-content/uploads/2026/07/RESOLUCION_No_CONAPDIS-DE-RAR-338-2026-firmado.pdf (PDF parsed
  locally).
- **Backlog is official.** The same resolution records "el incremento sostenido en la demanda… aunado a limitaciones
  de recurso humano, acceso a herramientas tecnológicas… ha generado tiempos prolongados de atención y una alta carga
  operativa institucional", and therefore **automatically extends every certification that expired in 2024, 2025 or
  up to 30 April 2026 until 30 April 2029** "sin necesidad de gestión administrativa adicional" (arts. 1–4). A prior
  resolution CONAPDIS-DE-0787-2023 granted a 10-year prórroga for certifications expired since 2022 —
  https://conapdis.go.cr/wp-content/uploads/2025/10/CONAPDIS-DE-0787-2023-RESOLUCION-ADMINISTRATIVA-SECDIS-PRORROGA-10-ANOS.pdf
  (listed on https://conapdis.go.cr/, not opened). Procedure, documents (CCSS dictamen), cost, time and whether the
  request is online: **not verified**.
- **CCSS pensions.** The catalogue lists "Solicitud Pensión por Invalidez (RIVM)" and "Solicitud Pensión RNC por
  Vejez, Invalidez, Viudez, Orfandad, Indigencia y Ley 8769" — https://www.ccss.sa.cr/tramites. Requirements
  (Comisión Calificadora del Estado de la Invalidez), online availability, amounts and waiting times: **not
  verified**.
- **IMAS subsidies, CONAPDIS Programa de Promoción de la Autonomía Personal (Ley 9379), vehicle exemption (Ley 8444
  via EXONET), MEP apoyos educativos, ENADIS statistics:** **not verified** (EXONET as the mandatory exemption
  channel is verified in section 2).

### (b) Legal basis

- **Ley 7600** (1996) Igualdad de Oportunidades — arts. 1, 3, 4 cited by CONAPDIS.
- **Ley 8661** (2008) approval of the CRPD — art. 4 cited.
- **Ley 9303** (2015) Creación del CONAPDIS — art. 2 e) cited.
- **Decreto Ejecutivo 40727-MP-MTSS** — creation of SECDIS (cited; text not opened; year **not verified**).
- Ley 9379 (2016) autonomía personal; Ley 8444 (vehicle exemption); Ley 5662 (FODESAF/RNC); Ley 8769: **not
  verified** beyond the CCSS catalogue naming Ley 8769.

### (c) What a single once-only workflow would need: decree vs statute

- **CONAPDIS certification → CCSS (RNC/IVM), IMAS, MEP, Hacienda (EXONET), transport discounts:** SECDIS was created
  by an executive decree co-signed by MP and MTSS (its exact institutional attachment **not verified**), so a decree amending 40727-MP-MTSS can make SECDIS a *registry* that
  other bodies query, and can oblige central bodies (MEP, Hacienda) to query it — **LEY (decreto)**; CCSS and IMAS
  are autonomous and need convenios or a statutory basis — **LEY (estatuto)** for an automatic rule, **PARCIAL** via
  SINIRUBE (Ley 9137) for IMAS today.
- **CCSS dictamen → CONAPDIS (medical evidence):** CCSS EDUS holds the clinical data; sharing it needs the person's
  consent (Ley 8968 art. 5) — feasible today under consent, **PARCIAL**.
- **Ending the renewal cycle** (the 2023 and 2026 prórrogas show the certificate's expiry is the bottleneck): a
  decree can set permanent certifications for permanent conditions — **LEY (decreto)**.

### (d) Status per institutional step

| Step | Institution | Platform / law | Status |
|---|---|---|---|
| Certification of disability | CONAPDIS (SECDIS) | Decreto 40727-MP-MTSS; Ley 9303 | **PARCIAL** (backlog; expiries extended by resolución; online request not verified) |
| Pensión de invalidez IVM | CCSS | Reglamento IVM; Comisión Calificadora | **PARCIAL** |
| Pensión RNC / Ley 8769 | CCSS | Ley 5662 (not verified); RNC trámite | **PARCIAL** |
| IMAS subsidies | IMAS | SINIRUBE (Ley 9137) | **PARCIAL** |
| Vehicle tax exemption | Hacienda | Ley 8444 (not verified); EXONET (Decreto 31611-H) | **HOY** (EXONET online) — eligibility proof carried by citizen (not verified) |
| MEP educational supports | MEP | Ley 7600 | **PARCIAL** |
| One certification → all benefits | CONAPDIS → others | none | **LEY (decreto)** for central bodies; **LEY (estatuto)** for CCSS/IMAS automatic flows |

### Could not verify
- SECDIS procedure, documents, cost, time, online request; Decreto 40727 year and text; Ley 9379 provisions and
  the asistente personal programme; RNC and IVM invalidez requirements, amounts and waits; Ley 8769 title/amount;
  Ley 8444 scope; MEP inclusive-education instruments; ENADIS figures; any national disability information system.

---

## 8. Briefly: studying, passport, vehicle sub-steps

- **Studying (CONAPE, Ley 6041):** online application, requisitos, rates and times **not verified** (conape.go.cr
  not opened). Educación Abierta online registration "Yo Aplico" exists (https://portaldgec.mep.go.cr/yo_aplico).
  **PARCIAL** at best; no once-only element verified.
- **Passport (DGME):** channels, appointment system, cost, validity, biometric passport launch date **not verified**
  (migracion.go.cr HTTP 403). **PARCIAL** (in person by nature).
- **Vehicle inspection and fines:** see section 2 — DEKRA date and COSEVI consulta URL **not verified**; the
  Registro Nacional's annotation of infracciones on the vehicle record is verified.

---

## 9. Cross-cutting statistics and reports

- **MEIC Catálogo Nacional de Trámites** (https://tramitescr.meic.go.cr/, "Sistema de Simplificación de Trámites y
  Mejora Regulatoria"): the site exposes sections *Informes*, *Reportes*, *Índice de Capacidad Regulatoria*, *Planes
  de mejora* and *Control Previo*, but is a JavaScript application behind a self-signed certificate; the number of
  catalogued trámites and any "most requested / most complained-about" ranking: **not verified**. MEIC's 2024
  municipal index figures are in `legal-cr.md` A.2.
- **CGR / Defensoría reports on waiting times** (Migración citas, Registro Nacional, CCSS pensiones): **not
  verified** — none opened. The only official waiting-time admission found is CONAPDIS's own (section 7).
- **IDB, "El fin del trámite eterno" (Roseth, Reyes, Santiso, 2018):** publications.iadb.org returned HTTP 403 to
  both the fetch tool and curl, so **the Costa Rica figures are not verified**. The Latin America and Caribbean
  figures as quoted by IDB president Luis Alberto Moreno in La Nación (12 Sept 2018): "9 de cada 10 trámites requieren
  que los ciudadanos concurran en persona a una oficina pública"; "un trámite presencial toma más de cinco horas de
  espera"; "una de cada tres personas confiesa haber pagado coimas para agilizar un trámite"; identity documents are
  "casi 40 % de los trámites"; online trámites take "una cuarta parte del tiempo" and cost "20 veces menos" —
  https://www.nacion.com/opinion/foros/el-fin-del-tramite-eterno/PPTHY3SWNVF6NCWQMLXNQYH2MM/story/ (press).
- **Citizen-satisfaction surveys (Estado de la Nación, CIEP, CID Gallup) and volumes** (TSE certifications, Registro
  Nacional documents, CCSS pensions per year): **not verified**.

---

## 10. What this adds to the "gaps" list in `legal-cr.md` §C

1. **Event-driven pensions and payouts after death** (TSE → CCSS, SUPEN/operadoras) — the death record is already
   electronic from hospitals; the missing piece is the push basis (§C.1, C.6). (Section 1)
2. **Registries as the source of truth for taxes and benefits** — Registro Nacional → municipalities (Ley 7509),
   CONAPDIS SECDIS → CCSS/IMAS/MEP/Hacienda — need a statutory "verify, don't ask" rule for autonomous bodies and a
   decree for central ones. (Sections 3, 7)
3. **Migration as the clearest statutory once-only candidate:** Ley 8764 art. 7.7 already makes CCSS insurance a
   requisito of *every* migratory trámite; the reglamento can turn "acreditar" (art. 83) into a DGME query. (Section 6)
4. **Notarial acts as digital entry points** — traspaso, home purchase, marriage, and (if exp. 23.982 passes)
   divorce all start with a notary who already holds a firma digital; the Registro Nacional and TSE filing channels
   are the pivot, and both are regulable by their own juntas without a statute. (Sections 2, 3, 4)
5. **Backlog relief by fiat is the current substitute for interoperability** — CONAPDIS extending expired
   certifications by three to ten years is the policy tell that renewal-by-paper cannot keep up. (Section 7)

---

## Sources

Official / primary (opened and read on the research date)
- TSE, Inscripción de defunción ocurrida en el país (requisitos): https://www.tse.go.cr/pdf/requisitosytramites/Inscripcion-de-defuncion-ocurrida-en-el-pais.pdf
- Ley 8764 (Asamblea Legislativa PDF): https://asamblea.go.cr/sd/Documents/BIBLIOTECADIGITAL/DOCUMENTOS/LEYES/LEY%208764-LEY%20GENERAL%20DE%20MIGRACI%C3%93N%20Y%20EXTRANJER%C3%8DA.pdf
- CCSS circular extract on insuring migrants under Ley 8764 (30 Nov 2012, SCIJ DOCS): http://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/A/2010-2019/2010-2014/2012/1208B/EA688.HTML
- PGR, Requisitos para la elaboración de escrituras públicas de traspaso de vehículos: https://www.pgr.go.cr/wp-content/uploads/2026/01/elaboracion_PG000135_v3.pdf
- Registro Nacional, Requisitos para el traspaso de vehículos exonerados: https://www.rnpdigital.com/Requisitos%20para%20el%20Traspaso%20de%20Vehiculos%20Exonerados.pdf
- CONAPDIS Resolución DE-RAR-338-2026: https://conapdis.go.cr/wp-content/uploads/2026/07/RESOLUCION_No_CONAPDIS-DE-RAR-338-2026-firmado.pdf ; CONAPDIS home: https://conapdis.go.cr/
- CCSS trámites catalogue: https://www.ccss.sa.cr/tramites
- Asamblea Legislativa bill tracker (Delfino): exp. 23.982 https://delfino.cr/asamblea/proyecto/23982 ; exp. 21.826 https://delfino.cr/asamblea/proyecto/21826
- Exp. 23.982 text (vLex copy of La Gaceta, 20 Mar 2025): https://vlex.co.cr/vid/asamblea-legislativa-republica-costa-1074895659
- MEP Resolución MEP-0248-2026 (Colypro mirror, parsed locally): https://www.colypro.com/wp-content/uploads/2026/02/RESOLUCION-MEP-0248-2026-Rangos-de-Matricula.-firmado-sellado.pdf ; MEP Educación Abierta "Yo Aplico": https://portaldgec.mep.go.cr/yo_aplico
- MEIC Catálogo Nacional de Trámites: https://tramitescr.meic.go.cr/
- SCIJ article page for Ley 7088 art. 13 (redirects to sinalevi, unreadable): https://pgrweb.go.cr/scij/Busqueda/Normativa/normas/nrm_articulo.aspx?param1=NRA&nValor1=1&nValor2=12540&nValor3=95027&nValor5=73505

Press / secondary
- Certificado de defunción electrónico (CR Hoy, 29 May 2018): https://crhoy.com/nacionales/certificado-de-defuncion-sera-emitido-de-forma-electronica/
- Prematrícula MEP 2026 (Tome pal pinto, 10 Aug 2025): https://tomepalpinto.com/2025/08/10/prematricula-mep-2026-fechas-requisitos/
- "¿El fin del trámite eterno?" (La Nación foro, L. A. Moreno, 12 Sept 2018): https://www.nacion.com/opinion/foros/el-fin-del-tramite-eterno/PPTHY3SWNVF6NCWQMLXNQYH2MM/story/
- IDB publication page (HTTP 403 on the research date): https://publications.iadb.org/en/wait-no-more-citizens-red-tape-and-digital-government

Blocked or unreadable on the research date: sinalevi.go.cr (JavaScript), tse.go.cr HTML (bot-manager), migracion.go.cr
(403), csv.go.cr (Radware bot-manager), publications.iadb.org (403), www.conapdis.go.cr (no DNS; use conapdis.go.cr),
grupoins.com/marchamo (404), natlex.ilo.org and observatoriodegenero.poder-judicial.go.cr mirrors of Ley 8764 (403/503),
the SUPEN Ley 7983 PDF (504 on the research date), tse.go.cr/pdf/requisitosytramites/Inscripcion-de-matrimonio-celebrado-en-el-pais.pdf (404 — the
marriage sheet has a different file name).
