import { computeDonationStats } from './utils';
import type { Transaction } from '../../domain/transactions';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  title: 'Донат ЗСУ',
  amount: -100,
  type: 'expense',
  occurredAtIso: '2026-05-01T10:00:00.000Z',
  cardId: 'card-1',
  mcc: 4829,
  currencyCode: 980,
  currencySymbol: 'UAH',
  balance: 0,
  hold: false,
  comment: null,
  ...overrides,
});

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
