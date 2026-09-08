/**
 * Content for /seguimiento — where the once-only reform actually stands, who would have to move, and
 * what a resident can already do on their own.
 *
 * Sourcing: every institutional claim traces to `docs/research/institutions-and-accountability.md`,
 * which carries the evidence tags and the URLs. Do not add a status, an article number or a date here
 * without adding it there first — this page is the most quotable thing on the site and the least
 * forgiving of a wrong article number.
 *
 * Posture. This page describes **rights that already exist and institutions that already have duties**.
 * It is information, not mobilisation: the reader acts, the site does not organise. So the verbs are
 * "puede", "la ley le reconoce", "es gratuito" — never "exija", "únase", "firme", "escríbale a". Do not
 * name a party, a diputado, a candidate or an election, and do not add a call to action. The distinction
 * is the same one the author page rests on: contributing to a public debate is protected; seeking to
 * exercise or allocate political power is not.
 *
 * The honesty rule that makes the rest credible: where something could not be verified, this page says
 * so on the page. `pendiente` below is not a placeholder to be tidied away — it is the content.
 */
export interface SeguimientoContent {
  title: string;
  lead: string;
  disclaimer: string;
  estado: { heading: string; paragraphs: string[] };
  actores: {
    heading: string;
    intro: string;
    filas: { quien: string; base: string; deber: string; donde: string }[];
  };
  derechos: {
    heading: string;
    intro: string;
    filas: { via: string; base: string; sirve: string }[];
    precedente: { heading: string; paragraphs: string[] };
  };
  pendiente: { heading: string; paragraphs: string[] };
  seguir: { heading: string; paragraphs: string[]; contactoNota: string };
}

export const SEGUIMIENTO: SeguimientoContent = {
  title: 'Dónde está esto, y qué puede hacer usted',
  lead:
    'El demo muestra cómo se vería un Estado que no le pide dos veces lo mismo. Esta página es lo otro: en qué punto está eso en la realidad, quién tendría que moverse para que ocurra, y qué puede hacer hoy una persona que vive aquí, sola y sin permiso de nadie.',
  disclaimer:
    'Esto es información pública ordenada, no asesoría legal. Cada dato remite a la investigación del repositorio, con su fuente. Lo que no se pudo comprobar aparece marcado como no comprobado, aquí mismo.',

  estado: {
    heading: 'En qué punto está',
    paragraphs: [
      'La regla ya existe y no se cumple. La Ley 8220 prohíbe desde 2002 pedirle a una persona un documento que otra institución del Estado ya tiene. Lo que la ley no hace es crear el canal por el que las instituciones podrían pasárselo: no establece fondo, ni plataforma, ni estándar técnico, y su única vía de sanción es disciplinaria. La obligación existe; el mecanismo para cumplirla, no.',
      'Lo que sí avanza es un proyecto, no una norma. En marzo de 2026 el MICITT y la Agencia Nacional de Gobierno Digital lanzaron «Conecta», financiado por Luxemburgo y ejecutado con LuxDev, para adoptar un modelo de interoperabilidad con X-Road; la Agencia coordina a treinta instituciones y en junio de 2026 se reportó la primera demostración funcional en el sector salud.',
      'La diferencia entre esas dos cosas es todo el asunto. La Ley 9943 obliga a las instituciones a presentar planes de trabajo, no a conectarse a una plataforma nacional. Una institución que sencillamente no participe no está incumpliendo ninguna ley. Por eso el paso que falta es normativo y no técnico: ya existe un precedente costarricense de una ley que vuelve obligatoria una plataforma única para todo el sector público bajo pena de nulidad — la Ley 9986, de compras públicas. Una regla de «una sola vez» podría redactarse casi igual.',
    ],
  },

  actores: {
    heading: 'Quién tendría que moverse',
    intro:
      'Cada institución de la lista ya opera un sistema digital que funciona, por separado. El problema no es que no existan: es que nada las obliga a hablarse.',
    filas: [
      {
        quien: 'MICITT — Dirección de Gobernanza Digital',
        base: 'Rectoría de gobierno digital',
        deber: 'Fijar política, estándares y el modelo nacional de interoperabilidad',
        donde: 'Publicó el modelo como informe técnico (MICITT-DGDCFD-INF-014-2025). Es un informe, no una norma.',
      },
      {
        quien: 'ANGD — Agencia Nacional de Gobierno Digital',
        base: 'Ley 9943 (2021)',
        deber: 'Ejecutar los proyectos de gobierno digital de la Administración',
        donde: 'Creada por ley en 2021; reglamentada apenas en 2024 y en operación formal desde setiembre de 2025. Coordina «Conecta» con treinta instituciones.',
      },
      {
        quien: 'MEIC — Dirección de Mejora Regulatoria',
        base: 'Ley 8220, arts. 11 y 13',
        deber: 'Impedir que una institución pida lo que el Estado ya tiene, y llevar el Catálogo Nacional de Trámites',
        donde: 'Es la vía por la que hoy se reclama, y donde un criterio suyo es vinculante para la institución.',
      },
      {
        quien: 'Asamblea Legislativa',
        base: '—',
        deber: 'Aprobar la norma que obligue al intercambio y ordene el registro de auditoría',
        donde: 'No existe ley que cree ese deber. Si hay algún proyecto presentado, no se pudo comprobar — ver abajo.',
      },
      {
        quien: 'Instituciones con sistema propio',
        base: 'Cada una su ley',
        deber: 'Conectarse, cuando exista la obligación de hacerlo',
        donde: 'TSE, Hacienda, CCSS, Salud, Registro Nacional, INS, CFIA, MEP y 82 municipalidades, cada una con su propia ley de patentes.',
      },
    ],
  },

  derechos: {
    heading: 'Lo que usted ya puede hacer, hoy y solo',
    intro:
      'Nada de esto necesita una organización, una firma colectiva ni el permiso de nadie. Son derechos individuales que la Constitución le reconoce a toda persona habitante del país, no solo a la ciudadanía: los artículos que siguen dicen «todos», «nadie» y «los habitantes». Todos los trámites de esta lista son gratuitos.',
    filas: [
      {
        via: 'Derecho de petición',
        base: 'Constitución, art. 27',
        sirve: 'Preguntarle por escrito a cualquier funcionario o entidad, y tener derecho a una pronta resolución. La respuesta —o el silencio— es la prueba de todo lo demás.',
      },
      {
        via: 'Acceso a información de interés público',
        base: 'Constitución, art. 30',
        sirve: 'Pedir documentos, planes, plazos y presupuestos. Incluye el plan de trabajo de interoperabilidad que la Ley 9943 le exige a cada institución.',
      },
      {
        via: 'Reclamo por exceso de trámites',
        base: 'Ley 8220, arts. 2 y 7',
        sirve: 'Cuando le piden algo que el Estado ya tiene. Ante Mejora Regulatoria del MEIC, cuyo criterio es vinculante. El art. 7 permite además invocar silencio positivo por documento electrónico con firma digital.',
      },
      {
        via: 'Contraloría de servicios de la institución',
        base: 'Sistema Nacional de Contralorías de Servicios',
        sirve: 'La vía interna, y casi siempre la más rápida. Toda institución debe tener una.',
      },
      {
        via: 'Recurso de amparo',
        base: 'Constitución, art. 48',
        sirve: 'El instrumento más fuerte que hay, y el menos usado por desconocimiento: no necesita abogado, no cuesta, no tiene formulario y se presenta a cualquier hora ante la Sala Constitucional. Sirve contra la inacción de la Administración.',
      },
      {
        via: 'Defensoría de los Habitantes',
        base: '—',
        sirve: 'Investiga la inacción institucional y publica lo que encuentra.',
      },
      {
        via: 'Denuncia ante la Contraloría General',
        base: '—',
        sirve: 'Sobre el uso de los recursos públicos de una institución.',
      },
    ],
    precedente: {
      heading: 'Que esto funciona no es teoría',
      paragraphs: [
        'La Agencia Nacional de Gobierno Digital tiene reglamento porque la Sala Constitucional lo ordenó. La ley que la creó es de 2021 y pasó tres años sin reglamentar; de esa orden salió el decreto de 2024, y la Agencia entró en operación formal en setiembre de 2025.',
        'Es decir: en este mismo expediente, un recurso gratuito, sin abogado y sin formulario ya movió al Estado una vez. Esa es la respuesta concreta a qué se puede hacer cuando una institución no actúa.',
      ],
    },
  },

  pendiente: {
    heading: 'Lo que no se pudo comprobar',
    paragraphs: [
      'Si hay hoy un proyecto de ley presentado que cree el deber de «una sola vez», y en qué comisión está, no se ha podido verificar. El sitio de la Asamblea Legislativa no responde desde los servidores donde corren estas comprobaciones —no abre la conexión— aunque sí responde con normalidad desde una conexión doméstica. Es una limitación de dónde se hace la consulta, no una señal de que el sitio esté caído.',
      'Se dice aquí en vez de omitirlo porque la ausencia de una fuente que uno no puede alcanzar no es prueba de que la cosa no exista. Esa comprobación se hace a mano y esta página se actualiza cuando se haga.',
    ],
  },

  seguir: {
    heading: 'Cómo se le da seguimiento',
    paragraphs: [
      'Una revisión automática recorre a diario las fuentes que sí se pueden alcanzar —MICITT, la página de la Agencia, la Contraloría y el índice legislativo de Delfino— y avisa cuando alguna cambia. Lo que detecta es que una página cambió, nada más: sirve para ir a mirar, no para afirmar qué hizo la institución. Lo que se confirme se anota con su fuente en la investigación del repositorio antes de aparecer acá.',
      'Las dos fuentes que no se pueden alcanzar desde ahí quedan marcadas como revisión manual, en vez de fingir que se revisan.',
    ],
    contactoNota:
      'Si usted presentó una gestión con alguna de estas vías y le sirvió —o le respondieron algo que aquí no dice—, eso es lo más útil que puede mandar. También si encuentra un error en una cita, una fecha o el estado de un trámite.',
  },
};
