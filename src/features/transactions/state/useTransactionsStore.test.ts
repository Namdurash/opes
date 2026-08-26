import type { Database } from '@nozbe/watermelondb';
import { createTestDatabase } from '../../../../test/db';

// The repositories reach WatermelonDB through a module singleton rather than an
// injected handle, so the only way to point them at a throwaway database is to
// replace that module. The barrel is left alone — it also re-exports the schema and
// model classes the test helper itself needs.
//
// `var`, not `let`: the jest.mock factory is hoisted above this declaration.
var mockDatabase: Database;

jest.mock('../../../services/database/database', () => ({
  get database() {
    return mockDatabase;
  },
}));

jest.mock('../../../shared/ui/bottom-sheet', () => ({
  showBottomSheet: jest.fn(),
  showErrorBottomSheet: jest.fn(),
}));

import Config from 'react-native-config';
import { TransactionsRepository } from '../../../models/transactions';
import { clearMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { monobankAccountSelectionService } from '../../../services/monobank/MonobankAccountSelectionService';
import { useMonobankStore } from '../../monobank/state/useMonobankStore';
import { useTransactionsStore } from './useTransactionsStore';

const config = Config as Record<string, string | undefined>;

const USER_ID = 'user-1';
const TEST_TOKEN = 'test-user-1';

type SyncAction = ReturnType<typeof useTransactionsStore.getState>['syncFromMonobank'];

const originalFetch = global.fetch;

let transactionsRepository: TransactionsRepository;
let teardown: () => Promise<void>;
let realSyncFromMonobank: SyncAction;
let triggeredSync: Promise<void>;

beforeEach(async () => {
  const testDatabase = createTestDatabase();
  mockDatabase = testDatabase.database;
  teardown = testDatabase.teardown;
  transactionsRepository = new TransactionsRepository();

  global.fetch = jest.fn(() =>
    Promise.reject(new Error('fetch was called')),
  ) as unknown as typeof fetch;

  clearMonobankService();
  monobankAccountSelectionService.clear();
  useTransactionsStore.getState().reset();
  useMonobankStore.setState({
    status: 'idle',
    clientName: null,
    errorMessage: null,
    accounts: [],
    selectedAccountIds: null,
  });

  // connect() fires its sync and deliberately does not await it. Wrap the store's own
  // action to keep the promise connect throws away — the REAL sync still runs, so the
  // "already filled the database" precondition can be awaited rather than guessed at.
  triggeredSync = Promise.resolve();
  realSyncFromMonobank = useTransactionsStore.getState().syncFromMonobank;
  useTransactionsStore.setState({
    syncFromMonobank: (userId, options) => {
      triggeredSync = realSyncFromMonobank(userId, options);
      return triggeredSync;
    },
  });

  // OPES-58 — the token service's storage moves behind the encrypted secret store
  // and its three methods become promise-returning. This hook is where that lands:
  // syncFromMonobank reads the credentials back through get(), so the store this
  // hook empties is the one the cases below depend on being empty — and awaiting a
  // synchronous `void` guarantees no such thing. Pinned in the hook rather than in
  // a case of its own because every case here rests on it.
  const cleared = monobankTokenService.clear();
  expect(cleared).toBeInstanceOf(Promise);
  await cleared;
});

afterEach(async () => {
  useTransactionsStore.setState({ syncFromMonobank: realSyncFromMonobank });
  global.fetch = originalFetch;
  delete config.OPES_ENV;
  clearMonobankService();
  await monobankTokenService.clear();
  monobankAccountSelectionService.clear();
  await teardown();
});

/** The criteria's given: a sandbox connect that has already filled the database. */
const connectAndFill = async (): Promise<void> => {
  config.OPES_ENV = 'sandbox';
  await useMonobankStore.getState().connect(USER_ID, TEST_TOKEN);
  await triggeredSync;

  // Stated as a precondition, not assumed: a second sync over an empty database would
  // satisfy both criteria below for reasons that have nothing to do with them.
  expect(await transactionsRepository.getAll()).toHaveLength(44);
};

describe('useTransactionsStore.syncFromMonobank run a second time', () => {
  it('AC-013 — updates the existing rows instead of adding a second copy', async () => {
    await connectAndFill();

    await useTransactionsStore.getState().syncFromMonobank(USER_ID);

    // Statement ids are fixed literals, so upsertBatch has rows to update. A fake
    // whose ids moved with the clock would leave 88 here.
    expect(await transactionsRepository.getAll()).toHaveLength(44);
  });

  it('AC-014 — settles back to idle rather than to an error', async () => {
    await connectAndFill();

    await useTransactionsStore.getState().syncFromMonobank(USER_ID);

    // The fake carries no rate limiter, so the second sync is not refused the way a
    // real one-request-per-60s endpoint would refuse it.
    expect(useTransactionsStore.getState().syncStatus).toBe('idle');
  });
});
