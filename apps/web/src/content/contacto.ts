/**
 * The one published address. Kept in its own module because it appears on more than one page and an
 * address that differs between pages is worse than no address.
 *
 * It must resolve before it ships: a published contact address that bounces costs more credibility than
 * having none. Delivery is a Cloudflare Email Routing rule on sindarvueltas.org forwarding to the author's
 * inbox — see docs/DEPLOY.md, "Correo de contacto".
 */
export const CONTACTO = 'contact@sindarvueltas.org';
