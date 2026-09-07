/** Shape of `CASE` in ./case.ts (the argument for a once-only government in Costa Rica). */
import type { LegalStatus } from '@pvg/shared/data';

export interface CaseContent {
  hero: { title: string; subtitle: string; disclaimer: string };
  problem: { title: string; paragraphs: string[]; stats: Array<{ label: string; value: string; source: string }> };
  foundations: { title: string; intro: string; items: Array<{ name: string; what: string; status: LegalStatus }> };
  roadmap: {
    title: string;
    intro: string;
    steps: Array<{ n: number; title: string; summary: string; actions: string[]; lawNeeded?: string }>;
  };
  dividend: { title: string; intro: string; rule: Array<{ share: number; destination: string }>; caveats: string[] };
  evidence: { title: string; items: Array<{ claim: string; source: string; url?: string }> };
  calculator: {
    title: string;
    intro: string;
    /** GDP in thousands of millions of colones (10⁹ CRC). */
    gdpCrcBillions: number;
    defaultSavingsPct: number;
    minPct: number;
    maxPct: number;
  };
  asks: { title: string; items: string[] };
}
