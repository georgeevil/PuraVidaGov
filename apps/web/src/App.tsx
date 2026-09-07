import { Navigate, Route, Routes, useParams } from 'react-router-dom';
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

/** v1 `/negocio/:txnId` → v2 `/tramite/start-business/:txnId`. */
function LegacyBusinessRedirect() {
  const { txnId = '' } = useParams();
  return <Navigate to={`/tramite/start-business/${encodeURIComponent(txnId)}`} replace />;
}

const guarded = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

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
        <Route path="/arquitectura" element={guarded(<Architecture />)} />
        <Route path="/marco-legal" element={guarded(<LegalFramework />)} />
        <Route path="/por-que" element={guarded(<Case />)} />
        {/* Legacy v1 routes */}
        <Route path="/negocio/nuevo" element={<Navigate to="/tramite/start-business" replace />} />
        <Route path="/negocio/:txnId" element={<LegacyBusinessRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
