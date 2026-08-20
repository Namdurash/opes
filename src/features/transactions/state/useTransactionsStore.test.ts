import type { Card } from '../../../domain/cards';
import type { Transaction } from '../../../domain/transactions';

// Test knobs. The store news up both repositories at module scope, so those modules
// are the only seam this case has. Held on hoisted `var`s so the hoisted jest.mock
// factories can read them at call time.
var mockGetMonobankCards: jest.Mock;
var mockGetAll: jest.Mock;
var mockGetLatestOccurredAt: jest.Mock;
var mockUpsertBatch: jest.Mock;

// The methods forward rather than the constructors returning the doubles: the store's
// repositories are constructed at import time, long before beforeEach assigns
// anything. TransactionSyncService itself is left real — it is the code that would
// reach for a statement, and the criterion is that it never gets there.
jest.mock('../../../models/cards', () => ({
  CardsRepository: class {
    getMonobankCards(userId: string): Promise<Card[]> {
      return mockGetMonobankCards(userId);
    }
  },
}));

jest.mock('../../../models/transactions', () => ({
  TransactionsRepository: class {
    getAll(): Promise<Transaction[]> {
      return mockGetAll();
    }
    getLatestOccurredAt(cardId: string): Promise<string | null> {
      return mockGetLatestOccurredAt(cardId);
    }
    upsertBatch(transactions: Transaction[]): Promise<void> {
      return mockUpsertBatch(transactions);
    }
  },
}));

jest.mock('../../../shared/ui/bottom-sheet', () => ({
  showBottomSheet: jest.fn(),
  showErrorBottomSheet: jest.fn(),
}));

// Nothing here should reach WatermelonDB, and merely importing the singleton opens a
// real Loki instance whose autosave interval outlives the run. Refuse to hand it out,
// so a case that starts depending on it says so loudly.
jest.mock('../../../services/database/database', () => ({
  get database(): never {
    throw new Error(
      'useTransactionsStore tests stub their repositories; the real database must not be used',
    );
  },
}));

import Config from 'react-native-config';
import { clearMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { monobankAccountSelectionService } from '../../../services/monobank/MonobankAccountSelectionService';
import { makeCard } from '../../../../test/factories';
import { useTransactionsStore } from './useTransactionsStore';

const config = Config as Record<string, string | undefined>;

const originalFetch = global.fetch;
let fetchSpy: jest.Mock;

beforeEach(() => {
  // One linked Monobank card, so that a sync which is NOT blocked has an account to
  // pull a statement for. Without it the zero below would hold for the wrong reason.
  mockGetMonobankCards = jest.fn().mockResolvedValue([
    makeCard({ id: 'card-1', type: 'monobank', monobankAccountId: 'acc-1' }),
  ]);
  mockGetAll = jest.fn().mockResolvedValue([]);
  mockGetLatestOccurredAt = jest.fn().mockResolvedValue(null);
  mockUpsertBatch = jest.fn().mockResolvedValue(undefined);

  fetchSpy = jest.fn(() => Promise.reject(new Error('fetch was called')));
  global.fetch = fetchSpy as unknown as typeof fetch;

  clearMonobankService();
  monobankTokenService.clear();
  monobankAccountSelectionService.clear();
  useTransactionsStore.getState().reset();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete config.OPES_ENV;
  clearMonobankService();
  monobankTokenService.clear();
  monobankAccountSelectionService.clear();
});

describe('useTransactionsStore.syncFromMonobank', () => {
  it('AC-005 — makes no fetch call at all in a sandbox build', async () => {
    config.OPES_ENV = 'sandbox';
    monobankTokenService.save('token-sandbox', 'Test Client');

    // syncFromMonobank returns early when the storage holds no token, so without
    // this the zero below would be true for the wrong reason. The criterion is that
    // the call does not exist, not that a token fails.
    expect(monobankTokenService.get()?.token).toBe('token-sandbox');

    await useTransactionsStore.getState().syncFromMonobank('user-1');

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });
});
