# Costa Rica legal / policy research for a once-only e-government platform

Research date: 7 September 2026. Written for the PuraVidaGov demo (portal → orchestrator → interoperability bus → agencies).
Every claim below was checked against a web source on the research date; the URL follows each claim. Items that could not
be confirmed are marked **not verified**. Spanish law names are kept in Spanish; commentary is in English.

Verification notes on method: pgrweb.go.cr/SCIJ now redirects to sinalevi.go.cr, which renders through JavaScript and could
not be read by the fetch tool; where the official SCIJ text was needed, a SCIJ-generated PDF mirrored by a public body
(e.g. Municipalidad de Escazú for Ley 8220, Consejo de Salud Ocupacional for Ley 8454, Imprenta Nacional for Ley 9943)
was downloaded and parsed locally. tse.go.cr is behind a bot-manager and some pages were unreadable; press reports were
used instead and are flagged as such.

---

## A. Cross-cutting framework in Costa Rica today

### A.1 Ley 8454 — Ley de Certificados, Firmas Digitales y Documentos Electrónicos (2005)

- **Status:** in force. Sanctioned 30 August 2005; reglamento Decreto Ejecutivo 33018-MICIT of 20 March 2006
  (https://www.firmadigital.go.cr/Documentos/DecretoNum33018.pdf). Latest reform: Ley 10181 of 5 May 2024, which
  reworded the exclusions in art. 1 (acts where the law demands physical fixation; dispositions mortis causa) —
  https://vlex.co.cr/vid/ley-reformar-articulo-5-858016388 (detail of the 2024 reform only partially verified through a
  secondary source).
- **Legal validity — art. 9 "Valor equivalente"** (verbatim, from the SCIJ text mirrored at
  https://www.csv.go.cr/documents/20126/47774/Ley+de+Certificados,+Firmas+Digitales+y+Documentos+Electr%C3%B3ni.pdf/1a9a4647-b531-96f8-0296-9353e927c967?t=1558541677850):
  > "Los documentos y las comunicaciones suscritos mediante firma digital, tendrán el mismo valor y la eficacia probatoria
  > de su equivalente firmado en manuscrito. En cualquier norma jurídica que se exija la presencia de una firma, se
  > reconocerá de igual manera tanto la digital como la manuscrita. Los documentos públicos electrónicos deberán llevar la
  > firma digital certificada."
- **Art. 3 "Reconocimiento de la equivalencia funcional":** any declaration transmitted electronically "se tendrá por
  jurídicamente equivalente a los documentos que se otorguen, residan o transmitan por medios físicos"; wherever a norm
  refers to a document, electronic and physical are understood alike (same source).
- **Art. 10:** presumption of authorship for documents bearing a *firma digital certificada* (same source).
- **Obligation of public institutions to accept it?** The law itself only *empowers*: art. 1 para. 2 — "El Estado y todas
  las entidades públicas quedan expresamente facultados para utilizar los certificados, las firmas digitales y los
  documentos electrónicos, dentro de sus respectivos ámbitos de competencia." The *duty* to accept and to build firma
  digital into services comes from a lower-rank instrument: **Directriz 067-MICITT-H-MEIC** (La Gaceta 79, 25 April 2014),
  art. 1 ("todas las instituciones del sector público costarricense deberán tomar las medidas técnicas y financieras
  necesarias" so citizens can transact electronically with certified digital signature), art. 3 (new systems must include
  certified-signature authentication and signing), art. 5 (legacy systems to be modernised "dentro de sus posibilidades
  presupuestarias"), deadline 16 Dec 2016 —
  https://www.informatica-juridica.com/directriz/costa-rica-directriz/directriz-no-067-micitt-h-meic-25-abril-2014/ ;
  SCIJ entry: http://www.pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=77067&nValor3=96446&strTipM=TC.
  A *directriz* binds the central government but is weak against autonomous institutions and municipalities. Combined
  with Ley 8220 art. 7 (silencio positivo may be invoked "mediante documento electrónico con firma digital") and Ley 9943
  art. 2 ("derecho de los ciudadanos a relacionarse con la Administración Pública por medios digitales"), the practical
  reading is: valid everywhere, mandatory-to-accept only by directive + case-by-case law.
- Root CA / operator: Banco Central de Costa Rica (Firma Digital) — https://www.bccr.fi.cr/cr/es/firma-digital.html ;
  MICITT portal https://mifirmadigital.micitt.go.cr/.

### A.2 Ley 8220 — Protección al Ciudadano del Exceso de Requisitos y Trámites Administrativos (2002)

- **Status:** in force. Published La Gaceta 49, Alcance 22, 11 March 2002
  (https://www.meic.go.cr/documentos/ley-no-8220-ley-de-proteccion-al-ciudadano-del-exceso-de-requisitos-y-tramites-administativos-y-sus-reformas-publicada-en-el-diario-oficial-la-gaceta-no-49-alcance-22-del-11-03/).
  Reformed by **Ley 8990** (27 Sept 2011: arts. 4, 5, 6, 7, 10 reworded; arts. 11–14 added: MEIC rectoría, análisis
  de impacto regulatorio, criterio vinculante del órgano rector) and by **Ley 10072** (18 Nov 2021: declaración jurada for
  silencio positivo, Catálogo Nacional de Trámites given rank of law) — reform notes are in the consolidated SCIJ text
  mirrored at https://escazu.go.cr/wp-content/uploads/2026/01/ley_8220_proteccion_al_ciudadano_del_exceso_de_requisitos_y_tramites_administrativos.pdf ;
  Ley 8990: https://repositorio.mopt.go.cr/items/180fc17a-8371-4479-8cb9-36b9351b9145 ; Ley 10072:
  https://presidencia.gobiernocarlosalvarado.cr/comunicados/2021/11/firmada-reforma-a-la-ley-que-fortalece-la-simplificacion-de-tramites-en-el-sector-publico/.
  Reglamento: Decreto 37045-MP-MEIC (La Gaceta 60, Alcance 36, 23 March 2012) —
  https://www.meic.go.cr/documentos/decreto-ejecutivo-no-37045-reglamento-a-la-ley-no-8220-publicado-en-el-diario-oficial-la-gaceta-no-60-alcance-no-36-del-23-03-2012/.
- **Art. 2 "Presentación única de documentos" (verbatim, consolidated text):**
  > "La información que presenta un administrado ante una entidad, órgano o funcionario de la Administración Pública, no
  > podrá ser requerida de nuevo por estos, para ese mismo trámite u otro en esa misma entidad u órgano. De igual manera,
  > ninguna entidad, órgano o funcionario público, podrá solicitar al administrado, información que una o varias de sus
  > mismas oficinas emitan o posean.
  > Para que una entidad, órgano o funcionario de la Administración Pública pueda remitir información del administrado a
  > otra entidad, órgano o funcionario, la primera deberá contar con el consentimiento del administrado.
  > Quedan exceptuadas de la aplicación de este artículo las personerías jurídicas."
  **Reading:** art. 2 is an *intra-entity* once-only rule ("en esa misma entidad u órgano"). The *cross-entity* once-only
  duty is art. 8, and it is framed as a coordination duty, with citizen consent required for onward transfer (art. 2 para. 2).
- **Art. 3 "Respeto de competencias" (verbatim):**
  > "La Administración no podrá cuestionar ni revisar los permisos o las autorizaciones firmes emitidos por otras entidades
  > u órganos, salvo lo relativo al régimen de nulidades. Únicamente podrá solicitarle al administrado, copia certificada de
  > la resolución final de un determinado trámite. Tampoco podrán solicitársele requisitos o información que aún se
  > encuentren en proceso de conocimiento o resolución por otra entidad u órgano administrativo; a lo sumo, el administrado
  > deberá presentar una certificación de que el trámite está en proceso."
- **Art. 7 "Procedimiento para aplicar el silencio positivo"** (reformed by Ley 8990 and Ley 10072): for permisos,
  licencias o autorizaciones, once the legal deadline passes without a decision "procederá el silencio positivo de pleno
  derecho"; if no deadline is fixed, the Ley 6227 (LGAP) deadline applies; the citizen invokes it by declaración jurada
  (before a notary, before the official, or "mediante documento electrónico con firma digital"). (Silencio positivo is in
  art. 7, not art. 3.)
- **Art. 6 "Plazo y calificación únicos":** one written prevención only; it suspends the deadline for up to 10 working
  days. **Art. 8 "Procedimiento de coordinación inter-institucional" (verbatim):**
  > "La entidad u órgano de la Administración Pública que para resolver requiera fotocopias, constancias, certificaciones,
  > mapas o cualquier información que emita o posea otra entidad u órgano público, deberá coordinar con esta su obtención
  > por los medios a su alcance, para no solicitarla al administrado."
  Para. 2 obliges collecting entities to circulate monthly lists of *morosos*. **Art. 9** "Trámite ante una única instancia
  administrativa" (no citizen should go to more than one entity for the same purpose; entities must agree a single shared
  trámite). Plazos as such are in art. 6 and art. 7 (the LGAP default).
- **Art. 10 "Responsabilidad de la Administración y el funcionario"** (reformed by Ley 8990): personal liability of the
  official and a gradation of disciplinary sanctions for breaching the law (consolidated text, same Escazú mirror).
- **Why weakly enforced in practice (verified evidence):**
  - Enforcement is through **MEIC's Dirección de Mejora Regulatoria** (art. 11, rectoría; art. 13, criterio vinculante),
    whose tools are the Catálogo Nacional de Trámites, control previo of new regulations, a half-yearly report to the
    Consejo de Gobierno and an "índice de capacidad regulatoria" — i.e. reporting and advisory tools, not an
    interoperability platform. MEIC's own 2024 municipal index: only 4 local governments in the "avanzada" category and
    61 % meet fewer than half of the evaluated conditions —
    https://www.meic.go.cr/unicamente-4-gobiernos-locales-obtienen-categoria-avanzada-en-indice-de-capacidad-regulatoria-institucional-del-meic/.
  - Art. 8 says "por los medios a su alcance": without a data-exchange infrastructure the obligation collapses into
    paper *oficios*. MICITT's August 2025 report on the social-sector interoperability model records, as a risk, the
    "Falta de marco legal vinculante que obligue a las instituciones autónomas y municipalidades a interoperar" and states
    that Ley 8220 "refuerza el principio de 'una sola vez'" only when there is interoperability of systems —
    https://www.micitt.go.cr/sites/default/files/transparencia/consulta-publica/MICITT-DGDCFD-INF-014-2025%20-Informe%20t%C3%A9cnico%20del%20Modelo%20de%20interoperabilidad%20social-%20(1).pdf
    (pp. 15–16 and risk R8).
  - Art. 2 para. 2 requires the citizen's consent for onward transfer, and Ley 8968 art. 14 requires express consent for
    any transfer (see A.3), so a lawful once-only exchange today needs a consent step plus a convenio between the two
    entities. CGR's 2023 audit cited in press: 78 of the audited institutions were still at an "initial" digital
    transformation level, 7 "optimised" — https://crhoy.com/tecnologia/lanzan-proyecto-de-interoperabilidad-ante-problematica-por-desconexion-entre-sistemas-estatales/.
  - Ley 8220 does not create any fund, platform or technical standard, and the only sanction route is disciplinary
    (art. 10) — verified from the consolidated text; no published sanction statistics were found (**not verified**).

### A.3 Ley 8968 — Protección de la Persona frente al Tratamiento de sus Datos Personales (2011) and reglamento

- **Status:** in force. Approved 7 July 2011, published La Gaceta 5 Sept 2011; creates PRODHAB (attached to the
  Ministerio de Justicia y Paz). Reglamento: Decreto Ejecutivo 37554-JP (30 Oct 2012), amended 2016 (Decreto 40008-JP)
  and 2019 — https://www.informatica-juridica.com/anexos/decreto-ejecutivo-no-37554-jp-del-30-de-octubre-de-2012-reglamento-de-la-ley-no-8968/ ;
  https://prodhab.go.cr/acercade/normativa/.
- **Consent — art. 5 (principio del consentimiento informado):** express, documented (physical or electronic), revocable
  consent is the rule. Verbatim exceptions:
  > "No será necesario el consentimiento expreso cuando: a) Exista orden fundamentada, dictada por autoridad judicial
  > competente o acuerdo adoptado por una comisión especial de investigación de la Asamblea Legislativa en el ejercicio de
  > su cargo. b) Se trate de datos personales de acceso irrestricto, obtenidos de fuentes de acceso público general.
  > c) Los datos deban ser entregados por disposición constitucional o legal."
  (https://www.informatica-juridica.com/ley/ley-no-8968-proteccion-la-persona-frente-al-tratamiento-datos-personales/)
- **Art. 8 (excepciones a la autodeterminación informativa):** the principles may be limited, in a fair, reasonable and
  proportionate way, for state security, exercise of public authority, criminal investigation, statistics/science
  without identification risk, "la adecuada prestación de servicios públicos" and "la eficaz actividad ordinaria de la
  Administración, por parte de las autoridades oficiales" (same source).
- **Art. 14 (transferencia) verbatim:**
  > "Los responsables de las bases de datos, públicas o privadas, solo podrán transferir datos contenidos en ellas cuando
  > el titular del derecho haya autorizado expresa y válidamente tal transferencia y se haga sin vulnerar los principios y
  > derechos reconocidos en esta ley."
  Reglamento 37554-JP art. 40 repeats that transfer "siempre requiere el consentimiento inequívoco" unless a law says
  otherwise — https://adalidmedrano.com/se-pueden-transferir-bases-de-datos-personales-libremente-entre-instituciones-del-gobierno/2020/.
- **Public-to-public transfers today:** contested. PRODHAB has publicly argued that the art. 8 "actividad ordinaria de la
  Administración" exception allows inter-institutional sharing; practitioners answer that each institution is a separate
  *responsable* and art. 14 requires consent or an explicit legal mandate (same Adalid Medrano analysis; also
  https://oiprodat.com/2020/03/13/reflexiones-sobre-las-transferencias-de-datos-personales-y-las-excepciones-a-la-autodeterminacion-informativa-en-costa-rica/).
  MICITT's 2025 interoperability report relies on Ley 8968 art. 5 consent plus Sala Constitucional case law
  (sentencias 2008-011698, 2011-011273: consent, necessity, legitimate purpose) as the basis for exchange
  (MICITT-DGDCFD-INF-014-2025, p. 15).
- **Is a consent-based bus with an audit log compatible?** Yes, and it is the *safest* design under current law: a
  per-transaction, express, logged consent from the citizen satisfies art. 5 and art. 14 and Ley 8220 art. 2 para. 2;
  a field-name-only audit log (no values) is consistent with the minimisation reading of art. 6 (calidad de la
  información) and avoids creating a new base de datos of copied values. What it does **not** solve: consent cannot be
  the basis for exchanges the citizen is not party to (e.g. tax-compliance checks), which need the art. 5 c) "disposición
  legal" route — hence the gap in section C.
- **Reform bills:**
  - **Expediente 22.388** "Reforma integral a la Ley 8968" (2021, Ejecutivo/PRODHAB): dictamen afirmativo unánime
    27 Oct 2021, then **archived** — https://delfino.cr/asamblea/proyecto/22388.
  - **Expediente 23.097** "Ley de Protección de Datos Personales" (presented 9 May 2022 by dip. Eliécer Feinzaig and
    others; repeals Ley 8968; GDPR-style: DPO, risk-based measures, stronger PRODHAB): dictamen afirmativo de mayoría
    7 March 2023; **aprobado en primer debate 14 Oct 2024**, then a *moción de retrotracción* on 17 Oct 2024 returned it to
    first-debate stage; no second debate recorded as of the research date —
    https://delfino.cr/asamblea/proyecto/23097 ; text: https://proyectos.conare.ac.cr/asamblea/23097%20TEXTO%20BASE.pdf.
    Whether it survived the 2026 legislature change-over could **not be verified**.

### A.4 Interoperability framework and national data-exchange platform

- **No interoperability law exists.** Verified instruments:
  - **Ley 9943 "Creación de la Agencia Nacional de Gobierno Digital"** (exp. 21.180; approved in second debate
    21 Jan 2021; sanctioned 11 May 2021; published La Gaceta 187, Alcance 195, 29 Sept 2021). Art. 2 recognises the
    citizen's right to deal with the administration digitally and obliges all of the Administración Pública (LGAP art. 1
    sense, i.e. including autonomous bodies and municipalities) to start work plans to adopt ICT. Art. 3 g) defines
    *interoperabilidad*; art. 5 c) makes the ANGD's objective to "implementar mecanismos de intercambio de información,
    identidad digital e integración de los sistemas de información electrónica (interoperabilidad)"; art. 3 f) defines
    "proyectos y servicios transversales" as common platforms "que deben ser utilizados para que las instituciones brinden
    sus servicios". Text: https://www.imprentanacional.go.cr/pub/2021/09/29/ALCA195_29_09_2021.pdf ; SCIJ:
    https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=95260.
    The law contains **no once-only rule, no data-exchange legal basis and no sanction**; it creates the executor.
  - **Decreto Ejecutivo 44636-MP-MICITT**, Reglamento a la Ley 9943 (public consultation 31 July–16 Aug 2024 after Sala
    Constitucional sentencia 2024-018839 of 5 July 2024 ordered MICITT to regulate within two months; published
    Sept 2024) — https://delfino.cr/2024/08/micitt-saca-a-consulta-reglamento-a-ley-que-creo-agencia-de-gobierno-digital-tras-condena-de-la-sala-iv ;
    https://dplnews.com/costa-rica-publica-reglamento-agencia-gobierno-digital/ ; decree number confirmed in
    MICITT-DGDCFD-INF-014-2025 p. 15.
  - **Decreto Ejecutivo 44507-MICITT "Código Nacional de Tecnologías Digitales"** (published 19 June 2024): mandatory
    minimum standards for public-sector ICT, including "interoperabilidad" and citizen authentication, used to grant a
    "Sello de Gobierno Digital" — https://www.micitt.go.cr/el-sector-informa/gobierno-oficializa-codigo-nacional-de-tecnologias-digitales-para-modernizar.
    It is a standards catalogue, not a data-sharing authorisation.
  - **Estrategia de Transformación Digital 2023-2027** (presented 31 Aug 2023): two axes, "Ciudadanía Digital" (firma
    digital, identidad digital, servicios) and "Buen Gobierno" (gobernanza de datos, **interoperabilidad**, actualización
    normativa) — https://www.micitt.go.cr/el-sector-informa/gobierno-presenta-estrategia-de-transformacion-digital-2023-2027.
    A policy document, not a norm. (The "Estrategia de Transformación Digital 4.0" was the 2018–2022 predecessor
    strategy; its formal instrument was **not verified**.)
  - **"Modelo de Interoperabilidad Social"**: MICITT put a proposal to non-binding public consultation 8–21 Jan 2025 and
    published the technical report MICITT-DGDCFD-INF-014-2025 (5 Aug 2025). It adopts **X-Road** as the "Plataforma de
    Interoperabilidad Nacional", anchors it on Ley 9137 (SINIRUBE), Ley 9943, Ley 8968, Ley 8220 and Ley 8454, and lists
    as open risks the absence of a binding legal framework for autonomous institutions and municipalities and the need
    for an executive decree to formalise governance —
    https://www.micitt.go.cr/transparencia/consultas-publicas (consultation) and the PDF cited above. No executive decree
    adopting the model had been found by the research date (**not verified**).
  - **CRI/003 "Conecta"** (launched 11 March 2026 by MICITT and ANGD; funded by Luxembourg, executed by ANGD with LuxDev;
    30 institutions in the diagnostic workshop; "primer hito para la adopción del modelo de interoperabilidad país basado
    en la plataforma X-Road") — https://www.micitt.go.cr/el-sector-informa/costa-rica-acelera-su-transformacion-digital-con-el-lanzamiento-del-proyecto ;
    https://crhoy.com/tecnologia/lanzan-proyecto-de-interoperabilidad-ante-problematica-por-desconexion-entre-sistemas-estatales/.
    First functional X-Road demonstration in the health sector on 18 June 2026 — explicitly a **pilot**, run by private
    vendors with MICITT/ANGD participation, no legal basis cited —
    https://delfino.cr/2026/06/costa-rica-alcanza-un-hito-de-interoperabilidad-hacia-una-atencion-de-salud-mas-rapida-segura-y-centrada-en-las-personas.
  - **Older sector buses exist** (not a national platform): SINIRUBE (Ley 9137, social benefits registry), the CFIA APC
    (construction, see B.3), VUI (investment, see B.1), SICOP (procurement, A.6). Ley 9986 reglamento reform Decreto
    45782-H-MIDEPLAN-MICITT (23 March 2026) even orders MEIC to ensure "interoperabilidad del sistema digital unificado"
    with its own systems — http://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/D/2020-2029/2025-2029/2026/1A298/1826E6.HTML.
- **Bills:** no "Ley Marco de Gobierno Digital" / "Ley de Transformación Digital del Estado" bill with a 2022-2026
  expediente number could be located on delfino.cr/asamblea or the Asamblea press summaries (**not verified — searched,
  none found**). The only digital-domain law passed in the period is **Ley 10946, Gobernanza de los Servicios Digitales
  y el Comercio Electrónico** (exp. 23.184; first debate 14 Apr 2026, second debate 16 Apr 2026; La Gaceta Alcance 80,
  24 June 2026; in force 12 months after publication). It regulates platforms, intermediaries and e-commerce consumer
  protection; it does **not** cover public-sector interoperability —
  https://delfino.cr/asamblea/proyecto/23184 ; https://kpmg.com/cr/es/insights/2026/06/newsflash-jun-30.html ;
  https://www.ecija.com/actualidad-insights/costa-rica-aprueba-ley-de-gobernanza-de-los-servicios-digitales-y-el-comercio-electronico/.

### A.5 Digital identity

- **Cédula de identidad (TSE)** remains the root identity; the TSE issues the cédula (adults) and the **TIM — Tarjeta
  de Identidad de Menores** (free, ages 12–17; new design March 2026) —
  https://www.tse.go.cr/pdf/requisitosytramites/Expedicion-de-tarjeta-de-identidad-de-menores.pdf ;
  https://delfino.cr/2026/03/tse-presenta-nuevo-diseno-de-la-tarjeta-de-identidad-de-menores-con-mayores-medidas-de-seguridad.
- **"Pase Digital" / pasedigital.go.cr: not verified.** The host `pasedigital.go.cr` did not resolve in DNS on the
  research date and no official or press reference to a Costa Rican "Pase Digital" was found. The national digital-ID
  product is the TSE's **Identidad Digital Costarricense (IDC)** — the demo should reference IDC, not "Pase Digital".
- **IDC — Identidad Digital Costarricense:**
  - Run by the **TSE** (not MICITT), developed with Korea's KOMSCO; app "IDC-Ciudadano" (store name "Identidad Digital
    CR"); ISO 18013-5 mobile-ID standard — https://www.biometricupdate.com/202509/costa-rica-rolls-out-national-digital-identity-app ;
    https://www.tse.go.cr/idc/ ; https://play.google.com/store/apps/details?id=com.getgroup.costarica.mid.citizen&hl=en_US.
  - Legal basis: TSE **Reglamento del servicio de identificación digital para personas ciudadanas costarricenses**,
    approved by the Tribunal 4 Sept 2025 (resolución 5647-E8-2025 of 2 Sept 2025 per ECIJA); the TSE regulates identity
    documents under its constitutional autonomy (Constitución arts. 99, 102) and Ley 3504 (Ley Orgánica del TSE y del
    Registro Civil) — reglamento: https://vlex.co.cr/vid/reglamento-servicio-identificacion-digital-1090731393 ;
    https://www.ecija.com/actualidad-insights/identidad-digital-costarricense/ (the statutory articles were **not
    verified** against the reglamento text).
  - Launched **9 Sept 2025**; ₡2,600, exempt for adultos mayores; 4-year validity; same legal validity as the physical
    cédula for civil, administrative and judicial purposes; not usable to vote on 1 Feb 2026 —
    https://www.tse.go.cr/comunicado1066.html ; https://www.elfinancierocr.com/economia-y-politica/cedula-virtual-ya-es-una-realidad-en-costa-rica/Y4XSGM2OGFEXFPFUJDCIN5WG3M/story/.
  - **Mandatory acceptance:** the reglamento gave public and private entities six months to adapt; on 12 March 2026 the
    TSE (resolución 1120-E7-2026, after requests from the Ministerio de Seguridad Pública and the Poder Judicial) moved
    the mandatory date to **1 January 2027**, after which no entity may demand the physical cédula in addition to the IDC —
    https://www.nacion.com/el-pais/identidad-digital-en-costa-rica-toma-nuevo-impulso/LMC4CIMZTRD6VKAMF5N2MWDZAM/story/ ;
    https://www.nacion.com/el-pais/instituciones-publicas-y-empresas-privadas-deberan/VC3FB74UIZEE7IRJHNR6BKXG6E/story/.
    This is a TSE regulation, not a statute; there is **no law** making a digital ID mandatory for all entities.
  - Adoption: 18,521 people paid for it on day one (TSE comunicado 1066); no later cumulative figure was found
    (**not verified**).
- **Authentication for e-services today** is still mostly *firma digital* (BCCR certificate on card/USB, and the newer
  cloud-based option) or institution-specific user/password (CCSS Oficina Virtual, TRIBU-CR). The IDC is a
  *credential*, not yet a federated login for state portals (no verified evidence of SSO use by CCSS/Hacienda as of the
  research date).

### A.6 Ley 9986 — Ley General de Contratación Pública (2021, in force 1 Dec 2022) and SICOP

- **Art. 16:** "el sistema digital unificado es único y centraliza los procedimientos de las entidades para toda
  actividad contractual que emplee total o parcialmente fondos públicos. Cualquier otro medio utilizado para realizar los
  procedimientos de contratación, implicará su nulidad absoluta, salvo situaciones de caso fortuito o fuerza mayor" —
  Ministerio de Hacienda press note CP-73-2024 (6 Sept 2024) quoting art. 16 and recalling that the earlier directive
  (025-H, 2018) was replaced by directriz 043-H because the obligation is now in the law itself:
  https://www.hacienda.go.cr/docs/CP73-2024.pdf. Law text: https://www.hacienda.go.cr/docs/LeyGeneraldeContratacionPublicaMayo2021.pdf.
- **Municipalities:** covered, because art. 1 (ámbito) reaches every entity using public funds and art. 16 attaches to
  "toda actividad contractual"; municipal training materials confirm SICOP is mandatory for local governments —
  https://academiamunicipal.uned.ac.cr/capacitacion/generalidades-para-el-uso-del-sistema-integrado-de-compras-publicas-sicop.
  Reglamento: Decreto 43808-H (22 Nov 2022), reformed by Decreto 45782-H-MIDEPLAN-MICITT (23 March 2026) which repeals
  the old SICOP decree 41438-H — pgrweb link in A.4.
- **Relevance for the demo:** Ley 9986 is the one Costa Rican precedent of a *statute* that makes a single national
  platform mandatory for every public entity, on pain of nullity. A once-only law could copy that drafting.

### A.7 Digital-government governance

- **Rector:** MICITT, through its **Dirección de Gobernanza Digital** (policy, standards, CNTD, Sello de Gobierno
  Digital) — https://www.micitt.go.cr/gobierno-digital/gobernanza-digital.
- **Executor:** **ANGD (Agencia Nacional de Gobierno Digital)**, Ley 9943 (2021), órgano de desconcentración mínima
  attached to MICITT; Junta Directiva of five (MICITT presiding, Hacienda, MEIC, MIDEPLAN, UCCAEP); financed inter alia
  by 10 % of central-government under-execution in ICT budget lines (art. 7). Politically "launched" 9 Nov 2021, but only
  regulated after the Sala IV order of July 2024 (Decreto 44636-MP-MICITT) and **formally operating since September
  2025** — https://www.micitt.go.cr/micitt/agencia-nacional-de-gobierno-digital ;
  https://presidencia.gobiernocarlosalvarado.cr/comunicados/2021/11/costa-rica-lanza-agencia-nacional-de-gobierno-digital/ ;
  https://www.micitt.go.cr/el-sector-informa/costa-rica-acelera-su-transformacion-digital-con-el-lanzamiento-del-proyecto.
  So the answer to "any 2024-2026 decree creating an agency" is: the agency was created by *law* in 2021; the 2024
  decree is its reglamento.
- **Comisión de Alto Nivel de Gobierno Digital:** created by Decreto Ejecutivo 41248-MP-MICITT-PLAN-MEIC-MC (2018) to
  advise on digital-government policy — SCIJ entry
  https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=87418&nValor3=113886&param2=2&strTipM=TC ;
  whether it is still active after the ANGD reglamento was **not verified**.
- **Related decrees:** Decreto 45061-MICITT (2024) Reglamento para la Gobernanza en Ciberseguridad (replaces 37052);
  Salud Digital decree signed 21 Feb 2023 giving the Ministerio de Salud data governance over health data and a
  Comité Técnico Asesor de Salud Digital, with MICITT supporting on interoperability and digital identity —
  https://www.micitt.go.cr/el-sector-informa/decreto-ejecutivo-posibilitara-aplicacion-de-salud-digital-en-los-costarricenses
  (decree number **not verified**).

---

## B. Per life-event workflow: today / partial / needs new law

Legend: **TODAY** = exists as a digital service with a legal basis; **PARTIAL** = digital but siloed, paper-fallback or
consent/convenio-dependent; **NEEDS LAW/DECREE** = no legal basis for an automatic once-only flow.

### B.1 Start a business (persona física and sociedad)

| Step | Platform / law | Status |
|---|---|---|
| Incorporate a sociedad, get cédula jurídica, legalise books | **Crear Empresa** (crearempresa.go.cr), Registro Nacional; requires firma digital; connects Registro Nacional, DGT/Hacienda (inscription), CCSS (patrono), Salud (PSF), SETENA, SENASA, INS (RT policy check), municipalities (patente, uso de suelo) — https://crearempresa.go.cr/cfmx/plantillas/gobDigital/faq.cfm ; launch coverage https://www.elfinancierocr.com/pymes/gobierno-digital-lanza-manana-crearempresa-para-inscripcion-de-nuevos-negocios-en-linea/DRQKCJGW2BFT7BBK2GJHOOCU3I/story/ | **TODAY** for the notarial/registral step; the downstream integrations are opt-in per institution and municipality (current usage statistics **not verified**) |
| Tax registration | **TRIBU-CR** replaced ATV; Registro Único Tributario declaration mandatory for all (new and existing) taxpayers; go-live announced for 4 Aug 2025 and finally launched 6 Oct 2025; ATV switched off — https://www.nacion.com/economia/registro-unico-tributario-en-tribu-cr-asi-se/VHJARKYKBRAWZE26EXKXRLD2EM/story/ ; https://www.elfinancierocr.com/lab-de-ideas/educacion-financiera/tribu-cr-esta-es-la-guia-paso-a-paso-con-todo-lo/TAKOTX35QFG7TNLEPHIWJJM3HM/story/ | **TODAY** (online, but a separate identity/login; RUT asks for domicile geo-coordinates) |
| CCSS employer registration | **Oficina Virtual CCSS** (successor of Oficina Virtual SICERE, 2016); online self-registration for patronos and workers — https://gobiernocr.administracionsolisrivera.cr/oficina-virtual-sicere-se-transforma-en-oficina-virtual-ccss/ ; https://www.ccss.sa.cr/patronos | **TODAY** (separate credential; no automatic feed from Registro Nacional except via Crear Empresa) |
| INS riesgos del trabajo | Código de Trabajo art. 193 (Ley 6727, 1982) makes the policy compulsory for every patrono, INS monopoly; online purchase at asegurate.grupoins.com — https://www.cso.go.cr/legislacion/leyes/ley_n_6727_reforma_del_titulo_IV_del_codigo_de_trabajo.pdf ; https://www.grupoins.com/ins-pyme/pyme-seguros/riesgos-del-trabajo/ | **TODAY** (online) |
| Permiso Sanitario de Funcionamiento | **Decreto 43432-S** (current reglamento; replaced 39472-S): declaración jurada (Anexo 3) filed online, risk groups A/B/C, 5-year validity; filed through VUI or Salud — https://vlex.co.cr/vid/decreto-n-43432-s-923347490 ; https://vui.cr/tramite/permiso-sanitario-de-funcionamiento-ministerio-de-salud/ | **TODAY** |
| Municipal patente | Código Municipal (Ley 7794) art. 88: licencia municipal required for any actividad lucrativa (last reformed by Ley 10421, 14 Nov 2023); each canton has its own Ley de Patentes, e.g. **Ley 5694 (San José, 1975)** and its reglamento — https://www.santaana.go.cr/tramites/solicitud-de-licencia-de-actividad-lucrativa/ ; https://d2zue4w9hni6vy.cloudfront.net/Ley%20No.%205694%20impuestos%20municipales%20de%20San%20Jos%C3%A9.pdf ; San José still publishes a PDF form requiring lawyer-authenticated signature, uso de suelo certificate and CCSS status — https://www.msj.go.cr/docu/Tramites/Solicitud%20de%20Patente%20Comercial,%20Licencia%20de%20Licores%20y%20de%20Espect%C3%A1culos%20P%C3%BAblicos%20-%20Formulario%20y%20Requisitos.pdf | **PARTIAL** — 82 cantons, 82 laws; online only where the canton joined VUI or Crear Empresa (Montes de Oca's patente law number **not verified**) |
| **VUI — Ventanilla Única de Inversión** | Run by PROCOMER (COMEX, MEIC support); reglamento published La Gaceta 68, 19 Apr 2018 (SCIJ: https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=86317&nValor3=111914&strTipM=TC); 19 public institutions and >40 trámites (Salud PSF, CCSS, INS, Migración, SETENA, SENARA, SINAC, SENASA, SFE, AyA, DGT, Aduanas…); **54 municipalities** by Feb 2025; OECD 2025 review — https://vui.cr/sobre-vui/ ; https://procomer.com/municipalidad-de-san-carlos-implementa-la-ventanilla-unica-de-inversion/ ; https://www.oecd.org/en/publications/2025/04/review-of-costa-rica-s-one-stop-shop-for-investment_7d4e25c1.html | **TODAY** for companies in adhered cantons; **PARTIAL** nationally |

What would **NEED LAW/DECREE**: a single "start a business" event that auto-creates the CCSS patrono, TRIBU-CR RUT, INS
policy and patente from one submission requires (a) a legal basis for Registro Nacional → CCSS/Hacienda/municipality
data push without a per-institution convenio (Ley 8968 art. 14 / Ley 8220 art. 2 para. 2), (b) a national rule that
municipal patente procedures accept the national single form (today each Ley de Patentes fixes its own requisitos),
(c) mandatory adhesion of municipalities to the national platform (Ley 9943 art. 2 obliges "planes de trabajo", not
adhesion).

### B.2 Birth of a child

- **Hospital declaration:** the TSE's **Sistema de Declaración de Nacimientos en Línea** started in 2016 in nine
  hospitals (Calderón Guardia, México, San Vicente de Paúl, Tony Facio, San Rafael, Max Peralta, Enrique Baltodano,
  La Anexión, San Juan de Dios; 5,904 registrations in the first five months), extended to Carit and Monseñor Sanabria
  in late 2016 and to eleven more hospitals in 2017; TSE *registradores auxiliares* in hospitals capture parents,
  newborn and signatures and the child is registered the same day —
  https://elmundo.cr/costa-rica/tse-impulsa-la-inscripcion-de-nacimientos-en-linea/. ~98 % of births occur in hospitals
  with TSE staff present — https://www.tse.go.cr/pdf/ifed/registro_nacimientos_costa_rica.pdf. Legal basis: Ley 3504
  (Ley Orgánica del TSE y del Registro Civil) and the Reglamento del Registro del Estado Civil (registradores
  auxiliares; hospital directors as auxiliary registrars since Decreto 2 of 26 Sept 1963) — same TSE document.
  Current hospital coverage and same-day percentage for 2024-2026 **not verified**. **TODAY**.
- **CCSS newborn insurance:** not automatic. The child is insured as *beneficiario familiar* on request of the direct
  insured parent (Protección Familiar); CCSS verifies Costa Rican minors electronically (i.e. against TSE records) but
  the request is filed at the Área de Salud/EBAIS or online under Trámites → Aseguramiento → Protección Familiar, with
  an interview and ~8 days to resolve — https://www.nacion.com/ciencia/salud/como-asegurar-a-un-familiar-en-la-ccss-conozca-los/OYLFUCDPLZBVHEV6WEMX44IEPA/story/ ;
  https://www.ccss.sa.cr/tramites?t=41. **PARTIAL** (TSE→CCSS lookup exists, but the event does not trigger coverage).
- **EDUS (Expediente Digital Único en Salud):** the newborn gets an EDUS record on first contact with CCSS; the EDUS app
  lets insured persons update data and adscribe to a health area — https://www.ccss.sa.cr/appedus/. Automatic creation
  at birth from the TSE feed **not verified**. **PARTIAL**.
- **TIM at 12:** free, in person at TSE with a family witness — TSE requisitos PDF cited in A.5. **TODAY** (not digital).
- **NEEDS LAW/DECREE:** an automatic "birth → CCSS beneficiary → EDUS → notification to parents" chain needs a legal
  mandate for TSE→CCSS push (today CCSS *pulls* on request) and a rule in the CCSS Reglamento del Seguro de Salud
  making newborn coverage event-driven; this is CCSS internal regulation (Junta Directiva) plus a data-sharing basis.

### B.3 Construction permit

- **APC (Administrador de Proyectos de Construcción), CFIA:** created by **Decreto 36550-MP-MIVAH-S-MEIC** (Reglamento
  para el Trámite de Revisión de los Planos para la Construcción, in force 20 Sept 2011) — INVU, Ministerio de Salud,
  Bomberos, AyA and CFIA review one digital set of plans; no physical plans —
  https://www.bomberos.go.cr/revision-de-proyectos-constructivos-en-la-plataforma-apc/ (404 desde el 8 sep 2026;
  el catálogo cita ahora el decreto en SCIJ) ; SCIJ:
  http://www.pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=70485&nValor3=96939&strTipM=TC ;
  CFIA legal list https://cfia.or.cr/apc/profesional/legislacion-aplicable.html. **TODAY**.
- **SETENA:** a 2021 CFIA–SETENA convenio started integrating viabilidad ambiental into APC; completion status
  **not verified** — https://www.setena.go.cr/es/Noticias_Anteriores/Convenio-CFIA-SETENA. **PARTIAL**.
- **APC-M (municipal):** professionals apply for the municipal licence through APC-M; 70 of 82 municipalities were
  "100 % digital" in 2020, 12 in mixed mode — https://revista.cfia.or.cr/70-municipios-del-pais-son-100-digitales-en-tramites-de-permisos-de-construccion/ ;
  https://vui.cr/tramite/apc-m-administrador-de-proyectos-de-construccion-municipal-cfia/. Current count **not verified**.
  **TODAY/PARTIAL**.
- **Legal basis of the municipal permit and the 1 % tax:** Ley de Construcciones 833 (1949) art. 74 — every work in
  populated areas needs a licencia from the municipality; Ley de Planificación Urbana 4240 art. 70 — municipalities may
  levy up to 1 % of the value of the construction on the licence (public-interest works exempt) —
  https://www.cso.go.cr/legislacion/leyes/ley_de_construcciones_n_833_del_10_de_noviembre_del_ano_1982.pdf ;
  https://www.ucr.ac.cr/medios/documentos/2015/LEY-4240.pdf. **TODAY**.
- **Uso de suelo:** municipal certificate under Ley 4240 (plan regulador); each municipality issues it, many online but
  not through APC — e.g. https://muniguarco.go.cr/tramites/certificado-uso-suelo/. **PARTIAL**.
- **Registro Nacional property check:** free consultation and paid certificaciones literales at rnpdigital.com —
  https://www.rnpdigital.com/shopping/login.jspx ; https://www.registronacional.go.cr/. **TODAY** (but the municipality
  usually still asks the applicant for the certificate rather than querying it — this is exactly the Ley 8220 art. 8
  failure mode).
- **NEEDS LAW/DECREE:** amending Decreto 36550 to (a) make APC-M adhesion mandatory for all 82 municipalities, (b) let
  APC pull Registro Nacional ownership and municipal uso de suelo automatically, and (c) add SETENA — all doable by
  executive decree since 36550 is itself a decree, *except* the municipal duty (municipal autonomy, Constitución
  art. 170) which needs a statute or a Código Municipal amendment.

### B.4 Change of address

- **TSE domicilio electoral:** online only for Costa Ricans abroad (servicioselectorales.tse.go.cr); residents must
  change it **in person** (free) at TSE offices — https://www.tse.go.cr/comunicado1054.html ;
  https://tse.go.cr/pdf/requisitosytramites/Solicitud-de-traslado-electoral-domicilio.pdf. **PARTIAL**.
- **Hacienda domicilio fiscal:** online in TRIBU-CR, "Modificación de datos del Registro Único Tributario", with
  lat/long of the domicile — https://www.nacion.com/economia/registro-unico-tributario-en-tribu-cr-asi-se/DLQIXZNCBFDTBKTFBISTRCNJ4I/story/. **TODAY**.
- **CCSS:** address updated by the insured in Oficina Virtual / EDUS app (self-service) — https://www.ccss.sa.cr/appedus/. **TODAY**.
- **Municipality:** address for property tax / patente notifications is per-canton; no national channel found. **PARTIAL**.
- **Single change-of-address service:** **none exists** (no source found; the address is not even a shared attribute —
  TSE stores *domicilio electoral*, Hacienda a geo-referenced *domicilio fiscal*, CCSS a *dirección de notificación*).
  **NEEDS LAW/DECREE:** a "registro único de domicilio" or a rule that one declaration propagates would need (a) a
  legal definition of the canonical address and its custodian, (b) TSE participation, which — given TSE constitutional
  autonomy — needs the TSE's own reglamento or a law it accepts, and (c) the Ley 8968 transfer basis.

### B.5 Retirement and losing a job

- **Pensión IVM (CCSS):** since **21 July 2025** the old-age pension can be requested fully online in Oficina Virtual
  CCSS; the system checks cuotas, age and employment status internally, asks for IBAN and, if still employed, the
  employer's note with the last working day — https://observador.cr/ccss-habilita-tramite-digital-para-solicitar-pension-por-vejez/ ;
  https://www.supen.fi.cr/en/w/ccss-ivm-solicitud-de-pensi%C3%B3n-por-vejez-desde-la-oficina-virtual. **TODAY**
  (a good example of intra-institution once-only).
- **ROP (Régimen Obligatorio de Pensiones Complementarias) and FCL — Ley 7983 Protección al Trabajador (2000):** FCL
  is 1.5 % of salary (art. 3); on termination of employment "por cualquier causa" the operadora must pay out within
  15 days (art. 6); five-year withdrawals in 2026 — https://www.supen.fi.cr/documents/20121/45036/Ley+de+Protecci%C3%B3n+al+Trabajador+No.+7983.pdf/7d75e88d-6cbb-d2bb-28bf-7a360d9148ee?version=1.0&t=1633639189566&download=true ;
  https://www.elfinancierocr.com/finanzas/fcl-2026-guia-completa-para-el-retiro-del-quinto/NXYN6N3KR5EIJEO5VSPDZGNNSY/story/.
  Operadoras offer digital channels (BN Vital via BN Mobile/web, BAC Pensiones, BCR Pensiones, Popular Pensiones,
  OPC CCSS) — https://www.bancobcr.com/wps/portal/bcr/bancobcr/personas/bcr_pensiones/centro_de_atencion/retiro_fcl/ ;
  https://www.opcccss.fi.cr/fcl/. **TODAY** per operadora, but the worker must prove the termination to the operadora
  (the CCSS "cese" is not pushed automatically) — **PARTIAL** as a life event. ROP withdrawal at retirement is handled
  by the operadora once the IVM (or other régimen) pension is granted; SUPEN FAQ —
  https://www.supen.fi.cr/en/preguntas-frecuentes.
- **Unemployment:** there is **no unemployment insurance** in Costa Rica; FCL is the only statutory cushion (Ley 7983
  arts. 3, 6). **NEEDS LAW** for anything beyond FCL.
- **NEEDS LAW/DECREE for once-only:** an automatic "job loss → FCL → CCSS aseguramiento continuity" chain needs a legal
  basis for CCSS (planilla) → SUPEN/operadoras notification; SUPEN could arguably do it by reglamento under Ley 7983,
  but the CCSS side is Ley 8968 art. 14 territory.

### B.6 Driver's licence renewal (COSEVI, Ley 9078)

- **Ley 9078, Ley de Tránsito por Vías Públicas Terrestres y Seguridad Vial (2012):** requires a *dictamen médico
  general* by a physician authorised by the Colegio de Médicos for first issue and renewal; renewal term depends on
  points (art. 134): 6 years with ≤4 points — https://vlex.co.cr/vid/ley-9078-transito-vias-639401821 ;
  Colegio de Médicos normativa https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?nValor1=1&nValor2=69273.
- **Dictamen médico digital:** since 2015-2016 the dictamen is recorded by the physician in **SEDIMEC** and read by
  COSEVI directly; valid 180 days — https://www.nacion.com/el-pais/salud/ya-puede-tramitar-el-dictamen-medico-en-linea-si/UHZG3AAJBZFQ3K47AXIONEKALI/story/ ;
  https://licenciadeconducircr.com/licencia-cr/dictamen-medico-digital-requisito-clave-para-la-licencia-en-costa-rica/. **TODAY**.
- **Online renewal: does not exist.** Renewal is in person, by appointment, at 42 BCR branches or 13 MOPT Educación Vial
  offices; fines must be paid first — https://www.mopt.go.cr/wps/portal/Home/noticias/899f076d-bbb5-4399-964c-75364780b7f9/ ;
  https://bcrcita.bancobcr.com/citas/Home/Licencia. The MOPT tendered (licitación 2026LY-000001-0012400001) a 10-year
  contract for digital licence issuance, online theory tests and a QR digital licence, targeting H2 2026; a Dec 2025
  reform removed the duty to carry the physical licence —
  https://www.nacion.com/el-pais/mopt-lanzara-concurso-para-servicio-de-licencia/LY2734R6OFF3BBMWBSTQYOSYVY/story/ ;
  https://www.elfinancierocr.com/economia-y-politica/que-paso-con-el-proyecto-de-licencia-digital-del/O2ATGLMED5ANLEOWDEPEQNHWBA/story/. **PARTIAL**.
- **NEEDS DECREE (not law):** Ley 9078 does not require physical presence for renewal; the in-person step is
  contractual (BCR) and regulatory (Reglamento de licencias). Once the IDC provides remote identity proofing, a
  COSEVI/MOPT reglamento change plus the SEDIMEC feed is enough for online renewal.

---

## C. Gaps a "Ley de Eficiencia Digital / Gobierno Digital" would have to fill

Mapped to the findings above. Everything here is *absent* today unless noted.

1. **A real cross-entity once-only rule with a legal basis for exchange.** Ley 8220 art. 2 is intra-entity and art. 8
   only says "coordinar… por los medios a su alcance"; art. 2 para. 2 and Ley 8968 art. 14 demand consent for every
   transfer. The law should (a) declare that data an institution holds *ex lege* may be verified by any other institution
   through the national bus for a listed trámite, with the citizen informed and able to see the log (Ley 8968 art. 5 c)
   route), and (b) keep express consent for everything outside that list. (A.2, A.3)
2. **A statutory national interoperability platform, mandatory on pain of invalidity**, copying Ley 9986 art. 16
   drafting: every trámite listed in the Catálogo Nacional de Trámites that needs data held by another public entity
   must obtain it through the platform; requiring the citizen to bring it is a *falta grave* (Ley 8220 art. 10). Today
   X-Road is a project (Conecta) and a report (MICITT-DGDCFD-INF-014-2025), not a norm. (A.4, A.6)
3. **Binding on autonomous institutions and municipalities.** Ley 9943 art. 2 only obliges "planes de trabajo"; MICITT's
   own report lists the missing "marco legal vinculante" for autonomous bodies and municipalities as a risk. The law must
   name CCSS, TSE (to the extent the Constitution allows), INS, Registro Nacional, universities and all 82 municipalities
   expressly, with a compliance calendar. (A.4, B.1, B.3)
4. **Audit and transparency duties for the bus:** field-level (not value-level) logging, citizen access to "who queried
   my data and why", retention, and PRODHAB supervision of the bus itself — none of this exists; PRODHAB's position on
   public-to-public transfers is contested. (A.3)
5. **Digital identity as a login, not only a credential:** the IDC is mandatory-to-accept from 1 Jan 2027 by TSE
   reglamento only; the law should recognise IDC and firma digital as valid authentication for every state e-service
   (today only Directriz 067-MICITT-H-MEIC of 2014, for firma digital). (A.1, A.5)
6. **Event-driven services ("life events") authorised by law:** birth → CCSS beneficiary/EDUS; job loss → FCL/CCSS;
   incorporation → CCSS patrono/TRIBU-CR/INS/patente; death → pensions. Each currently needs a citizen-initiated request
   because no norm allows the holding institution to *push*. (B.1, B.2, B.5)
7. **Single canonical address and other reference registries** (domicilio, contact channel for notifications) with a
   designated custodian; today there is no change-of-address service at all and the TSE's domestic change is in person. (B.4)
8. **Municipal harmonisation:** a national minimum for patente and construction-licence requisitos and mandatory
   adhesion to APC-M / VUI-type platforms, respecting Constitución art. 170 autonomy by legislating the *procedure*, not
   the tax. (B.1, B.3)
9. **Funding and governance:** ANGD financing (Ley 9943 art. 7) is tied to budget under-execution for at most eight
   years; a digital-government law should give the platform a stable budget line and a clear rector/executor split with
   sanctioning power for MEIC (Ley 8220) or MICITT. (A.7)
10. **Data-protection modernisation:** pass exp. 23.097 (or equivalent) so that "misión de interés público / ejercicio
    de poderes públicos" becomes an explicit lawful basis, closing the art. 8 vs. art. 14 ambiguity. (A.3)
11. **Sector reglamentos to update once the law exists** (decree level, no statute needed): Decreto 36550 (APC + SETENA
    + Registro Nacional pull), CCSS Reglamento del Seguro de Salud (newborn auto-coverage), MOPT/COSEVI licence
    reglamento (online renewal), Reglamento 37045 to Ley 8220 (interoperability as the default "medio a su alcance"). (B.2, B.3, B.6)

---

## Sources

Official / primary
- Ley 8220 consolidated SCIJ text (mirror): https://escazu.go.cr/wp-content/uploads/2026/01/ley_8220_proteccion_al_ciudadano_del_exceso_de_requisitos_y_tramites_administrativos.pdf
- Ley 8220 publication data (MEIC): https://www.meic.go.cr/documentos/ley-no-8220-ley-de-proteccion-al-ciudadano-del-exceso-de-requisitos-y-tramites-administativos-y-sus-reformas-publicada-en-el-diario-oficial-la-gaceta-no-49-alcance-22-del-11-03/
- Ley 8990 (MOPT repository): https://repositorio.mopt.go.cr/items/180fc17a-8371-4479-8cb9-36b9351b9145
- Ley 10072 signing note (Presidencia, Nov 2021): https://presidencia.gobiernocarlosalvarado.cr/comunicados/2021/11/firmada-reforma-a-la-ley-que-fortalece-la-simplificacion-de-tramites-en-el-sector-publico/
- Decreto 37045-MP-MEIC (MEIC): https://www.meic.go.cr/documentos/decreto-ejecutivo-no-37045-reglamento-a-la-ley-no-8220-publicado-en-el-diario-oficial-la-gaceta-no-60-alcance-no-36-del-23-03-2012/
- MEIC índice de capacidad regulatoria municipal: https://www.meic.go.cr/unicamente-4-gobiernos-locales-obtienen-categoria-avanzada-en-indice-de-capacidad-regulatoria-institucional-del-meic/
- Ley 8454 SCIJ text (mirror, CSV): https://www.csv.go.cr/documents/20126/47774/Ley+de+Certificados,+Firmas+Digitales+y+Documentos+Electr%C3%B3ni.pdf/1a9a4647-b531-96f8-0296-9353e927c967?t=1558541677850
- Decreto 33018-MICIT: https://www.firmadigital.go.cr/Documentos/DecretoNum33018.pdf
- Directriz 067-MICITT-H-MEIC (SCIJ): http://www.pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=77067&nValor3=96446&strTipM=TC ; text: https://www.informatica-juridica.com/directriz/costa-rica-directriz/directriz-no-067-micitt-h-meic-25-abril-2014/
- Ley 8968 text: https://www.informatica-juridica.com/ley/ley-no-8968-proteccion-la-persona-frente-al-tratamiento-datos-personales/ ; SCIJ: https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=70975&nValor3=85989
- Decreto 37554-JP: https://www.informatica-juridica.com/anexos/decreto-ejecutivo-no-37554-jp-del-30-de-octubre-de-2012-reglamento-de-la-ley-no-8968/ ; PRODHAB normativa: https://prodhab.go.cr/acercade/normativa/
- Exp. 23.097 (Delfino tracker): https://delfino.cr/asamblea/proyecto/23097 ; texto base: https://proyectos.conare.ac.cr/asamblea/23097%20TEXTO%20BASE.pdf
- Exp. 22.388: https://delfino.cr/asamblea/proyecto/22388
- Ley 9943 (La Gaceta Alcance 195, 29 Sept 2021): https://www.imprentanacional.go.cr/pub/2021/09/29/ALCA195_29_09_2021.pdf ; SCIJ: https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=95260
- ANGD page (MICITT): https://www.micitt.go.cr/micitt/agencia-nacional-de-gobierno-digital ; Gobernanza Digital: https://www.micitt.go.cr/gobierno-digital/gobernanza-digital
- Reglamento Ley 9943 consultation (Delfino, Aug 2024): https://delfino.cr/2024/08/micitt-saca-a-consulta-reglamento-a-ley-que-creo-agencia-de-gobierno-digital-tras-condena-de-la-sala-iv ; publication: https://dplnews.com/costa-rica-publica-reglamento-agencia-gobierno-digital/
- Código Nacional de Tecnologías Digitales, Decreto 44507-MICITT: https://www.micitt.go.cr/el-sector-informa/gobierno-oficializa-codigo-nacional-de-tecnologias-digitales-para-modernizar
- ETD 2023-2027: https://www.micitt.go.cr/el-sector-informa/gobierno-presenta-estrategia-de-transformacion-digital-2023-2027
- Modelo de Interoperabilidad Social, informe MICITT-DGDCFD-INF-014-2025: https://www.micitt.go.cr/sites/default/files/transparencia/consulta-publica/MICITT-DGDCFD-INF-014-2025%20-Informe%20t%C3%A9cnico%20del%20Modelo%20de%20interoperabilidad%20social-%20(1).pdf ; consultas públicas: https://www.micitt.go.cr/transparencia/consultas-publicas
- CRI/003 Conecta (MICITT): https://www.micitt.go.cr/el-sector-informa/costa-rica-acelera-su-transformacion-digital-con-el-lanzamiento-del-proyecto
- Salud Digital decree note (MICITT): https://www.micitt.go.cr/el-sector-informa/decreto-ejecutivo-posibilitara-aplicacion-de-salud-digital-en-los-costarricenses
- Decreto 41248 Comisión de Alto Nivel (SCIJ): https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=87418&nValor3=113886&param2=2&strTipM=TC
- Ley 9986 text (Hacienda): https://www.hacienda.go.cr/docs/LeyGeneraldeContratacionPublicaMayo2021.pdf ; CP-73-2024 on art. 16: https://www.hacienda.go.cr/docs/CP73-2024.pdf
- Decreto 45782-H-MIDEPLAN-MICITT (2026): http://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/D/2020-2029/2025-2029/2026/1A298/1826E6.HTML
- Exp. 23.184 / Ley 10946: https://delfino.cr/asamblea/proyecto/23184 ; https://kpmg.com/cr/es/insights/2026/06/newsflash-jun-30.html
- TSE IDC page: https://www.tse.go.cr/idc/ ; comunicado 1066: https://www.tse.go.cr/comunicado1066.html ; reglamento (vLex): https://vlex.co.cr/vid/reglamento-servicio-identificacion-digital-1090731393
- TSE domicilio electoral: https://www.tse.go.cr/comunicado1054.html ; https://tse.go.cr/pdf/requisitosytramites/Solicitud-de-traslado-electoral-domicilio.pdf
- TSE births history: https://www.tse.go.cr/pdf/ifed/registro_nacimientos_costa_rica.pdf ; TIM: https://www.tse.go.cr/pdf/requisitosytramites/Expedicion-de-tarjeta-de-identidad-de-menores.pdf
- CCSS patronos / Oficina Virtual: https://www.ccss.sa.cr/patronos ; trámites: https://www.ccss.sa.cr/tramites?t=41 ; EDUS app: https://www.ccss.sa.cr/appedus/
- Ley 7983 (SUPEN): https://www.supen.fi.cr/documents/20121/45036/Ley+de+Protecci%C3%B3n+al+Trabajador+No.+7983.pdf/7d75e88d-6cbb-d2bb-28bf-7a360d9148ee?version=1.0&t=1633639189566&download=true ; SUPEN FAQ: https://www.supen.fi.cr/en/preguntas-frecuentes ; IVM online: https://www.supen.fi.cr/en/w/ccss-ivm-solicitud-de-pensi%C3%B3n-por-vejez-desde-la-oficina-virtual
- Código de Trabajo Título IV (Ley 6727): https://www.cso.go.cr/legislacion/leyes/ley_n_6727_reforma_del_titulo_IV_del_codigo_de_trabajo.pdf ; INS RT online: https://www.grupoins.com/ins-pyme/pyme-seguros/riesgos-del-trabajo/
- Decreto 43432-S PSF: https://vlex.co.cr/vid/decreto-n-43432-s-923347490 ; VUI PSF: https://vui.cr/tramite/permiso-sanitario-de-funcionamiento-ministerio-de-salud/
- VUI: https://vui.cr/sobre-vui/ ; reglamento VUI (SCIJ): https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=86317&nValor3=111914&strTipM=TC ; PROCOMER San Carlos (54th municipality): https://procomer.com/municipalidad-de-san-carlos-implementa-la-ventanilla-unica-de-inversion/ ; OECD review: https://www.oecd.org/en/publications/2025/04/review-of-costa-rica-s-one-stop-shop-for-investment_7d4e25c1.html
- Crear Empresa FAQ: https://crearempresa.go.cr/cfmx/plantillas/gobDigital/faq.cfm
- Ley 5694 San José: https://d2zue4w9hni6vy.cloudfront.net/Ley%20No.%205694%20impuestos%20municipales%20de%20San%20Jos%C3%A9.pdf ; MSJ patente form: https://www.msj.go.cr/docu/Tramites/Solicitud%20de%20Patente%20Comercial,%20Licencia%20de%20Licores%20y%20de%20Espect%C3%A1culos%20P%C3%BAblicos%20-%20Formulario%20y%20Requisitos.pdf ; Código Municipal art. 88 (Santa Ana): https://www.santaana.go.cr/tramites/solicitud-de-licencia-de-actividad-lucrativa/
- Decreto 36550 (SCIJ): http://www.pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=70485&nValor3=96939&strTipM=TC ; Bomberos APC: https://www.bomberos.go.cr/revision-de-proyectos-constructivos-en-la-plataforma-apc/ ; CFIA legislación APC: https://cfia.or.cr/apc/profesional/legislacion-aplicable.html ; SETENA–CFIA: https://www.setena.go.cr/es/Noticias_Anteriores/Convenio-CFIA-SETENA
- Ley 833: https://www.cso.go.cr/legislacion/leyes/ley_de_construcciones_n_833_del_10_de_noviembre_del_ano_1982.pdf ; Ley 4240: https://www.ucr.ac.cr/medios/documentos/2015/LEY-4240.pdf
- Registro Nacional: https://www.registronacional.go.cr/ ; https://www.rnpdigital.com/shopping/login.jspx
- Ley 9078 (vLex): https://vlex.co.cr/vid/ley-9078-transito-vias-639401821 ; Colegio de Médicos dictámenes (SCIJ): https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?nValor1=1&nValor2=69273 ; MOPT 55 renewal points: https://www.mopt.go.cr/wps/portal/Home/noticias/899f076d-bbb5-4399-964c-75364780b7f9/ ; BCR citas: https://bcrcita.bancobcr.com/citas/Home/Licencia
- BCCR Firma Digital: https://www.bccr.fi.cr/cr/es/firma-digital.html ; MICITT firma digital: https://mifirmadigital.micitt.go.cr/

Press / secondary (used for dates and status)
- IDC launch: https://www.biometricupdate.com/202509/costa-rica-rolls-out-national-digital-identity-app ; https://www.elfinancierocr.com/economia-y-politica/cedula-virtual-ya-es-una-realidad-en-costa-rica/Y4XSGM2OGFEXFPFUJDCIN5WG3M/story/ ; ECIJA on the IDC reglamento: https://www.ecija.com/actualidad-insights/identidad-digital-costarricense/
- IDC mandatory date moved to 1 Jan 2027: https://www.nacion.com/el-pais/identidad-digital-en-costa-rica-toma-nuevo-impulso/LMC4CIMZTRD6VKAMF5N2MWDZAM/story/ ; https://www.nacion.com/el-pais/instituciones-publicas-y-empresas-privadas-deberan/VC3FB74UIZEE7IRJHNR6BKXG6E/story/
- Conecta / interoperability gap: https://crhoy.com/tecnologia/lanzan-proyecto-de-interoperabilidad-ante-problematica-por-desconexion-entre-sistemas-estatales/ ; health X-Road pilot: https://delfino.cr/2026/06/costa-rica-alcanza-un-hito-de-interoperabilidad-hacia-una-atencion-de-salud-mas-rapida-segura-y-centrada-en-las-personas
- ANGD delay critique: https://delfino.cr/2023/05/el-estado-digital-costarricense-para-cuando ; launch 2021: https://presidencia.gobiernocarlosalvarado.cr/comunicados/2021/11/costa-rica-lanza-agencia-nacional-de-gobierno-digital/ ; exp. 21.180 approval: https://elmundo.cr/costa-rica/diputados-aprueban-crear-agencia-nacional-de-gobierno-digital/
- Ley 10946 analysis: https://www.ecija.com/actualidad-insights/costa-rica-aprueba-ley-de-gobernanza-de-los-servicios-digitales-y-el-comercio-electronico/
- Ley 8968 public-to-public transfer debate: https://adalidmedrano.com/se-pueden-transferir-bases-de-datos-personales-libremente-entre-instituciones-del-gobierno/2020/ ; https://oiprodat.com/2020/03/13/reflexiones-sobre-las-transferencias-de-datos-personales-y-las-excepciones-a-la-autodeterminacion-informativa-en-costa-rica/
- Ley 10181 reform of Ley 8454: https://vlex.co.cr/vid/ley-reformar-articulo-5-858016388
- TRIBU-CR: https://www.nacion.com/economia/registro-unico-tributario-en-tribu-cr-asi-se/VHJARKYKBRAWZE26EXKXRLD2EM/story/ ; https://www.elfinancierocr.com/lab-de-ideas/educacion-financiera/tribu-cr-esta-es-la-guia-paso-a-paso-con-todo-lo/TAKOTX35QFG7TNLEPHIWJJM3HM/story/ ; RUT modification: https://www.nacion.com/economia/registro-unico-tributario-en-tribu-cr-asi-se/DLQIXZNCBFDTBKTFBISTRCNJ4I/story/
- Oficina Virtual SICERE → CCSS: https://gobiernocr.administracionsolisrivera.cr/oficina-virtual-sicere-se-transforma-en-oficina-virtual-ccss/
- Crear Empresa launch: https://www.elfinancierocr.com/pymes/gobierno-digital-lanza-manana-crearempresa-para-inscripcion-de-nuevos-negocios-en-linea/DRQKCJGW2BFT7BBK2GJHOOCU3I/story/
- TSE online births (2016): https://elmundo.cr/costa-rica/tse-impulsa-la-inscripcion-de-nacimientos-en-linea/ ; TIM redesign 2026: https://delfino.cr/2026/03/tse-presenta-nuevo-diseno-de-la-tarjeta-de-identidad-de-menores-con-mayores-medidas-de-seguridad
- CCSS family insurance: https://www.nacion.com/ciencia/salud/como-asegurar-a-un-familiar-en-la-ccss-conozca-los/OYLFUCDPLZBVHEV6WEMX44IEPA/story/
- IVM online (July 2025): https://observador.cr/ccss-habilita-tramite-digital-para-solicitar-pension-por-vejez/
- FCL 2026 and digital channels: https://www.elfinancierocr.com/finanzas/fcl-2026-guia-completa-para-el-retiro-del-quinto/NXYN6N3KR5EIJEO5VSPDZGNNSY/story/ ; https://www.bancobcr.com/wps/portal/bcr/bancobcr/personas/bcr_pensiones/centro_de_atencion/retiro_fcl/ ; https://www.opcccss.fi.cr/fcl/
- APC-M 70 municipalities (2020): https://revista.cfia.or.cr/70-municipios-del-pais-son-100-digitales-en-tramites-de-permisos-de-construccion/ ; VUI APC-M: https://vui.cr/tramite/apc-m-administrador-de-proyectos-de-construccion-municipal-cfia/
- Digital licence tender: https://www.nacion.com/el-pais/mopt-lanzara-concurso-para-servicio-de-licencia/LY2734R6OFF3BBMWBSTQYOSYVY/story/ ; https://www.elfinancierocr.com/economia-y-politica/que-paso-con-el-proyecto-de-licencia-digital-del/O2ATGLMED5ANLEOWDEPEQNHWBA/story/ ; dictamen digital: https://www.nacion.com/el-pais/salud/ya-puede-tramitar-el-dictamen-medico-en-linea-si/UHZG3AAJBZFQ3K47AXIONEKALI/story/ ; https://licenciadeconducircr.com/licencia-cr/dictamen-medico-digital-requisito-clave-para-la-licencia-en-costa-rica/
- Academia Municipal on SICOP for municipalities: https://academiamunicipal.uned.ac.cr/capacitacion/generalidades-para-el-uso-del-sistema-integrado-de-compras-publicas-sicop
