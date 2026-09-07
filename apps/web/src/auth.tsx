import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Citizen } from '@pvg/shared/data';
import { api, TOKEN_KEY, type Provenance } from './api';

const SESSION_KEY = 'pvg.session';

interface Session {
  token: string;
  citizen: Citizen;
  provenance: Provenance;
}

interface AuthContextValue {
  token: string | null;
  citizen: Citizen | null;
  provenance: Provenance | null;
  isAuthenticated: boolean;
  signIn: (session: Session) => void;
  updateProfile: (citizen: Citizen, provenance: Provenance) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(SESSION_KEY);
    if (!token || !raw) return null;
    const parsed = JSON.parse(raw) as Omit<Session, 'token'>;
    if (!parsed?.citizen?.id) return null;
    return { token, citizen: parsed.citizen, provenance: parsed.provenance };
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (!session) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ citizen: session.citizen, provenance: session.provenance }),
    );
  } catch {
    /* storage unavailable: session lives in memory only */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const signIn = useCallback((next: Session) => {
    writeSession(next);
    setSession(next);
  }, []);

  const updateProfile = useCallback((citizen: Citizen, provenance: Provenance) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, citizen, provenance };
      writeSession(next);
      return next;
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* the token may already be invalid; clear locally regardless */
    }
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      citizen: session?.citizen ?? null,
      provenance: session?.provenance ?? null,
      isAuthenticated: Boolean(session?.token),
      signIn,
      updateProfile,
      signOut,
    }),
    [session, signIn, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Route guard: redirects to /login (remembering where the user wanted to go). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
