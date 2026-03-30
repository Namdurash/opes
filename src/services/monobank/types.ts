// ─── Raw API Response Types ────────────────────────────────────────────────

export interface MonobankRawAccount {
  id: string;
  sendId: string;
  balance: number; // smallest currency unit (e.g. kopecks)
  creditLimit: number;
  type: 'black' | 'white' | 'platinum' | 'iron' | 'fop' | 'yellow' | 'eAid' | string;
  currencyCode: number; // ISO 4217 numeric
  cashbackType: string;
  maskedPan: string[];
  iban: string;
}

export interface MonobankRawJar {
  id: string;
  sendId: string;
  title: string;
  description: string;
  currencyCode: number;
  balance: number;
  goal: number;
}

export interface MonobankRawClientInfo {
  clientId: string;
  name: string;
  webHookUrl: string;
  permissions: string;
  accounts: MonobankRawAccount[];
  jars: MonobankRawJar[];
}

export interface MonobankRawStatementItem {
  id: string;
  time: number; // Unix timestamp (seconds)
  description: string;
  mcc: number;
  originalMcc: number;
  hold: boolean;
  amount: number; // smallest currency unit, negative = debit
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number; // smallest currency unit
  comment?: string;
  receiptId?: string;
  invoiceId?: string;
  counterEdrpou?: string;
  counterIban?: string;
  counterName?: string;
}

// ─── Internal / Transformed Types ─────────────────────────────────────────

export interface MonobankAccount {
  id: string;
  sendId: string;
  balance: number; // major units (e.g. UAH)
  creditLimit: number; // major units
  type: string;
  currencyCode: number;
  currencySymbol: string;
  maskedPan: string[];
  iban: string;
}

export interface MonobankClientInfo {
  clientId: string;
  name: string;
  accounts: MonobankAccount[];
}

export interface MonobankStatement {
  id: string;
  time: Date;
  description: string;
  mcc: number;
  amount: number; // major units, negative = debit
  balance: number; // major units
  currencyCode: number;
  currencySymbol: string;
  hold: boolean;
  comment?: string;
}

// ─── Error Types ───────────────────────────────────────────────────────────

export type MonobankErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class MonobankError extends Error {
  constructor(
    public readonly code: MonobankErrorCode,
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'MonobankError';
  }
}
