/**
 * Workflow registry. Data, not code: add a life event by writing `<id>.ts` and listing it here.
 * A catalogue-only entry (`available:false`) would keep its legal note so the dashboard and /marco-legal can
 * explain what it would take, with no fields or steps; today every entry is implemented.
 */
import type { WorkflowDefinition } from '@pvg/shared';
import { startBusiness } from './start-business.js';
import { newborn } from './newborn.js';
import { construction } from './construction.js';
import { move } from './move.js';
import { jobLoss } from './job-loss.js';
import { retirement } from './retirement.js';
import { driverLicense } from './driver-license.js';
import { toDefinition, type WorkflowSpec } from './types.js';

export const WORKFLOWS: WorkflowSpec[] = [startBusiness, newborn, construction, move, jobLoss, retirement, driverLicense];

export function getWorkflow(id: string): WorkflowSpec | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

export function listDefinitions(): WorkflowDefinition[] {
  return WORKFLOWS.map(toDefinition);
}
