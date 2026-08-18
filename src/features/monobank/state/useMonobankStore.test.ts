import type { Card } from '../../../domain/cards';
import type { MonobankAccount } from '../../../services/monobank/types';

// Test knobs. The store news up its repository and reaches its sibling store at
// module scope, so those modules are the only seam these cases have. Held on hoisted
// `var`s so the hoisted jest.mock factories can read them at call time.
var mockUpsertMonobankCards: jest.Mock;
var mockGetMonobankCards: jest.Mock;
var mockSyncFromMonobank: jest.Mock;

// The methods forward rather than the constructor returning the double: the store's
// repository is constructed at import time, long before beforeEach assigns anything.
jest.mock('../../../models/cards', () => ({
  CardsRepository: class {
    upsertMonobankCards(userId: string, accounts: MonobankAccount[]): Promise<Card[]> {
      return mockUpsertMonobankCards(userId, accounts);
    }
    getMonobankCards(userId: string): Promise<Card[]> {
      return mockGetMonobankCards(userId);
    }
  },
}));

// connect() kicks off a sync on success. That trigger has its own criterion in
// useTransactionsStore.test.ts; here it is a knob, so a second HTTP path cannot
// muddy a call count these cases read as evidence.
jest.mock('../../transactions/state/useTransactionsStore', () => ({
  useTransactionsStore: {
    getState: () => ({ syncFromMonobank: mockSyncFromMonobank, reset: jest.fn() }),
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
      'useMonobankStore tests stub their repository; the real database must not be used',
    );
  },
}));

import Config from 'react-native-config';
import { isSandboxBuild } from '../../../shared/env';
import { clearMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { useMonobankStore } from './useMonobankStore';

const config = Config as Record<string, string | undefined>;

const CLIENT_INFO = {
  clientId: 'client-1',
  name: 'Test Client',
  webHookUrl: '',
  permissions: 'psfj',
  accounts: [],
  jars: [],
};

const originalFetch = global.fetch;
let fetchSpy: jest.Mock;

beforeEach(() => {
  mockUpsertMonobankCards = jest.fn().mockResolvedValue([]);
  mockGetMonobankCards = jest.fn().mockResolvedValue([]);
  mockSyncFromMonobank = jest.fn().mockResolvedValue(undefined);

  fetchSpy = jest.fn(() => Promise.reject(new Error('fetch was called')));
  global.fetch = fetchSpy as unknown as typeof fetch;

  // The service is cached per token and carries the rate limiter with it; without
  // this the second case would be refused before it could reach the HTTP boundary.
  clearMonobankService();
  monobankTokenService.clear();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete config.OPES_ENV;
  clearMonobankService();
  monobankTokenService.clear();
});

describe('useMonobankStore.connect', () => {
  it('AC-004 — makes no fetch call at all in a sandbox build', async () => {
    config.OPES_ENV = 'sandbox';

    await useMonobankStore.getState().connect('user-1', 'token-sandbox');

    // Not "the token was rejected", not "the request failed" — the criterion is that
    // the call does not exist. Zero, at the HTTP boundary.
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('AC-006 — reaches the Monobank host in a normal build', async () => {
    delete config.OPES_ENV;
    // The criterion's precondition is a NON-sandbox build. Until the flag exists
    // there is no such thing as a build here at all, so the precondition is
    // established through the product's own seam rather than assumed.
    expect(isSandboxBuild?.()).toBe(false);

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(CLIENT_INFO),
    });

    await useMonobankStore.getState().connect('user-1', 'token-normal');

    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('api.monobank.ua');
  });
});
