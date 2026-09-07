import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

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
      <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-500">
        PuraVidaGov · prueba de concepto inspirada en X-Road (Estonia) y LifeSG (Singapur)
      </div>
    </footer>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" title="PuraVidaGov — citizen portal (demo)">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">
        PV
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        PuraVidaGov<span className="hidden text-sm font-normal text-slate-500 sm:inline"> · Portal ciudadano</span>
      </span>
    </Link>
  );
}

export function Layout() {
  const { citizen, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="tricolor h-1.5 w-full" aria-hidden="true" />
      <DemoBanner />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo />
          {isAuthenticated && (
            <nav aria-label="Principal" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
              <NavLink to="/" end className={navClass} title="Home">
                Inicio
              </NavLink>
              <NavLink to="/auditoria" className={navClass} title="My shared data (audit log)">
                Mis datos compartidos
              </NavLink>
              <NavLink to="/arquitectura" className={navClass} title="How it works">
                Cómo funciona
              </NavLink>
            </nav>
          )}
          {isAuthenticated && citizen ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-slate-600 md:inline" title="Signed in as">
                {citizen.firstName} {citizen.lastName1}
              </span>
              <button type="button" onClick={handleLogout} className="btn-secondary !px-3 !py-1.5" title="Sign out">
                Salir
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
