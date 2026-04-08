export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  occurredAtIso: string;
  cardId: string;
  mcc: number;
  currencyCode: number;
  currencySymbol: string;
  balance: number;
  hold: boolean;
  comment: string | null;
}
