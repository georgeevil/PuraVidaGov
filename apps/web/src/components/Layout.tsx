import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { PortalLink } from './Portal';
import { Feedback } from './Feedback';

interface NavItem {
  to: string;
  label: string;
  en: string;
  end?: boolean;
}

/** Full nav for a signed-in citizen. */
const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', en: 'Home', end: true },
  { to: '/mis-tramites', label: 'Mis trámites', en: 'My procedures' },
  { to: '/auditoria', label: 'Mis datos compartidos', en: 'My shared data (audit log)' },
  { to: '/marco-legal', label: 'Marco legal', en: 'Legal framework — what is possible today' },
  { to: '/por-que', label: 'Por qué', en: 'Why — the case for a once-only government' },
  { to: '/arquitectura', label: 'Cómo funciona', en: 'How it works' },
  { to: '/seguimiento', label: 'Seguimiento', en: 'Where this stands, and what you can do' },
  { to: '/quien-lo-hace', label: 'Quién lo hace', en: 'Who builds this, and why' },
];

/** Public pages (v3): what an anonymous visitor can read without a session. */
const PUBLIC_NAV: NavItem[] = [
  { to: '/por-que', label: 'Por qué', en: 'Why — the case for a once-only government' },
  { to: '/marco-legal', label: 'Marco legal', en: 'Legal framework — what is possible today' },
  { to: '/arquitectura', label: 'Cómo funciona', en: 'How it works' },
  { to: '/seguimiento', label: 'Seguimiento', en: 'Where this stands, and what you can do' },
  { to: '/quien-lo-hace', label: 'Quién lo hace', en: 'Who builds this, and why' },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export function DemoBanner() {
  return (
    <div role="note" className="bg-amber-100 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-amber-900">
      DEMOSTRACIÓN — datos ficticios. No es un sistema del Gobierno de Costa Rica.
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-4 text-center text-xs text-slate-500">
        <p>PuraVidaGov · prueba de concepto inspirada en X-Road (Estonia) y LifeSG (Singapur)</p>
        <p>
          <Feedback />
        </p>
      </div>
    </footer>
  );
}

function Logo({ home }: { home: string }) {
  return (
    <Link to={home} className="flex items-center gap-2" title="PuraVidaGov — citizen portal (demo)">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">
        PV
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        PuraVidaGov<span className="hidden text-sm font-normal text-slate-500 lg:inline"> · Portal ciudadano</span>
      </span>
    </Link>
  );
}

export function Layout() {
  const { citizen, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the small-screen menu on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const links = (isAuthenticated ? NAV : PUBLIC_NAV).map((n) => (
    <NavLink key={n.to} to={n.to} end={n.end} className={navClass} title={n.en}>
      {n.label}
    </NavLink>
  ));

  const menuButton = (
    <button
      type="button"
      className="btn-secondary !px-2 !py-1.5 md:hidden"
      aria-expanded={open}
      aria-controls="menu-movil"
      aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
      title="Menu"
      onClick={() => setOpen((v) => !v)}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
        {open ? (
          <path d="M5.3 4.3 10 9l4.7-4.7 1.4 1.4L11.4 10.4l4.7 4.7-1.4 1.4L10 11.8l-4.7 4.7-1.4-1.4 4.7-4.7-4.7-4.7z" />
        ) : (
          <path d="M3 5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
        )}
      </svg>
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="tricolor h-1.5 w-full" aria-hidden="true" />
      <DemoBanner />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo home="/" />
          <nav aria-label="Principal" className="hidden flex-wrap gap-1 md:flex">
            {links}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {isAuthenticated && citizen ? (
              <>
                <span className="hidden text-slate-600 lg:inline" title="Signed in as">
                  {citizen.firstName} {citizen.lastName1}
                </span>
                <button type="button" onClick={handleLogout} className="btn-secondary !px-3 !py-1.5" title="Sign out">
                  Salir
                </button>
              </>
            ) : (
              <PortalLink className="btn-primary !px-3 !py-1.5" title="Try the demo — sign in as María">
                Probar el demo
              </PortalLink>
            )}
            {menuButton}
          </div>
        </div>
        {open && (
          <nav id="menu-movil" aria-label="Principal (móvil)" className="border-t border-slate-100 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-2">{links}</div>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
