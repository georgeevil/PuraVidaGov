/**
 * Generic workflow engine (CONTRACTS v2 "Workflow engine"). Runs a WorkflowSpec step by step through the
 * interoperability bus. Every transaction starts with the implicit `identidad` step (registro.getCitizen);
 * steps whose `when(ctx)` is false are recorded as done+skipped without a bus call.
 */
import {
  createLogger,
  txnId as newTxnId,
  type Benefits,
  type Citizen,
  type LegalNote,
  type WorkflowStep,
  type WorkflowTransaction,
} from '@pvg/shared';
import { busRequest } from './bus-client.js';
import { config } from './config.js';
import type { StepContext, StepSpec, WorkflowSpec } from './workflows/types.js';

const log = createLogger('api');
const transactions = new Map<string, WorkflowTransaction>();

/** Legal note of the implicit identity step, shared by every workflow. */
export const IDENTITY_LEGAL: LegalNote = {
  status: 'hoy',
  basis: ['cr-8454', 'cr-3504', 'cr-idc'],
  model: ['ee-idcard', 'eu-eidas2'],
  today:
    'La cédula y la firma digital ya identifican a la persona con plena validez legal (Ley 8454 art. 9) y desde septiembre de 2025 el TSE la emite en el teléfono (IDC), con aceptación obligatoria desde el 1 de enero de 2027 por resolución del TSE. Lo que falta es una ley que obligue a toda institución y a los sectores regulados a aceptarla y a usarla como inicio de sesión único.',
  todayEn:
    'The cédula and the digital signature already identify the person with full legal validity (Ley 8454 art. 9) and since September 2025 the TSE issues it on the phone (IDC), mandatory to accept from 1 January 2027 by TSE resolution. What is missing is a statute obliging every institution and regulated sector to accept it and use it as a single sign-on.',
  gap: 'Una norma que obligue a toda institución pública y a los sectores regulados a aceptar la identidad digital nacional, como la Identity Documents Act estonia o eIDAS 2.',
  gapEn: 'A rule obliging every public institution and the regulated sectors to accept the national digital identity, like Estonia\'s Identity Documents Act or eIDAS 2.',
};

export const IDENTITY_STEP: StepSpec = {
  id: 'identidad',
  agency: 'registro',
  action: 'getCitizen',
  label: 'Validar identidad en el Registro Civil',
  labelEn: 'Validate identity at the Civil Registry',
  purpose: 'Validar identidad',
  legal: IDENTITY_LEGAL,
  data: (ctx) => ({ id: ctx.citizen.id }),
};

/** The benefits a completed transaction reports: the spec's, overridden by env for start-business (PRD FR-20). */
export function benefitsFor(spec: WorkflowSpec): Benefits {
  return spec.id === 'start-business' ? { ...spec.benefits, ...config.benefits } : { ...spec.benefits };
}

// ---------------------------------------------------------------- public API

export function startTransaction(citizenId: string, spec: WorkflowSpec, input: Record<string, unknown>): string {
  const id = newTxnId();
  const toStep = (s: StepSpec): WorkflowStep => ({ id: s.id, agency: s.agency, label: s.label, status: 'pending', legal: s.legal });
  const txn: WorkflowTransaction = {
    txnId: id,
    workflowId: spec.id,
    workflowTitle: spec.title,
    citizenId,
    status: 'running',
    createdAt: new Date().toISOString(),
    input: { ...input },
    steps: [toStep(IDENTITY_STEP), ...spec.steps.map(toStep)],
  };
  transactions.set(id, txn);
  setImmediate(() => {
    run(txn, spec).catch((err) => {
      log.error('workflow crashed', { txnId: id, workflowId: spec.id, message: (err as Error).message });
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

/** The caller's transactions, newest first, without `result`. */
export function listTransactions(citizenId: string): Omit<WorkflowTransaction, 'result'>[] {
  return [...transactions.values()]
    .filter((t) => t.citizenId === citizenId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(statusView);
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
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function runStep<T>(txn: WorkflowTransaction, spec: StepSpec, ctx: StepContext): Promise<T> {
  const step = txn.steps.find((s) => s.id === spec.id) as WorkflowStep;
  step.status = 'running';
  step.startedAt = new Date().toISOString();
  try {
    const res = await busRequest<T>({
      service: spec.agency,
      action: spec.action,
      data: spec.data(ctx),
      subjectId: txn.citizenId,
      consent: { granted: true, reference: txn.txnId },
      purpose: spec.purpose,
    });
    step.exchangeId = res.exchangeId;
    step.finishedAt = new Date().toISOString();
    if (!res.ok) {
      step.status = 'error';
      step.error = `${res.error.code}: ${res.error.message}`;
      throw new StepError(res.error.code, step.error);
    }
    step.status = 'done';
    step.result = res.data;
    ctx.results[spec.id] = res.data;
    ctx.exchangeIds[spec.id] = res.exchangeId;
    return res.data;
  } catch (err) {
    step.finishedAt ??= new Date().toISOString();
    step.status = 'error';
    step.error ??= (err as Error).message;
    throw err instanceof StepError ? err : new StepError('STEP_FAILED', step.error);
  }
}

function skipStep(txn: WorkflowTransaction, spec: StepSpec): void {
  const step = txn.steps.find((s) => s.id === spec.id) as WorkflowStep;
  const now = new Date().toISOString();
  step.status = 'done';
  step.skipped = true;
  step.startedAt = now;
  step.finishedAt = now;
}

async function run(txn: WorkflowTransaction, spec: WorkflowSpec): Promise<void> {
  // The identity step only knows the cédula; the full record arrives from the Registro Civil.
  const ctx: StepContext = {
    citizen: { id: txn.citizenId } as Citizen,
    input: txn.input,
    results: {},
    exchangeIds: {},
  };
  try {
    ctx.citizen = await runStep<Citizen>(txn, IDENTITY_STEP, ctx);
    for (const step of spec.steps) {
      if (step.when && !step.when(ctx)) {
        skipStep(txn, step);
        continue;
      }
      await runStep(txn, step, ctx);
    }
    txn.result = { ...spec.result(ctx), benefits: benefitsFor(spec) };
    txn.status = 'completed';
    txn.completedAt = new Date().toISOString();
    log.info('workflow completed', { txnId: txn.txnId, workflowId: spec.id });
  } catch (err) {
    txn.status = 'failed';
    txn.completedAt = new Date().toISOString();
    log.warn('workflow failed', { txnId: txn.txnId, workflowId: spec.id, message: (err as Error).message });
  }
}
