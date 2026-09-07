import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkflowTransaction } from '@pvg/shared/data';
import { api, errorMessage } from '../api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatDateTime } from '../format';

const STATUS: Record<WorkflowTransaction['status'], { es: string; en: string; cls: string }> = {
  running: { es: 'En proceso', en: 'Running', cls: 'bg-primary-50 text-primary-700 border-primary-100' },
  completed: { es: 'Completado', en: 'Completed', cls: 'bg-green-50 text-green-800 border-green-200' },
  failed: { es: 'Falló', en: 'Failed', cls: 'bg-red-50 text-red-800 border-red-200' },
};

export function StatusBadge({ status }: { status: WorkflowTransaction['status'] }) {
  const s = STATUS[status] ?? { es: status, en: status, cls: 'bg-slate-50 text-slate-700 border-slate-200' };
  return (
    <span title={s.en} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      {status === 'running' && <Spinner className="mr-1 h-3 w-3" />}
      {s.es}
    </span>
  );
}

export function MyTransactions() {
  const [list, setList] = useState<WorkflowTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .transactions()
      .then((t) => !cancelled && setList(t))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Mis trámites
          <Tip en="My procedures — every life event you started in this portal" />
        </h1>
        <p className="mt-1 text-sm text-slate-600">Los eventos de vida que ha iniciado en este portal, del más reciente al más antiguo.</p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {!list ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner /> Cargando trámites…
        </div>
      ) : list.length === 0 ? (
        <Alert kind="info">
          Todavía no ha iniciado ningún trámite.{' '}
          <Link to="/" className="font-medium underline">
            Ver los eventos de vida disponibles
          </Link>
          .
        </Alert>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium" title="Life event">Trámite</th>
                <th className="px-3 py-2 font-medium" title="Transaction id">Identificador</th>
                <th className="px-3 py-2 font-medium" title="Status">Estado</th>
                <th className="px-3 py-2 font-medium" title="Created at">Iniciado</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((t) => {
                const href = `/tramite/${encodeURIComponent(t.workflowId)}/${encodeURIComponent(t.txnId)}`;
                return (
                  <tr key={t.txnId} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-medium text-slate-900">{t.workflowTitle}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{t.txnId}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatDateTime(t.createdAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <Link to={href} className="text-primary-700 hover:underline">
                        {t.status === 'completed' ? 'Ver constancia' : 'Ver detalle'} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
