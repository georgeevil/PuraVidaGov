/**
 * Content for /quien-lo-hace — who built this and why, and the disclaimers that go with it.
 *
 * The wording follows `docs/research/foreigner-advocacy-cr.md` §6. The governing principle from that
 * research: **contributing to a public debate is protected; seeking to exercise or allocate political power
 * is not.** So this page presents a technical author publishing work, never a campaign — it states the
 * author's foreign residency openly (transparency is protective, discovered concealment is not), describes
 * the draft law as an illustrative artefact rather than a demand, and asks for correction rather than
 * support. Do not add: "campaña", "movimiento", "únase", "firme aquí", donations, or the name of any party,
 * diputado or candidate.
 */
export interface AuthorContent {
  title: string;
  lead: string;
  disclaimer: string;
  sections: { heading: string; paragraphs: string[] }[];
  facts: { label: string; value: string }[];
  invite: { heading: string; body: string; links: { label: string; href: string; note?: string }[] };
}

export const AUTHOR: AuthorContent = {
  title: 'Quién lo hace, y por qué',
  lead:
    'PuraVidaGov es una demostración técnica: software que funciona, publicado con su código y con la investigación que lo sustenta, para hacer concreta una discusión que normalmente ocurre en abstracto.',
  disclaimer:
    'Trabajo técnico independiente. Sin afiliación a ningún partido, campaña, candidatura ni institución pública. Los datos del demo son ficticios y no se usa ningún dato personal real.',
  sections: [
    {
      heading: 'Qué es esto',
      paragraphs: [
        'Un portal ciudadano con doce eventos de vida —abrir un negocio, tener un hijo, construir, mudarse, perder el empleo, jubilarse, renovar la licencia, enviudar, comprar un carro o una casa, casarse, matricular a un hijo— que se resuelven pasando por un bus de interoperabilidad al estilo de X-Road, contra trece instituciones simuladas.',
        'Cada paso lleva una etiqueta que dice si eso se puede hacer hoy en Costa Rica, si se puede a medias, o si haría falta una norma; y cada etiqueta remite a la ley, el decreto o la resolución en que se apoya. Esa parte es la que más trabajo costó y es la que se ofrece a discusión.',
        'Nada de esto está conectado a ninguna institución del Estado. Ninguna institución ha revisado ni respaldado este trabajo.',
      ],
    },
    {
      heading: 'Quién lo escribió',
      paragraphs: [
        'George Chigrichenko, arquitecto de software y residente extranjero en Costa Rica. Lo digo desde el principio porque es relevante: quien propone algo sobre lo público debería decir desde dónde lo propone.',
        'Vivo aquí, hago los mismos trámites que describe este demo, y los hice suficientes veces como para querer entender por qué son así. La respuesta resultó no ser tecnológica: casi todas las piezas ya existen y son digitales por separado. Lo que falta es la capa que las obliga a hablarse, y esa es una decisión de norma, no de software.',
      ],
    },
    {
      heading: 'Cómo está hecho, y qué se puede comprobar',
      paragraphs: [
        'El código es público y el demo se ejecuta: cualquiera puede levantarlo, recorrer los doce trámites y ver el registro de auditoría que produce cada consulta entre instituciones. El registro guarda el nombre de los campos que se devolvieron, nunca su contenido: eso también es parte del argumento.',
        'La investigación legal está en el repositorio con la fuente de cada afirmación, y lo que no se pudo verificar está marcado como no verificado. Hay cifras que corregí después de leer el documento original en vez de la nota de prensa, y ese cambio queda en el historial. Prefiero que se pueda auditar el argumento a que suene mejor.',
      ],
    },
    {
      heading: 'Sobre la ley que aparece en el demo',
      paragraphs: [
        'El sitio incluye un boceto de qué tendría que decir una norma para que estos trámites funcionaran de verdad. Es un artefacto ilustrativo, no una propuesta que yo esté impulsando: sirve para que la discusión sea sobre algo concreto y no sobre una idea general de «modernizar el Estado».',
        'Quien tenga que decidir sobre esto son las instituciones y las personas costarricenses. Mi aporte llega hasta acá: mostrar que es técnicamente posible, y decir con qué base legal cada pieza lo es o no lo es hoy.',
      ],
    },
  ],
  facts: [
    { label: 'Naturaleza', value: 'Demostración técnica con código abierto y datos ficticios' },
    { label: 'Eventos de vida', value: '12, sobre 13 instituciones simuladas' },
    { label: 'Autor', value: 'George Chigrichenko, arquitecto de software, residente en Costa Rica' },
    { label: 'Afiliación', value: 'Ninguna. Ni partido, ni campaña, ni institución' },
    { label: 'Financiamiento', value: 'Ninguno. No se reciben ni se solicitan donaciones' },
    { label: 'Datos', value: 'Ficticios. Ningún dato personal real, sin persistencia ni analítica' },
  ],
  invite: {
    heading: 'Corrección bienvenida',
    body:
      'Lo más útil que puede pasarle a este trabajo es que alguien que conozca el derecho costarricense o el funcionamiento real de una de estas instituciones señale dónde está equivocado. Si encuentra un error en una cita, en una fecha o en el estado de un trámite, dígalo: la investigación está sujeta a corrección y el historial de cambios queda público.',
    links: [
      { label: 'Código e investigación en GitHub', href: 'https://github.com/georgeevil/PuraVidaGov' },
      {
        label: 'Reportar un error o una imprecisión',
        href: 'https://github.com/georgeevil/PuraVidaGov/issues/new',
        note: 'Especialmente si es una cita legal',
      },
    ],
  },
};
