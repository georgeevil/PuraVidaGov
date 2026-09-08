import type { BeneficiaryPayoutResponse, FclWithdrawalResponse, RopStatementResponse } from '@pvg/shared';

/** Balances the operadora keeps per affiliate (cédula). Fictional seed (docs/CONTRACTS.md v3 → Operadora). */
export interface Affiliate {
  citizenId: string;
  fclBalanceCrc: number;
  ropBalanceCrc: number;
}

const SEED_AFFILIATES: Affiliate[] = [
  { citizenId: '1-2345-6789', fclBalanceCrc: 1250000, ropBalanceCrc: 8400000 }, // María
  { citizenId: '7-0123-0456', fclBalanceCrc: 3900000, ropBalanceCrc: 31200000 }, // José
  { citizenId: '2-0987-0654', fclBalanceCrc: 480000, ropBalanceCrc: 2100000 }, // Ana
  { citizenId: '7-0100-0300', fclBalanceCrc: 2600000, ropBalanceCrc: 28000000 }, // Luis (v4)
];

/** Payout of a deceased affiliate's balances to a beneficiary (v4). */
export interface BeneficiaryPayout extends BeneficiaryPayoutResponse {
  beneficiaryId: string;
  deceasedId: string;
  deathCertificate: string;
  iban: string;
  requestedAt: string;
}

export interface FclWithdrawal extends FclWithdrawalResponse {
  citizenId: string;
  fullName: string;
  employerNumber: string;
  terminationDate: string;
  iban: string;
}

export interface RopStatement extends RopStatementResponse {
  citizenId: string;
  fullName: string;
  pensionApplication: string;
}

function withdrawalKey(citizenId: string, terminationDate: string): string {
  return `${citizenId}|${terminationDate}`;
}

class SupenStore {
  private affiliates = new Map<string, Affiliate>();
  private withdrawals = new Map<string, FclWithdrawal>(); // keyed by citizenId|terminationDate
  private statements = new Map<string, RopStatement>(); // keyed by citizenId
  private withdrawalCounters = new Map<number, number>(); // year -> last sequence
  private payouts = new Map<string, BeneficiaryPayout>(); // keyed by deceasedId
  private payoutCounters = new Map<number, number>();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.affiliates = new Map(SEED_AFFILIATES.map((a) => [a.citizenId, { ...a }]));
    this.withdrawals.clear();
    this.statements.clear();
    this.withdrawalCounters.clear();
    this.payouts.clear();
    this.payoutCounters.clear();
  }

  // ---- v4

  findPayout(deceasedId: string): BeneficiaryPayout | undefined {
    return this.payouts.get(deceasedId);
  }

  nextPayoutSequence(year: number): number {
    const next = (this.payoutCounters.get(year) ?? 0) + 1;
    this.payoutCounters.set(year, next);
    return next;
  }

  savePayout(p: BeneficiaryPayout): BeneficiaryPayout {
    this.payouts.set(p.deceasedId, p);
    return p;
  }

  listPayouts(): BeneficiaryPayout[] {
    return [...this.payouts.values()];
  }

  findAffiliate(citizenId: string): Affiliate | undefined {
    return this.affiliates.get(citizenId);
  }

  listAffiliates(): Affiliate[] {
    return [...this.affiliates.values()];
  }

  findWithdrawal(citizenId: string, terminationDate: string): FclWithdrawal | undefined {
    return this.withdrawals.get(withdrawalKey(citizenId, terminationDate));
  }

  nextWithdrawalSequence(year: number): number {
    const next = (this.withdrawalCounters.get(year) ?? 0) + 1;
    this.withdrawalCounters.set(year, next);
    return next;
  }

  saveWithdrawal(w: FclWithdrawal): FclWithdrawal {
    this.withdrawals.set(withdrawalKey(w.citizenId, w.terminationDate), w);
    return w;
  }

  listWithdrawals(): FclWithdrawal[] {
    return [...this.withdrawals.values()];
  }

  findStatement(citizenId: string): RopStatement | undefined {
    return this.statements.get(citizenId);
  }

  saveStatement(s: RopStatement): RopStatement {
    this.statements.set(s.citizenId, s);
    return s;
  }

  listStatements(): RopStatement[] {
    return [...this.statements.values()];
  }
}

export const store = new SupenStore();
