import type { Card } from '../../src/domain/cards';

/**
 * A complete domain `Card`, with only what a test cares about spelled out.
 *
 * The point is the 16th field: when `Card` grows one, this default moves with it
 * and no test needs touching. Hand-written literals in the suites did not have
 * that property — they had to be edited one by one.
 */
export const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-1',
  userId: 'user-1',
  title: 'Test',
  moneyAmount: 100,
  type: 'storage',
  image: null,
  createdAt: 1,
  sortOrder: 0,
  monobankAccountId: null,
  currencyCode: null,
  currencySymbol: null,
  iban: null,
  maskedPan: null,
  creditLimit: null,
  monobankBalance: null,
  ...overrides,
});
