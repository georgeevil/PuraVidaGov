import { Link } from 'react-router-dom';
import { ColdStartNote, NO_PORTAL, PortalLink, PortalUnavailable } from '../components/Portal';
import { LANDING } from '../content/landing';

/**
 * `/` for anonymous visitors. Deliberately almost empty — see `content/landing.ts` for why, and for the
 * word budget that keeps it that way. Signed-in visitors get the Dashboard at this same path.
 *
 * The demo button is the only thing competing for attention, and it is above the fold on a phone. The
 * DEMO banner and the footer come from Layout, so nothing about the disclaimer is weakened by this page
 * being short.
 *
 * The button MUST go through `PortalLink`, not a plain `<Link to="/login">`. sindarvueltas.org serves the
 * static build, which has no backend: a bare in-app link would be a dead demo button on the one page a
 * first-time visitor actually sees. `PortalLink` sends them to VITE_PORTAL_URL instead, and where no portal
 * is configured `NO_PORTAL` replaces the button with a line of copy rather than a link that goes nowhere.
 */
export function Landing() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{LANDING.title}</h1>

      <div className="mt-6 space-y-3">
        {LANDING.lines.map((l, i) => (
          <p key={i} className="text-lg leading-relaxed text-slate-700">
            {l}
          </p>
        ))}
      </div>

      <div className="mt-10">
        {NO_PORTAL ? (
          <PortalUnavailable />
        ) : (
          <>
            <PortalLink
              path={LANDING.primary.to}
              title="Try the demo"
              className="inline-block rounded-lg bg-primary-700 px-6 py-3 text-lg font-semibold text-white hover:bg-primary-800"
            >
              {LANDING.primary.label}
            </PortalLink>
            <ColdStartNote className="mt-3" />
          </>
        )}
      </div>

      <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
        <Link to={LANDING.secondary.to} className="font-medium text-primary-700 underline">
          {LANDING.secondary.label}
        </Link>
        <span className="block text-slate-500">{LANDING.secondary.nota}</span>
      </p>
    </div>
  );
}
