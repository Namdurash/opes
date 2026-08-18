import type { NormalizedTransaction, RawTransaction } from './types';
import Transactions from './fixtures/mock_transactions.json';

/**
 * Returns expenses (outflows) from the MOCK dataset that fall within the given
 * date range, normalized to major UAH units. This is the dev/eval data source;
 * wiring real DB/Monobank data is a separate task.
 */
export const fetchInRange = async (
  startDate: string,
  endDate: string,
): Promise<NormalizedTransaction[]> => {
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
};
