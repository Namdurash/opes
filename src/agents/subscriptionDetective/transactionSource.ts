import { NormalizedTransaction, RawTransaction } from './types';
import Transactions from './__mocks__/mock_transactions.json';

async function fetchInRange(
  startDate: string,
  endDate: string,
): Promise<NormalizedTransaction[]> {
  const transactions = Transactions as RawTransaction[];

  const expenses = transactions.filter(tx => tx.amount < 0);

  const normalized: NormalizedTransaction[] = expenses.map(tx => ({
    description: tx.description,
    amount: Math.abs(tx.amount) / 100,
    mcc: tx.mcc,
    date: new Date(tx.time * 1000).toISOString().split('T')[0],
  }));

  return normalized.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
  });
}

export { fetchInRange };
