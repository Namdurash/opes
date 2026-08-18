import { computeDonationStats } from './utils';
import type { Transaction } from '../../domain/transactions';
import { makeTransaction } from '../../../test/factories';

// Only what this suite asserts on differs from the shared default.
const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  makeTransaction({ title: 'Донат ЗСУ', mcc: 4829, ...overrides });

describe('computeDonationStats', () => {
  it('returns zeroes for an empty list', () => {
    expect(computeDonationStats([])).toEqual({ total: 0, count: 0, average: 0 });
  });

  it('sums magnitudes and averages over donations (outflows are negative)', () => {
    const donations = [
      makeTx({ id: 'a', amount: -100 }),
      makeTx({ id: 'b', amount: -200 }),
      makeTx({ id: 'c', amount: -300 }),
    ];

    expect(computeDonationStats(donations)).toEqual({
      total: 600,
      count: 3,
      average: 200,
    });
  });
});
