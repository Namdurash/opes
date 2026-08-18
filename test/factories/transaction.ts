import type { Transaction } from '../../src/domain/transactions';

/**
 * A complete domain `Transaction`, with only what a test cares about spelled out.
 *
 * Replaces three near-identical `makeTx` helpers that had drifted apart in the
 * donations, settings and transactions-view-model suites. Call sites that relied
 * on their old defaults pass them explicitly, so what each test asserts on is
 * visible in the test rather than in a helper three files away.
 */
export const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  title: 'Transaction',
  amount: -100,
  type: 'expense',
  occurredAtIso: '2026-05-01T10:00:00.000Z',
  cardId: 'card-1',
  mcc: 5411,
  currencyCode: 980,
  currencySymbol: 'UAH',
  balance: 0,
  hold: false,
  comment: null,
  ...overrides,
});
