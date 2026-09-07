import {
  createServiceApp,
  errorHandler,
  ropStatementSchema,
  simulatedLatency,
  todayIso,
  withdrawFclSchema,
  type FclWithdrawalResponse,
  type RopStatementResponse,
} from '@pvg/shared';
import type { Express } from 'express';
import type { z } from 'zod';
import { requireApiKey, validateBody, wrap } from './middleware.js';
import { store, type FclWithdrawal, type RopStatement } from './store.js';

export const SERVICE_NAME = 'supen';
export const OPERATOR = 'Operadora Demo de Pensiones';

/** Days the operadora has to pay the FCL after the request (Ley 7983 art. 6, see docs/research). */
export const FCL_PAYMENT_DAYS = 15;

/** Months over which the ROP balance is spread per modality (demo simplification). */
export const ROP_MONTHS: Record<RopStatementResponse['modality'], number> = {
  'retiro-programado': 240,
  'renta-permanente': 300,
};

type WithdrawFclBody = z.infer<typeof withdrawFclSchema>;
type RopStatementBody = z.infer<typeof ropStatementSchema>;

/** ISO date `days` days after `iso` (UTC arithmetic). */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** First day of the month after `iso`. */
export function firstDayOfNextMonthIso(iso: string): string {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

export function monthlyPayment(balanceCrc: number, modality: RopStatementResponse['modality']): number {
  return Math.round(balanceCrc / ROP_MONTHS[modality]);
}

function withdrawalToResponse(w: FclWithdrawal): FclWithdrawalResponse {
  const { requestNumber, balanceCrc, paymentDate, operator } = w;
  return { requestNumber, balanceCrc, paymentDate, operator };
}

function statementToResponse(s: RopStatement): RopStatementResponse {
  const { operator, balanceCrc, modality, monthlyPaymentCrc, firstPaymentDate } = s;
  return { operator, balanceCrc, modality, monthlyPaymentCrc, firstPaymentDate };
}

function affiliateNotFound(citizenId: string) {
  return {
    error: { code: 'AFFILIATE_NOT_FOUND', message: `La persona ${citizenId} no está afiliada a esta operadora` },
  };
}

export function createApp(): Express {
  const apiKey = process.env.SUPEN_API_KEY ?? 'demo-supen-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/supen/affiliates', (_req, res) => {
    res.json(store.listAffiliates());
  });

  app.get('/supen/withdrawals', (_req, res) => {
    res.json(store.listWithdrawals());
  });

  app.get('/supen/statements', (_req, res) => {
    res.json(store.listStatements());
  });

  app.post(
    '/supen/withdrawFcl',
    validateBody(withdrawFclSchema),
    wrap(async (req, res) => {
      const body = req.body as WithdrawFclBody;
      await simulatedLatency();

      const existing = store.findWithdrawal(body.citizenId, body.terminationDate);
      if (existing) return res.json(withdrawalToResponse(existing));

      const affiliate = store.findAffiliate(body.citizenId);
      if (!affiliate) return res.status(404).json(affiliateNotFound(body.citizenId));

      const today = todayIso();
      const year = Number(today.slice(0, 4));
      const withdrawal = store.saveWithdrawal({
        citizenId: body.citizenId,
        fullName: body.fullName,
        employerNumber: body.employerNumber,
        terminationDate: body.terminationDate,
        iban: body.iban,
        requestNumber: `FCL-${year}-${String(store.nextWithdrawalSequence(year)).padStart(6, '0')}`,
        balanceCrc: affiliate.fclBalanceCrc,
        paymentDate: addDaysIso(today, FCL_PAYMENT_DAYS),
        operator: OPERATOR,
      });
      res.json(withdrawalToResponse(withdrawal));
    }),
  );

  app.post(
    '/supen/ropStatement',
    validateBody(ropStatementSchema),
    wrap(async (req, res) => {
      const body = req.body as RopStatementBody;
      await simulatedLatency();

      const existing = store.findStatement(body.citizenId);
      if (existing) return res.json(statementToResponse(existing));

      const affiliate = store.findAffiliate(body.citizenId);
      if (!affiliate) return res.status(404).json(affiliateNotFound(body.citizenId));

      const statement = store.saveStatement({
        citizenId: body.citizenId,
        fullName: body.fullName,
        pensionApplication: body.pensionApplication,
        operator: OPERATOR,
        balanceCrc: affiliate.ropBalanceCrc,
        modality: body.modality,
        monthlyPaymentCrc: monthlyPayment(affiliate.ropBalanceCrc, body.modality),
        firstPaymentDate: firstDayOfNextMonthIso(todayIso()),
      });
      res.json(statementToResponse(statement));
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
