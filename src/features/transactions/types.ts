import type { Transaction } from '../../domain/transactions';

export interface TransactionSection {
  title: string;
  data: Transaction[];
}
