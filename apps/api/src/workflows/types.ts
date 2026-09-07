import type { Citizen, StepDefinition, WorkflowDefinition, WorkflowResult } from '@pvg/shared';
import type { z } from 'zod';

/** Everything the engine knows while a transaction runs. Passed to every spec function. */
export interface StepContext {
  citizen: Citizen;
  /** Validated form input from the citizen. */
  input: Record<string, unknown>;
  /** Agency responses by step id (only steps that ran). */
  results: Record<string, unknown>;
  /** Bus exchange ids by step id, including 'identidad'. */
  exchangeIds: Record<string, string>;
}

export interface StepSpec extends StepDefinition {
  /** Skip the step when false; recorded as done+skipped. */
  when?: (ctx: StepContext) => boolean;
  /** Payload sent through the bus. */
  data: (ctx: StepContext) => unknown;
}

export interface WorkflowSpec extends Omit<WorkflowDefinition, 'steps'> {
  /** Validates `input` before the transaction starts. */
  inputSchema: z.ZodTypeAny;
  steps: StepSpec[];
  /** Builds the citizen-facing result once every step is done. Benefits are added by the engine. */
  result: (ctx: StepContext) => Omit<WorkflowResult, 'benefits'>;
}

/** Strips the functions so a spec can be sent to the browser. */
export function toDefinition(spec: WorkflowSpec): WorkflowDefinition {
  const { inputSchema: _schema, result: _result, steps, ...rest } = spec;
  return {
    ...rest,
    steps: steps.map(({ when: _when, data: _data, ...step }) => step),
  };
}
