export interface NormalizedTransaction {
  description: string;
  amount: number;
  mcc: number;
  date: string;
}

export interface RawTransaction {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc: number;
  hold: boolean;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
}
