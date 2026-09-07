# ¿Qué de esto se puede hacer hoy en Costa Rica?

Every interaction the demo simulates is annotated with one of three statuses. This document explains the
statuses, summarises the legal basis per workflow and step, and lists what a Costa Rican statute would have to add.
The full research with sources is in `docs/research/legal-cr.md` (Costa Rica) and
`docs/research/reference-laws-and-evidence.md` (Estonia, Singapore, EU, Uruguay, Brazil, evidence). The machine-readable
version that the portal renders is `packages/shared/src/legal.ts` (catalogue of instruments) plus the `legal` notes in
`apps/api/src/workflows/*.ts`. Research date: 7 September 2026.

| Status | Meaning |
|---|---|
| **Posible hoy** (`hoy`) | The interaction already exists digitally and has a legal basis; the demo only removes re-typing. |
| **Parcialmente hoy** (`parcial`) | Each institution offers something online, but the exchange between them does not exist or is voluntary. |
| **Requiere ley** (`ley`) | The interaction needs a statute (or a decree the current law does not allow) before it can happen. |

## The foundations that already exist

| Instrument | What it gives | What it lacks |
|---|---|---|
| **Ley 8454** (2005) firma digital, art. 9 | Certified digital signatures have "the same value and evidentiary force" as handwritten ones. | Only *empowers* the State; the duty to accept comes from Directriz 067-MICITT-H-MEIC (2014), which does not bind autonomous institutions or municipalities. |
| **Ley 8220** (2002, reformed 2011 and 2021) | Art. 2: an institution may not ask twice for what it holds, and must have the citizen's consent to pass data to another. Art. 8: the institution needing a document from another "must coordinate to obtain it… so as not to ask the citizen". Art. 7: positive silence. Art. 10: breach is a serious offence for the official. | No platform, no fund, no institutional sanction. MEIC oversees with reports only; its 2024 index found 61 % of municipalities below half of the conditions. MICITT's own 2025 interoperability report lists as a risk the "lack of a binding framework obliging autonomous institutions and municipalities to interoperate". |
| **Ley 8968** (2011) data protection | Art. 5: express consent, except by court order, public data or "constitutional or legal provision". Art. 14: databases transfer only with the holder's express authorisation. | Public-to-public transfer without consent is contested. Bill 23.097 (GDPR-style) has sat at first debate since October 2024. |
| **Ley 9986** (2021) public procurement, art. 16 | SICOP "is the only" system for any contracting with public funds, municipalities included; anything else "entails absolute nullity". | The only precedent of a national platform mandatory by statute. It is the template. |
| **Ley 9943** (2021) Agencia Nacional de Gobierno Digital | Art. 2 right to deal digitally with the State; art. 5 the ANGD must implement "information exchange, digital identity and systems integration". Operating since September 2025. | No once-only rule, no legal basis for exchange, no sanction; temporary funding (art. 7). |
| **IDC** (TSE, 9 Sep 2025) | The cédula on the phone with the same validity as the card; acceptance mandatory for all entities from 1 January 2027 by TSE resolution 1120-E7-2026. | A TSE regulation, not a statute; a credential, not a single sign-on. The PRD's "Pase Digital" could not be verified as an existing product; the demo uses IDC. |
| **Conecta / X-Road** (MICITT–ANGD, March 2026) | The Government already chose X-Road as the national interoperability platform; 30 institutions; first health pilot June 2026. | Administrative project; nothing obliges anyone to join. |
| **Decreto 36550** (2011) APC | One digital filing of construction plans reviewed in parallel by INVU, Salud, Bomberos, AyA and the CFIA; 70 of 82 municipalities fully digital via APC-M in 2020. | Municipal adhesion is voluntary; land use and property certificates still asked on paper. |

## Per workflow

### Iniciar un negocio — *parcial*
| Step | Status | Today | Gap |
|---|---|---|---|
| Identidad (TSE) | hoy | Ley 8454 art. 9; IDC since 2025. | Statutory duty to accept the digital identity everywhere (Estonia IDA §5/§9⁴; eIDAS 2 art. 5f). |
| Registro Nacional (sociedades) | hoy | Crear Empresa forms the company online with a digital notary. | — |
| Tributación | hoy | TRIBU-CR (October 2025) with digital signature. | Take name, address and activity from the registries (Ley 8220 art. 8). |
| CCSS patrono | parcial | Oficina Virtual, but attachments (id, personería, patente). | Sharing mandate reaching autonomous institutions (Singapore PSGA ss. 6–8). |
| Patente municipal | ley | 84 patente laws and systems; 54 cantons in the VUI. | Statute binding municipalities to the identity and the bus (Ley 9986 art. 16 template); Constitution art. 170 protects municipal autonomy. |
| Permiso sanitario | parcial | Decreto 43432-S: online sworn declaration, five-year validity. | A decree letting Salud read the patente through the bus. |

### Tuve un hijo — *parcial*
| Step | Status | Today | Gap |
|---|---|---|---|
| Inscripción (TSE) | hoy | Hospitals declare births online since 2016; same-day registration; ≈98 % of births in hospital. | — |
| Aseguramiento CCSS | parcial | On the family's request (clinic or online), about eight days. | TSE→CCSS push and a CCSS regulation making coverage event-driven (Singapore's birth bundle). |
| Carné de vacunación | parcial | Opened at the clinic on first contact; doses in EDUS. | A "child born" event on the bus. |

### Voy a construir — *parcial*
| Step | Status | Today | Gap |
|---|---|---|---|
| Finca (Registro Nacional) | hoy | Online public lookup; certificate in minutes with signature. | Municipalities must read it instead of asking (Ley 8220 art. 8). |
| Uso de suelo | parcial | Several municipalities online; most ask for paper certificates. | Same. |
| APC (CFIA, Salud, Bomberos, AyA, INVU) | hoy | Decreto 36550 since 2011. | SETENA integration (convenio 2021, status unverified). |
| Permiso municipal | parcial | 70 of 82 municipalities digital via APC-M (2020). | Mandatory adhesion by statute. 1 % tax: Ley 4240 art. 70. |

### Cambié de domicilio — *ley*
| Step | Status | Today | Gap |
|---|---|---|---|
| TSE | parcial | Online only for citizens abroad; in person at home. | Designate a base address registry with a custodian. |
| Tributación | parcial | Online in TRIBU-CR, separately. | Subscribe to the base registry's changes. |
| CCSS | parcial | Online self-service, separately. | Same. |
| Municipalidad | ley | Per canton; taxpayer rolls not connected. | Same, plus municipal harmonisation. |

### Próximamente (catalogue only)
- **Renovar licencia** — *parcial*: the medical certificate is digital (SEDIMEC) but renewal is in person; MOPT tendered a digital licence in 2026. Needs a decree, not a law, once IDC provides remote proofing.
- **Pensión** — *parcial*: the IVM pension is online since 21 July 2025; the FCL payout (Ley 7983 art. 6) still needs proof of dismissal; there is no unemployment insurance.

## What a "Ley de Eficiencia Digital" would have to add

1. A cross-entity once-only rule with a lawful basis for exchange (the Ley 8968 art. 5 c) route), keeping express consent for anything outside a listed set.
2. A statutory national interoperability platform, mandatory on pain of invalidity, copying Ley 9986 art. 16; demanding a document the State already holds becomes a serious offence of the institution, not only of the official.
3. Binding force on autonomous institutions and all 84 municipalities (Ley 9943 art. 2 only requires "work plans").
4. Base registries designated by law (Estonia's "basic data", §43⁶): TSE for identity and address, Registro Nacional for property and companies, Hacienda for tax status, CCSS for insurance.
5. Audit duties for the bus: field-level logging and a citizen-facing "who queried me" view supervised by PRODHAB (Estonia's data tracker; eIDAS 2 art. 5a(4)(d)).
6. IDC and firma digital recognised by statute as authentication for every State e-service (today a 2014 directive and a TSE regulation).
7. Event-driven services authorised by law: birth → CCSS and EDUS; incorporation → CCSS, TRIBU-CR, INS, patente; job loss → FCL.
8. A canonical address registry with a custodian.
9. Municipal harmonisation of patente and construction procedures (procedure, not tax rates) and mandatory APC-M and VUI adhesion.
10. Stable ANGD funding and sanctioning power.

## Comparative matrix

| Capability | Costa Rica today | Estonia | Singapore | EU |
|---|---|---|---|---|
| Duty to accept the national digital ID | parcial (Ley 8454 validity; IDC by TSE resolution from 2027) | ✔ IDA §5, §9⁴ | policy (Digital IC, 2021) | ✔ eIDAS 2 art. 5f |
| Mandatory interoperability platform | ✘ (Conecta is a project) | ✔ PIA §43⁹(3) + Reg. 105/2016 | PSGA directed sharing | partial (IEA; OOTS cross-border) |
| Once-only with enforcement | parcial (Ley 8220 arts. 2, 8, 10) | ✔ PIA §43¹(3), §43³(2) | KPI 100 % pre-fill; PSGA penalties | ✔ SDG art. 14 |
| Base registries by law | ✘ | ✔ PIA §43⁶ | policy | national matter |
| Consent and audit visible to the person | parcial (Ley 8968 rights, no log) | data tracker (2017) | MyInfo consent screen | ✔ eIDAS 2 art. 5a; SDG art. 14(3) |
| Central authority with budget power | ✘ (ANGD without gatekeeping) | ✔ RIA + §43³(3) | GovTech under PMO | board only |

Reference examples from the region: Uruguay (Ley 18.719 arts. 157–160, AGESIC with binding dispute powers; 25th of 193
in the 2024 UN index, Costa Rica 61st) and Brazil (Lei 14.129/2021 art. 3 XIII once-only, art. 24 IV interoperability).
