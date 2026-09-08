import type { AddressUpdateResponse, CivilStatusUpdateResponse, TaxResponse, TransferTaxResponse } from '@pvg/shared';

export interface Taxpayer extends TaxResponse {
  citizenId: string;
  fullName: string;
  businessName: string;
  businessType: 'natural' | 'legal';
  address: string;
}

/** Latest domicilio fiscal declared by a taxpayer (kept for the demo list; the response never echoes it). */
export interface AddressChange extends AddressUpdateResponse {
  citizenId: string;
  address: string;
  province: string;
  canton: string;
  district: string;
}

/** Impuesto de traspaso receipt (v4). */
export interface TransferTaxReceipt extends TransferTaxResponse {
  buyerId: string;
  sellerId: string;
  kind: 'vehiculo' | 'inmueble';
  reference: string;
  priceCrc: number;
  fiscalValueCrc: number;
  issuedAt: string;
}

/** Latest civil status a taxpayer reported to the RUT (v4; kept for the demo list). */
export interface CivilStatusChange extends CivilStatusUpdateResponse {
  citizenId: string;
  certificate: string;
  updatedAt: string;
}

const transferKeyOf = (kind: string, reference: string, buyerId: string) => `${kind}::${reference.trim().toUpperCase()}::${buyerId}`;

const keyOf = (citizenId: string, businessName: string) => `${citizenId}::${businessName.trim().toLowerCase()}`;

class TributacionStore {
  private taxpayers = new Map<string, Taxpayer>();
  private byNite = new Set<string>();
  private addresses = new Map<string, AddressChange>(); // keyed by citizenId
  private transferTaxes = new Map<string, TransferTaxReceipt>(); // keyed by (kind, reference, buyerId)
  private transferCounters = new Map<number, number>(); // year -> last HAC sequence
  private civilStatuses = new Map<string, CivilStatusChange>(); // keyed by citizenId

  reset(): void {
    this.taxpayers.clear();
    this.byNite.clear();
    this.addresses.clear();
    this.transferTaxes.clear();
    this.transferCounters.clear();
    this.civilStatuses.clear();
  }

  // ---- v4

  findTransferTax(kind: string, reference: string, buyerId: string): TransferTaxReceipt | undefined {
    return this.transferTaxes.get(transferKeyOf(kind, reference, buyerId));
  }

  nextTransferSequence(year: number): number {
    const next = (this.transferCounters.get(year) ?? 0) + 1;
    this.transferCounters.set(year, next);
    return next;
  }

  saveTransferTax(t: TransferTaxReceipt): TransferTaxReceipt {
    this.transferTaxes.set(transferKeyOf(t.kind, t.reference, t.buyerId), t);
    return t;
  }

  listTransferTaxes(): TransferTaxReceipt[] {
    return [...this.transferTaxes.values()];
  }

  saveCivilStatus(c: CivilStatusChange): CivilStatusChange {
    this.civilStatuses.set(c.citizenId, c);
    return c;
  }

  listCivilStatuses(): CivilStatusChange[] {
    return [...this.civilStatuses.values()];
  }

  saveAddress(a: AddressChange): AddressChange {
    this.addresses.set(a.citizenId, a);
    return a;
  }

  listAddresses(): AddressChange[] {
    return [...this.addresses.values()];
  }

  find(citizenId: string, businessName: string): Taxpayer | undefined {
    return this.taxpayers.get(keyOf(citizenId, businessName));
  }

  hasNite(nite: string): boolean {
    return this.byNite.has(nite);
  }

  save(t: Taxpayer): Taxpayer {
    this.taxpayers.set(keyOf(t.citizenId, t.businessName), t);
    this.byNite.add(t.nite);
    return t;
  }

  list(): Taxpayer[] {
    return [...this.taxpayers.values()];
  }
}

export const store = new TributacionStore();
