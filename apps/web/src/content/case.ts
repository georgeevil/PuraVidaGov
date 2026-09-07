/**
 * The case for an integrated digital government in Costa Rica — content for /por-que.
 * Figures marked "aprox." are order-of-magnitude anchors; sources in docs/CASE.md and docs/research/.
 */
export type CaseStatus = 'hoy' | 'parcial' | 'ley';

export interface CaseContent {
  hero: { title: string; subtitle: string; disclaimer: string };
  problem: { title: string; paragraphs: string[]; stats: { label: string; value: string; source: string }[] };
  foundations: { title: string; intro: string; items: { name: string; what: string; status: CaseStatus }[] };
  roadmap: { title: string; intro: string; steps: { n: number; title: string; summary: string; actions: string[]; lawNeeded?: string }[] };
  dividend: { title: string; intro: string; rule: { share: number; destination: string }[]; caveats: string[] };
  evidence: { title: string; items: { claim: string; source: string; url?: string }[] };
  calculator: { title: string; intro: string; gdpCrcBillions: number; defaultSavingsPct: number; minPct: number; maxPct: number };
  asks: { title: string; items: string[] };
}

export const CASE: CaseContent = {
  hero: {
    title: 'Un Estado organizado alrededor de la persona, no de sus ministerios',
    subtitle:
      'Costa Rica ya tiene cédula digital, firma digital, SICOP, TRIBU-CR, EDUS y Pase Digital. Lo que no tiene es la capa que los une. Este demo muestra cómo se vería el país con esa capa, qué se puede hacer hoy y qué ley falta.',
    disclaimer: 'Demostración con datos ficticios. No es un sistema del Gobierno de Costa Rica ni una propuesta oficial.',
  },
  problem: {
    title: 'El problema no es la tecnología: es que cada institución empieza de cero',
    paragraphs: [
      'Para abrir una soda, una persona visita al notario, al Registro Nacional, a Hacienda, a la CCSS, a la municipalidad y al Área Rectora de Salud. En cada ventanilla entrega la misma cédula, la misma dirección y la misma actividad. Cada institución vuelve a digitarlas, con errores, y guarda su propia copia.',
      'La Ley 8220 prohíbe desde 2002 pedir documentos que otra institución ya tiene. Se incumple a diario, no por mala fe, sino porque no existe el canal por el que Hacienda pueda preguntarle al Registro Civil. El resultado son trámites de semanas, cuatro direcciones distintas de la misma persona en cuatro bases de datos y espacio para el «favor» que acelera el expediente.',
      'Estonia resolvió esto en 2001 con X-Road: una capa de intercambio obligatoria por ley, con cada consulta firmada y registrada. Singapur lo hizo con MyInfo y LifeSG: un perfil con lo que el Estado ya sabe y servicios organizados por momentos de vida. Ninguno de los dos inventó tecnología nueva; ambos aprobaron leyes que obligaron a usarla.',
    ],
    stats: [
      { label: 'Horas promedio por trámite en América Latina', value: '5,4 h', source: 'BID, «El fin del trámite eterno» (2018)' },
      { label: 'Trámites en la región que requieren más de una visita', value: '≈ 1 de cada 4', source: 'BID (2018)' },
      { label: 'Costo de un trámite presencial frente a uno en línea', value: 'hasta 40× más', source: 'BID (2018), estimación regional' },
      { label: 'Tiempo de trabajo que X-Road ahorra a Estonia cada año', value: '> 1 300 años', source: 'RIA / e-Estonia (cifra oficial vigente)' },
    ],
  },
  foundations: {
    title: 'Costa Rica no parte de cero',
    intro: 'Estas piezas ya existen y tienen respaldo legal. El demo las simula tal cual; lo nuevo es el bus que las conecta y la obligación de usarlo.',
    items: [
      { name: 'Cédula del TSE y firma digital (Ley 8454, 2005)', what: 'Identidad y firma con plena validez legal. Pase Digital la lleva al teléfono.', status: 'hoy' },
      { name: 'Ley 8220 art. 2 (2002)', what: 'Ya prohíbe pedir lo que el Estado tiene. Es el «una sola vez» costarricense, sin plataforma ni sanción efectiva.', status: 'parcial' },
      { name: 'SICOP obligatorio (Ley 9986, 2021)', what: 'Prueba de que el país sabe imponer una plataforma única por ley, incluso a municipalidades y autónomas.', status: 'hoy' },
      { name: 'APC del CFIA (Decreto 36550, 2011)', what: 'Ventanilla única de planos con Salud, Bomberos, AyA e INVU. La mejor prueba local de que funciona.', status: 'hoy' },
      { name: 'TRIBU-CR, Oficina Virtual CCSS, Crear Empresa, EDUS', what: 'Cada institución ya tiene su sistema en línea. Ninguno le pregunta al otro.', status: 'parcial' },
      { name: 'Ley 8968 de datos personales (2011)', what: 'Consentimiento y finalidad. Compatible con un bus auditado; falta el derecho a ver quién consultó mis datos.', status: 'parcial' },
      { name: 'Plataforma nacional de interoperabilidad', what: 'No existe con carácter obligatorio. Es la pieza central que falta.', status: 'ley' },
      { name: 'Autoridad de gobierno digital con presupuesto', what: 'MICITT coordina, pero no decide qué sistema compra cada institución.', status: 'ley' },
    ],
  },
  roadmap: {
    title: 'La secuencia: integrar, rediseñar, medir, y solo entonces repartir el ahorro',
    intro: 'Primero se construye la columna vertebral y se rediseñan los procesos. Los ahorros se miden con auditoría. Una parte, por ley, vuelve a la gente.',
    steps: [
      {
        n: 1,
        title: 'Columna vertebral: identidad e interoperabilidad',
        summary: 'Una identidad digital nacional que todos deban aceptar y un bus de intercambio obligatorio que conecte los registros base.',
        actions: [
          'Cédula del TSE + firma digital como identidad universal de personas y empresas; mandato legal de aceptarla.',
          'Bus nacional tipo X-Road conectando Registro Civil, Registro Nacional, Tributación, CCSS, EDUS, permisos municipales, educación y registros judiciales.',
          'Principio «una sola vez» con sanción: prohibido pedir lo que el Estado ya tiene.',
        ],
        lawNeeded: 'Ley de interoperabilidad y registros base (modelo: capítulo de bases de datos de la ley estonia; Lei 14.129 de Brasil).',
      },
      {
        n: 2,
        title: 'Una sola puerta: Pase Digital por eventos de vida',
        summary: 'En vez de veinte sitios de ministerios, un portal organizado por lo que le pasa a la gente.',
        actions: [
          '«Quiero abrir un negocio», «tuve un hijo», «voy a construir», «me mudé», «perdí el empleo», «me jubilo».',
          'Ganancias rápidas: negocio en 1–3 días integrando Registro Nacional, Hacienda, CCSS, municipalidad, INS y Salud; permisos de construcción con APC y las 84 municipalidades; padrón único de beneficiarios sociales; declaraciones de IVA y renta prellenadas con la factura electrónica.',
        ],
      },
      {
        n: 3,
        title: 'Servicios compartidos y nube de gobierno',
        summary: 'Dejar de comprar 300 veces el mismo sistema de planillas, contabilidad y correo.',
        actions: [
          'Planilla y recursos humanos compartidos para el Gobierno Central; contabilidad y tesorería únicas bajo Hacienda.',
          'Nube híbrida de gobierno; automatización de tareas repetitivas de trastienda; validación automática de solicitudes contra registros.',
        ],
        lawNeeded: 'Mandato de servicios compartidos y sanción a la duplicación de sistemas.',
      },
      {
        n: 4,
        title: 'Compras públicas: donde más se ahorra',
        summary: 'SICOP ya es obligatorio; falta explotarlo.',
        actions: [
          'Catálogo electrónico y convenios marco como opción por defecto para bienes comunes.',
          'Analítica de precios entre instituciones, detección de anomalías, contratos y adendas en datos abiertos, pago automático de facturas verificadas.',
        ],
      },
      {
        n: 5,
        title: 'Gobernanza: una autoridad con poder real',
        summary: 'Sin quien decida, cada ministerio compra lo suyo.',
        actions: [
          'Oficina de Gobierno Digital bajo Presidencia, MIDEPLAN o MICITT con poder sobre presupuestos de TI.',
          'Todo proyecto grande de TI debe mostrar rediseño de proceso, ahorro esperado, integración al bus e indicadores medibles.',
        ],
        lawNeeded: 'Ley de Eficiencia Digital: interoperabilidad obligatoria, «una sola vez», digital primero (no digital único), servicios compartidos, estándares abiertos, ciberseguridad y protección de datos.',
      },
      {
        n: 6,
        title: 'Municipalidades e instituciones autónomas',
        summary: 'Ahí está buena parte del gasto y casi toda la frustración ciudadana.',
        actions: [
          'Obligación de usar la identidad nacional, el bus y SICOP (como ya lo hace la Ley 9986).',
          'Plataforma municipal compartida para los cantones que no pueden pagar sistemas propios; permisos, licencias y tasas en línea; finanzas municipales abiertas.',
        ],
        lawNeeded: 'Reforma al Código Municipal y a las leyes de patentes.',
      },
      {
        n: 7,
        title: 'Financiar la transición con ahorros y banca de desarrollo',
        summary: 'No hacen falta impuestos nuevos para empezar.',
        actions: [
          'Préstamos de BID, Banco Mundial o CAF diseñados para gobierno digital; fondo de transformación digital alimentado por una parte de los ahorros futuros.',
          'Cada institución presenta un caso de negocio con retorno; inversión escalonada en 5–10 años.',
        ],
      },
      {
        n: 8,
        title: 'Del ahorro al alivio: el dividendo digital',
        summary: 'Solo cuando el ahorro esté verificado, y por una regla escrita en la ley.',
        actions: [
          'Medición independiente (Contraloría) de costo por trámite antes y después.',
          'Regla de reparto automática del ahorro verificado: deuda, reinversión, alivio tributario e inclusión digital.',
        ],
        lawNeeded: 'Regla del dividendo digital en la Ley de Eficiencia Digital o en la ley de presupuesto.',
      },
    ],
  },
  dividend: {
    title: 'La regla del dividendo digital',
    intro:
      'Costa Rica tiene deuda alta y presión fiscal. La automatización baja el costo por trámite, pero los ahorros aparecen poco a poco. Prometer una rebaja de impuestos antes de medirlos sería irresponsable; no repartirlos nunca sería injusto. La respuesta es una regla, escrita en la ley, que reparte solo el ahorro verificado.',
    rule: [
      { share: 40, destination: 'Reducción de deuda y estabilidad fiscal' },
      { share: 30, destination: 'Reinversión en servicios digitales y ciberseguridad' },
      { share: 20, destination: 'Alivio tributario directo o evitar aumentos futuros' },
      { share: 10, destination: 'Inclusión digital: conectividad, formación, canales asistidos' },
    ],
    caveats: [
      'Los mejores alivios para después: bajar cargas patronales para formalizar empleo, simplificar el IVA a las pequeñas empresas, reducir tasas municipales cuando las municipalidades sean más eficientes.',
      'Evitar rebajas amplias del impuesto sobre la renta hasta que la deuda esté claramente bajo control.',
      'Digital primero, nunca digital único: teléfono, presencial y canal asistido para personas mayores, rurales o sin conectividad.',
    ],
  },
  evidence: {
    title: 'Lo que dice la evidencia',
    items: [
      { claim: 'Estonia estima que X-Road ahorra más de 1 300 años de tiempo de trabajo al año y el gobierno digital, alrededor del 2 % del PIB.', source: 'RIA / e-Estonia; la cifra del 2 % es una estimación gubernamental con supuestos generosos', url: 'https://x-road.global' },
      { claim: 'La compra pública electrónica suele ahorrar entre 5 % y 15 % del gasto en compras (KONEPS en Corea, Prozorro en Ucrania, estudios de la OCDE).', source: 'OCDE; Banco Mundial' },
      { claim: 'El sistema europeo «solo una vez» (OOTS) se justificó con ahorros estimados de unos 5 000 millones de euros al año para ciudadanos y empresas.', source: 'Comisión Europea, evaluación de impacto del Reglamento 2018/1724', url: 'https://eur-lex.europa.eu/eli/reg/2018/1724/oj' },
      { claim: 'En América Latina un trámite toma 5,4 horas en promedio, uno de cada cuatro exige más de una visita y hacerlo en línea cuesta hasta 40 veces menos que en ventanilla.', source: 'BID, «El fin del trámite eterno» (2018)', url: 'https://publications.iadb.org/es/el-fin-del-tramite-eterno-ciudadanos-burocracia-y-gobierno-digital' },
      { claim: 'La experiencia internacional apunta a reducciones de 15 % a 30 % del costo administrativo en los procesos que la digitalización toca de verdad.', source: 'OCDE, Digital Government Index; McKinsey Center for Government (síntesis)' },
      { claim: 'Para Costa Rica, una meta creíble a 5–10 años es un ahorro de 0,5 % a 1,5 % del PIB al año; solo compras públicas podrían aportar 0,3 % a 0,7 %.', source: 'Estimación propia a partir de las cifras anteriores; ver docs/CASE.md' },
    ],
  },
  calculator: {
    title: '¿Cuánto es eso en colones?',
    intro: 'Mueva el porcentaje de ahorro sobre el PIB y vea cómo se repartiría con la regla del dividendo. PIB de Costa Rica ≈ ₡50 billones al año (aprox., 2025).',
    gdpCrcBillions: 50,
    defaultSavingsPct: 0.5,
    minPct: 0.1,
    maxPct: 1.5,
  },
  asks: {
    title: 'Lo que pedimos',
    items: [
      'A la Asamblea Legislativa: una Ley de Eficiencia Digital con interoperabilidad obligatoria, «una sola vez» con sanción, identidad digital que todos deban aceptar y una regla de dividendo digital.',
      'Al Poder Ejecutivo: un decreto que designe los registros base (TSE, Registro Nacional, Hacienda, CCSS) y una autoridad de gobierno digital con poder sobre el gasto en TI.',
      'A las instituciones autónomas y municipalidades: conectarse al bus como ya se conectaron a SICOP.',
      'A la ciudadanía: exigir que se cumpla la Ley 8220. Cada vez que le pidan una copia de la cédula, el Estado está incumpliendo una ley de 2002.',
    ],
  },
};
