import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewBusiness } from './pages/NewBusiness';
import { Transaction } from './pages/Transaction';
import { Audit } from './pages/Audit';
import { Architecture } from './pages/Architecture';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/negocio/nuevo"
          element={
            <RequireAuth>
              <NewBusiness />
            </RequireAuth>
          }
        />
        <Route
          path="/negocio/:txnId"
          element={
            <RequireAuth>
              <Transaction />
            </RequireAuth>
          }
        />
        <Route
          path="/auditoria"
          element={
            <RequireAuth>
              <Audit />
            </RequireAuth>
          }
        />
        <Route
          path="/arquitectura"
          element={
            <RequireAuth>
              <Architecture />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
