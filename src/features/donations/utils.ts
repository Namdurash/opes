import type { Transaction } from '../../domain/transactions';

export interface DonationStats {
  /** Sum of donation magnitudes (donations are outflows, stored negative). */
  total: number;
  count: number;
  /** Mean donation magnitude, or 0 when there are no donations. */
  average: number;
}

export const computeDonationStats = (donations: Transaction[]): DonationStats => {
  const total = donations.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const count = donations.length;
  const average = count > 0 ? total / count : 0;

  return { total, count, average };
};
