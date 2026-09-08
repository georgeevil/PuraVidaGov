import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IS_STATIC, PORTAL_URL } from '../api';
import { Tip } from './Tip';

/**
 * Static deployment helpers (docs/CONTRACTS.md v4 → "Static mode in apps/web"). In the default build every
 * "Probar el demo" affordance is an in-app link to /login. In the static build there is no backend here:
 * the link points at the interactive deployment (VITE_PORTAL_URL) in a new tab, and when that URL is not
 * configured the affordance is replaced by one line of copy — never a dead link.
 */

export const PORTAL_UNAVAILABLE_TEXT = 'El portal interactivo no está desplegado en esta versión estática.';

/** True when the build is static and no interactive deployment was configured. */
export const NO_PORTAL = IS_STATIC && !PORTAL_URL;

export function PortalUnavailable({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm text-slate-500 ${className}`} title="The interactive portal is not deployed in this static build">
      {PORTAL_UNAVAILABLE_TEXT}
    </p>
  );
}

/**
 * "Probar el demo" and every other login affordance. `path` is the in-app route (default /login), appended to
 * PORTAL_URL in static mode. Renders `null` when static with no portal configured — callers that need a
 * replacement line render <PortalUnavailable /> themselves (see NO_PORTAL).
 */
export function PortalLink({
  children,
  className,
  title,
  path = '/login',
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  path?: string;
}) {
  if (!IS_STATIC) {
    return (
      <Link to={path} className={className} title={title}>
        {children}
      </Link>
    );
  }
  if (!PORTAL_URL) return null;
  return (
    <a href={`${PORTAL_URL}${path}`} target="_blank" rel="noopener" className={className} title={title}>
      {children}
    </a>
  );
}

/** The single card shown on /login and on the guarded routes when the build is static. */
export function PortalOnlyCard() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">
          El portal interactivo corre en otro lado
          <Tip en="The interactive portal runs elsewhere — this is the static build" />
        </h1>
        <p className="text-sm text-slate-700">
          Esta publicación es la <strong>versión estática</strong> de PuraVidaGov: incluye el argumento, el marco legal y
          la arquitectura, pero no el backend. Los trámites, la sesión y la auditoría necesitan el despliegue completo.
        </p>
        {PORTAL_URL ? (
          <a href={`${PORTAL_URL}/login`} target="_blank" rel="noopener" className="btn-primary inline-flex" title="Open the interactive demo">
            Abrir el portal interactivo ↗
          </a>
        ) : (
          <PortalUnavailable />
        )}
        <p className="text-xs text-slate-500">
          Mientras tanto puede leer{' '}
          <Link to="/por-que" className="text-primary-700 hover:underline">
            Por qué
          </Link>
          ,{' '}
          <Link to="/marco-legal" className="text-primary-700 hover:underline">
            Marco legal
          </Link>{' '}
          y{' '}
          <Link to="/arquitectura" className="text-primary-700 hover:underline">
            Cómo funciona
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
