import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { IS_STATIC } from './api';
import { RequireAuth } from './auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { GenericWorkflow } from './pages/GenericWorkflow';
import { Transaction } from './pages/Transaction';
import { MyTransactions } from './pages/MyTransactions';
import { Audit } from './pages/Audit';
import { Architecture } from './pages/Architecture';
import { LegalFramework } from './pages/LegalFramework';
import { Case } from './pages/Case';
import { Author } from './pages/Author';
import { PortalOnlyCard } from './components/Portal';

/** v1 `/negocio/:txnId` → v2 `/tramite/start-business/:txnId`. */
function LegacyBusinessRedirect() {
  const { txnId = '' } = useParams();
  return <Navigate to={`/tramite/start-business/${encodeURIComponent(txnId)}`} replace />;
}

/**
 * Guarded routes. In the static build (docs/CONTRACTS.md v4) there is no backend to talk to, so the route
 * still exists but renders the "the portal runs elsewhere" card instead of the page. RequireAuth keeps
 * sending anonymous visitors to the public /por-que, which is itself unguarded — no redirect loop.
 */
const guarded = (el: JSX.Element) => <RequireAuth>{IS_STATIC ? <PortalOnlyCard /> : el}</RequireAuth>;

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={guarded(<Dashboard />)} />
        <Route path="/tramite/:id" element={guarded(<GenericWorkflow />)} />
        <Route path="/tramite/:id/:txnId" element={guarded(<Transaction />)} />
        <Route path="/mis-tramites" element={guarded(<MyTransactions />)} />
        <Route path="/auditoria" element={guarded(<Audit />)} />
        {/* Public pages (v3): readable without a session. */}
        <Route path="/arquitectura" element={<Architecture />} />
        <Route path="/marco-legal" element={<LegalFramework />} />
        <Route path="/por-que" element={<Case />} />
        <Route path="/quien-lo-hace" element={<Author />} />
        {/* Legacy v1 routes */}
        <Route path="/negocio/nuevo" element={<Navigate to="/tramite/start-business" replace />} />
        <Route path="/negocio/:txnId" element={<LegacyBusinessRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
