import { useLocation } from 'react-router-dom';
import { CONTACTO } from '../content/contacto';

/**
 * The feedback link, in the footer of every page.
 *
 * Why `mailto:` and not a form. It stores nothing, which is the only option that cannot conflict with the
 * project's "no persistence, no analytics" rule; it needs no third party; and it behaves identically in the SPA
 * and in `dist-static`, which has no backend at all. The cost is that it opens the reader's mail client and
 * reveals their address — acceptable for a handful of early users, and revisit it if this ever goes wide.
 *
 * **The prompts in the body are the point.** "Send feedback" gets nothing back; three concrete questions get
 * something usable. The first real reader found the site overwhelming and had no way to say so, which is what
 * this exists to fix — so the wording asks about confusion first and invites them to delete the scaffolding.
 *
 * Do not offer this link if `CONTACTO` is ever not a live mailbox. `denuncia.cr` documents the trap in
 * `src/components/Redactor.astro`: a `mailto:` to an unverified address opens the mail program onto nothing and
 * the reader concludes the site is broken. Delivery is a Cloudflare Email Routing rule — see `docs/DEPLOY.md`.
 */
export function Feedback() {
  const { pathname } = useLocation();

  const asunto = `PuraVidaGov — ${pathname}`;
  const cuerpo = [
    `Página: ${pathname}`,
    '',
    '¿Qué estaba tratando de hacer?',
    '',
    '',
    '¿Qué le resultó confuso o de más?',
    '',
    '',
    '¿Qué esperaba que pasara?',
    '',
    '',
    '— Borre todo esto y escriba como quiera; lo que sirve es lo que a usted le pasó.',
  ].join('\n');

  return (
    <a
      className="underline decoration-slate-300 underline-offset-2 hover:text-primary-700"
      href={`mailto:${CONTACTO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`}
    >
      ¿Algo confuso o de más en esta página? Escríbame
    </a>
  );
}
