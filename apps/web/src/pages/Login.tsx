import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, errorMessage, type LoginResponse } from '../api';
import { useAuth } from '../auth';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';

export function Login() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<LoginResponse | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!id.trim() || !password) {
      setError('Ingrese su cédula y su contraseña.');
      return;
    }
    setBusy(true);
    try {
      setChallenge(await api.login(id.trim(), password));
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('Ingrese el código de verificación recibido.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.loginOtp(challenge.challengeId, code.trim());
      signIn({ token: res.token, citizen: res.citizen, provenance: res.provenance });
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Ingresar al portal
          <Tip en="Sign in to the citizen portal" />
        </h1>
        <p className="mt-1 text-sm text-slate-600">Una identidad, todos los trámites del Estado.</p>
      </div>

      <div className="card">
        <ol className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500" aria-label="Pasos">
          <li className={challenge ? 'text-slate-400' : 'text-primary-700'}>1. Identidad</li>
          <li aria-hidden="true">›</li>
          <li className={challenge ? 'text-primary-700' : ''}>2. Verificación</li>
        </ol>

        {error && (
          <div className="mb-4">
            <Alert kind="error">{error}</Alert>
          </div>
        )}

        {!challenge ? (
          <form onSubmit={submitCredentials} noValidate className="space-y-4">
            <div>
              <label htmlFor="cedula" className="label">
                Cédula de identidad
                <Tip en="National ID number" />
              </label>
              <input
                id="cedula"
                className="input"
                inputMode="numeric"
                autoComplete="username"
                placeholder="1-2345-6789"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Contraseña
                <Tip en="Password" />
              </label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Spinner className="h-4 w-4 text-white" />}
              Continuar
            </button>
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <strong>Demo:</strong> cédula <code className="font-mono">1-2345-6789</code>, contraseña{' '}
              <code className="font-mono">demo</code>
            </div>
          </form>
        ) : (
          <form onSubmit={submitOtp} noValidate className="space-y-4">
            <p className="text-sm text-slate-700">
              Enviamos un código de verificación al teléfono registrado en el Registro Civil. Este paso simula la{' '}
              <strong>firma digital</strong> (segundo factor): en un sistema real usaría su tarjeta de firma
              digital o la app del Banco Central.
            </p>

            <div
              className="rounded-md border border-green-200 bg-green-50 p-3 text-sm"
              role="status"
              title="Simulated SMS — there is no real phone network in this demo"
            >
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-800">
                <span aria-hidden="true">📱</span> SMS simulado
                <Tip en="Simulated SMS" />
              </div>
              <div className="text-slate-700">
                Para: <span className="font-mono">{challenge.otp.maskedPhone}</span>
              </div>
              <div className="mt-1 text-slate-700">
                Su código PuraVidaGov es{' '}
                <span className="font-mono text-lg font-bold tracking-widest text-slate-900">
                  {challenge.otp.demoCode}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary mt-2 !py-1 text-xs"
                onClick={() => setCode(challenge.otp.demoCode)}
              >
                Usar código
              </button>
            </div>

            <div>
              <label htmlFor="otp" className="label">
                Código de verificación
                <Tip en="One-time verification code" />
              </label>
              <input
                id="otp"
                className="input font-mono tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Spinner className="h-4 w-4 text-white" />}
              Verificar e ingresar
            </button>
            <button
              type="button"
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700"
              onClick={() => {
                setChallenge(null);
                setError(null);
              }}
            >
              ← Volver a ingresar la cédula
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
