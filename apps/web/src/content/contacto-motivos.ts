import { CONTACTO } from './contacto';

/**
 * The reasons someone might write, and the message each one composes.
 *
 * Why this is not a form. The site stores nothing — no persistence, no analytics (CLAUDE.md) — and
 * `dist-static` has no backend at all, so anything that accepted a submission would need a third party
 * standing between a reader and their own words. `mailto:` keeps the message in the reader's hands until
 * they send it. The cost is real and worth stating: it opens their mail client and reveals their address.
 * That is the trade, and it is the reason there is no "anonymous" option here pretending otherwise.
 *
 * **The prompts are the product.** "Send feedback" returns nothing usable; three concrete questions return
 * something you can act on. Each motivo asks the questions that make its kind of message worth having, and
 * each ends by inviting the reader to delete the scaffolding — what happened to them beats a filled form.
 *
 * **The subject prefix is what makes a mailbox tractable.** `[relato]`, `[comentario]`, `[ayuda]`,
 * `[institución]` sort in any mail client, so a hundred messages can be triaged without opening them.
 *
 * On tone, and this is a rule rather than a preference: `content/author.ts` records that this project asks
 * for **correction, not support**. Nothing here may read as recruitment — no «campaña», «movimiento»,
 * «únase», «firme aquí», no party, diputado or candidate. People are invited to tell the author something
 * he does not know, or to help build the thing. They are never invited to join anything.
 *
 * Keep each `cuerpo` short. A `mailto:` body is a URL, and several mail clients truncate somewhere around
 * two thousand characters — a prompt list that gets long starts silently losing its own last question.
 */
export interface Motivo {
  id: string;
  /** The reader's own words for why they are writing, as a heading they can recognise themselves in. */
  titulo: string;
  en: string;
  /** One line that says who this is for, so nobody picks the wrong one. */
  para: string;
  /** Sorts the mailbox. Keep short and in brackets. */
  etiqueta: string;
  preguntas: string[];
}

export const MOTIVOS: Motivo[] = [
  {
    id: 'relato',
    titulo: 'Me pidieron algo que el Estado ya tenía',
    en: 'An institution asked me for something the State already held',
    para: 'Si le pasó a usted. Es la evidencia que le falta a este sitio: los ejemplos aquí son inventados.',
    etiqueta: '[relato]',
    preguntas: [
      '¿Qué trámite estaba haciendo?',
      '¿Qué institución se lo pidió, y cuál ya tenía ese dato?',
      '¿Cuándo fue, y en qué cantón?',
      '¿Cuánto tiempo o cuántas visitas le costó?',
    ],
  },
  {
    id: 'comentario',
    titulo: 'Creo que algo aquí está mal',
    en: 'I think something here is wrong',
    para: 'Un dato equivocado, una ley mal citada, un argumento que no se sostiene. Se corrige y se dice de dónde salió la corrección.',
    etiqueta: '[comentario]',
    preguntas: [
      '¿Qué página y qué afirmación?',
      '¿Qué está mal, y qué dice la fuente que usted conoce?',
      '¿Tiene el enlace o el documento?',
    ],
  },
  {
    id: 'ayuda',
    titulo: 'Puedo aportar algo',
    en: 'I can contribute something',
    para: 'Código, diseño, criterio legal, experiencia dentro de una institución. Sin compromiso ni lista de nada.',
    etiqueta: '[ayuda]',
    preguntas: [
      '¿Qué sabe hacer que le sirva a esto?',
      '¿Hay algo concreto que ya le gustaría arreglar?',
      '¿Prefiere que le escriba antes de que se meta en algo?',
    ],
  },
  {
    id: 'institucion',
    titulo: 'Escribo desde una institución o desde un medio',
    en: 'I am writing from an institution or from the press',
    para: 'Para preguntas sobre el demo, sus fuentes o su licencia, y para corregir lo que diga sobre su institución.',
    etiqueta: '[institución]',
    preguntas: [
      '¿Desde dónde escribe, y qué necesita?',
      '¿Hay algo en el sitio que describa mal a su institución?',
      '¿Necesita el código, las fuentes o los términos de uso?',
    ],
  },
];

const CIERRE = '— Borre todo esto y escriba como quiera; lo que sirve es lo que a usted le pasó.';

/**
 * The `mailto:` for one motivo. `pagina` is included when the reader wrote from a specific page, because
 * "esta tabla no se entiende" is unanswerable without knowing which table.
 */
export function enlaceDe(m: Motivo, pagina?: string): string {
  const asunto = `${m.etiqueta} PuraVidaGov${pagina ? ` — ${pagina}` : ''}`;
  const cuerpo = [
    ...(pagina ? [`Página: ${pagina}`, ''] : []),
    ...m.preguntas.flatMap((p) => [p, '', '']),
    CIERRE,
  ].join('\n');
  return `mailto:${CONTACTO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
