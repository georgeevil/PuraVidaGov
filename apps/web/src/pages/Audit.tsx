import { useEffect, useState } from 'react';
import type { AuditEntry } from '@pvg/shared/data';
import { api, errorMessage } from '../api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Tip } from '../components/Tip';
import { formatDateTime, formatMs } from '../format';
import { AGENCY_SHORT } from '@pvg/shared/data';
import { agencyLabel } from '../labels';

const ACTION_ES: Record<string, string> = {
  getCitizen: 'Consulta de identidad',
  createTaxId: 'Inscripción tributaria',
  registerEmployer: 'Registro patronal',
  issueLicense: 'Emisión de patente',
  registerBirth: 'Inscripción de nacimiento',
  updateAddress: 'Actualización de domicilio',
  insureDependent: 'Aseguramiento de dependiente',
  issueLandUse: 'Certificado de uso de suelo',
  issueBuildingPermit: 'Permiso de construcción',
  listProperties: 'Consulta de propiedades',
  getProperty: 'Consulta de propiedad',
  registerCompany: 'Constitución de sociedad',
  issueSanitaryPermit: 'Permiso sanitario de funcionamiento',
  openVaccinationRecord: 'Apertura de carné de vacunación',
  reviewPlans: 'Revisión de planos (APC)',
};

const REQUESTER_ES: Record<string, string> = {
  'portal-ciudadano': 'Portal ciudadano',
};

export function Audit() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .audit()
      .then((e) => !cancelled && setEntries(e))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Mis datos compartidos
          <Tip en="My shared data — audit log of every exchange about you" />
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Cada vez que una institución consulta o recibe sus datos a través del bus de interoperabilidad, el
          intercambio queda registrado: quién lo pidió, a qué institución, con qué propósito y bajo qué
          consentimiento. Se anotan los <em>nombres</em> de los campos entregados, nunca sus valores. Esta
          transparencia es su derecho de acceso según la{' '}
          <strong>Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales</strong>.
        </p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {!entries ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner /> Cargando registro…
        </div>
      ) : entries.length === 0 ? (
        <Alert kind="info">Todavía no hay intercambios registrados sobre sus datos.</Alert>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium" title="Timestamp">Fecha y hora</th>
                <th className="px-3 py-2 font-medium" title="Requester">Solicitante</th>
                <th className="px-3 py-2 font-medium" title="Service (agency)">Institución</th>
                <th className="px-3 py-2 font-medium" title="Action">Acción</th>
                <th className="px-3 py-2 font-medium" title="Purpose">Propósito</th>
                <th className="px-3 py-2 font-medium" title="Consent reference">Consentimiento</th>
                <th className="px-3 py-2 font-medium" title="Status">Estado</th>
                <th className="px-3 py-2 text-right font-medium" title="Latency">Latencia</th>
                <th className="px-3 py-2 font-medium" title="Fields returned (names only, never values)">Campos entregados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {formatDateTime(e.timestamp)}
                    <div className="font-mono text-[11px] text-slate-400">{e.id}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{REQUESTER_ES[e.requester] ?? e.requester}</td>
                  <td className="px-3 py-2 text-slate-900" title={agencyLabel(e.service)}>
                    {(AGENCY_SHORT as Record<string, string>)[e.service] ?? e.service}
                  </td>
                  <td className="px-3 py-2 text-slate-700" title={e.action}>
                    {ACTION_ES[e.action] ?? e.action}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{e.purpose}</td>
                  <td className="px-3 py-2">
                    {e.consent.granted ? (
                      <span className="text-green-700">Otorgado</span>
                    ) : (
                      <span className="text-red-700">No otorgado</span>
                    )}
                    <div className="font-mono text-[11px] text-slate-400">{e.consent.reference}</div>
                  </td>
                  <td className="px-3 py-2">
                    {e.status === 'ok' ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">OK</span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800" title={e.errorCode}>
                        Error{e.errorCode ? ` · ${e.errorCode}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs text-slate-600">{formatMs(e.latencyMs)}</td>
                  <td className="px-3 py-2">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {e.fieldsReturned.map((f) => (
                        <span key={f} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
