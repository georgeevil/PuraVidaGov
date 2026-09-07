import {
  AGENCY_LABELS,
  txnId as newTxnId,
  type AgencyName,
  type BusinessRegistrationRequest,
  type CcssResponse,
  type Citizen,
  type MunicipalityResponse,
  type TaxResponse,
  type WorkflowStep,
  type WorkflowTransaction,
} from '@pvg/shared';
import { busRequest } from './bus-client.js';
import { config } from './config.js';
import { createLogger } from '@pvg/shared';

const log = createLogger('api');
const transactions = new Map<string, WorkflowTransaction>();

const STEP_LABELS: Record<AgencyName, string> = {
  registro: 'Validar identidad en el Registro Civil',
  tributacion: 'Inscribir contribuyente en Tributación',
  ccss: 'Registrar patrono en la CCSS',
  municipalidad: 'Emitir patente municipal',
};

export function startRegistration(citizenId: string, request: BusinessRegistrationRequest): string {
  const id = newTxnId();
  const txn: WorkflowTransaction = {
    txnId: id,
    citizenId,
    status: 'running',
    createdAt: new Date().toISOString(),
    request: { ...request, citizenId },
    steps: (['registro', 'tributacion', 'ccss', 'municipalidad'] as AgencyName[]).map((agency) => ({
      agency,
      label: STEP_LABELS[agency],
      status: 'pending',
    })),
  };
  transactions.set(id, txn);
  setImmediate(() => {
    run(txn).catch((err) => {
      log.error('workflow crashed', { txnId: id, message: (err as Error).message });
      txn.status = 'failed';
      txn.completedAt = new Date().toISOString();
    });
  });
  return id;
}

export function getTransaction(txnId: string, citizenId: string): WorkflowTransaction | undefined {
  const txn = transactions.get(txnId);
  if (!txn || txn.citizenId !== citizenId) return undefined;
  return txn;
}

/** Status view: the transaction without `result` (only present once completed). */
export function statusView(txn: WorkflowTransaction): Omit<WorkflowTransaction, 'result'> {
  const { result: _omit, ...rest } = txn;
  return rest;
}

export function reset(): void {
  transactions.clear();
}

// ---------------------------------------------------------------- execution

class StepError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

async function runStep<T>(
  txn: WorkflowTransaction,
  agency: AgencyName,
  action: string,
  data: unknown,
  purpose: string,
): Promise<{ data: T; exchangeId: string }> {
  const step = txn.steps.find((s) => s.agency === agency) as WorkflowStep;
  step.status = 'running';
  step.startedAt = new Date().toISOString();
  try {
    const res = await busRequest<T>({
      service: agency,
      action,
      data,
      subjectId: txn.citizenId,
      consent: { granted: true, reference: txn.txnId },
      purpose,
    });
    step.exchangeId = res.exchangeId;
    step.finishedAt = new Date().toISOString();
    if (!res.ok) {
      step.status = 'error';
      step.error = `${res.error.code}: ${res.error.message}`;
      throw new StepError(res.error.code, step.error);
    }
    step.status = 'done';
    step.result = res.data as WorkflowStep['result'];
    return { data: res.data, exchangeId: res.exchangeId };
  } catch (err) {
    step.finishedAt ??= new Date().toISOString();
    step.status = 'error';
    step.error ??= (err as Error).message;
    throw err instanceof StepError ? err : new StepError('STEP_FAILED', step.error);
  }
}

async function run(txn: WorkflowTransaction): Promise<void> {
  const req = txn.request;
  try {
    const registro = await runStep<Citizen>(
      txn,
      'registro',
      'getCitizen',
      { id: txn.citizenId },
      'Validar identidad para inscripción de negocio',
    );
    const citizen = registro.data;

    const tax = await runStep<TaxResponse>(
      txn,
      'tributacion',
      'createTaxId',
      {
        citizenId: citizen.id,
        fullName: citizen.fullName,
        businessName: req.businessName,
        activityCode: req.activityCode,
        businessType: req.businessType,
        address: req.address,
      },
      'Inscribir al contribuyente y asignar NITE',
    );

    const ccss = await runStep<CcssResponse>(
      txn,
      'ccss',
      'registerEmployer',
      {
        citizenId: citizen.id,
        fullName: citizen.fullName,
        nite: tax.data.nite,
        businessName: req.businessName,
        estimatedEmployees: req.estimatedEmployees,
      },
      'Registrar patrono ante la CCSS',
    );

    const municipality = req.municipality?.trim() ? req.municipality.trim() : citizen.canton;
    const muni = await runStep<MunicipalityResponse>(
      txn,
      'municipalidad',
      'issueLicense',
      {
        citizenId: citizen.id,
        nite: tax.data.nite,
        businessName: req.businessName,
        activityCode: req.activityCode,
        address: req.address,
        municipality,
      },
      'Emitir patente comercial municipal',
    );

    txn.result = {
      citizen,
      tax: tax.data,
      ccss: ccss.data,
      municipality: muni.data,
      benefits: { ...config.benefits },
      onceOnly: [
        { field: 'fullName', label: 'Nombre completo', source: 'registro', exchangeId: registro.exchangeId },
        { field: 'id', label: 'Cédula', source: 'registro', exchangeId: registro.exchangeId },
        { field: 'dateOfBirth', label: 'Fecha de nacimiento', source: 'registro', exchangeId: registro.exchangeId },
        { field: 'address', label: 'Dirección', source: 'registro', exchangeId: registro.exchangeId },
        { field: 'canton', label: 'Cantón', source: 'registro', exchangeId: registro.exchangeId },
        { field: 'nationality', label: 'Nacionalidad', source: 'registro', exchangeId: registro.exchangeId },
        { field: 'nite', label: 'NITE', source: 'tributacion', exchangeId: tax.exchangeId },
        { field: 'taxRegime', label: 'Régimen tributario', source: 'tributacion', exchangeId: tax.exchangeId },
        { field: 'employerNumber', label: 'Número patronal', source: 'ccss', exchangeId: ccss.exchangeId },
        { field: 'patenteNumber', label: 'Número de patente', source: 'municipalidad', exchangeId: muni.exchangeId },
      ],
    };
    txn.status = 'completed';
    txn.completedAt = new Date().toISOString();
    log.info('workflow completed', { txnId: txn.txnId });
  } catch (err) {
    txn.status = 'failed';
    txn.completedAt = new Date().toISOString();
    log.warn('workflow failed', { txnId: txn.txnId, message: (err as Error).message });
  }
}

export { AGENCY_LABELS };
