/**
 * Content for `/` as an anonymous visitor sees it.
 *
 * This page exists because the first reader outside the project opened the site and found it overwhelming.
 * Until then `/por-que` was the landing page: ~2,300 words across eight sections, with the "Probar el demo"
 * button roughly 180 lines down. She got an essay; the demo that actually makes the argument sat behind a
 * login she never reached.
 *
 * **Hard budget: this page stays under ~100 words of visible copy.** That is the whole point of it, and it is
 * the thing that will erode first. If you are about to add a paragraph here, it belongs on `/por-que` — which
 * is unchanged, complete, and one click away. Nothing was deleted to make this page; the argument simply
 * stopped being the front door.
 *
 * The claim is deliberately concrete and in the second person — what happens to a person at a ventanilla —
 * rather than the institutional framing the case page opens with. Someone who has never heard the words
 * "interoperabilidad" or "once-only" should understand the first sentence.
 *
 * Posture rules from the author page apply here too, and matter more because this is the most-read page:
 * no *campaña*, *movimiento*, *únase*, *firme*; no party, diputado or candidate; no electoral reference.
 */
export interface LandingContent {
  title: string;
  lines: string[];
  primary: { label: string; to: string };
  secondary: { label: string; to: string; nota: string };
}

export const LANDING: LandingContent = {
  title: 'El Estado ya tiene sus datos. Usted no debería andar cargándolos.',
  lines: [
    'Abrir un negocio, inscribir a un hijo o jubilarse significa hoy repetir los mismos datos en cuatro o cinco instituciones que ya los tienen.',
    'Este demo muestra cómo se vería si no fuera así: doce trámites, trece instituciones, sin pedirle dos veces lo mismo.',
  ],
  primary: { label: 'Probar el demo', to: '/login' },
  secondary: {
    label: 'Leer el argumento completo',
    to: '/por-que',
    nota: 'Por qué pasa esto, qué se puede hacer hoy y qué ley faltaría. Unos diez minutos de lectura.',
  },
};
