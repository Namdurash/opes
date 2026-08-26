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
import { CardsRepository } from '../../../models/cards';
import { TransactionsRepository } from '../../../models/transactions';
import { MONOBANK_UNAUTHORIZED_MESSAGE } from '../../../services/monobank';
import { clearMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { monobankAccountSelectionService } from '../../../services/monobank/MonobankAccountSelectionService';
import { resetSandboxEnvironment } from '../../../services/sandbox';
import { useTransactionsStore } from '../../transactions/state/useTransactionsStore';
import { useMonobankStore } from './useMonobankStore';

const config = Config as Record<string, string | undefined>;

const USER_ID = 'user-1';
const TEST_TOKEN = 'test-user-1';

type SyncAction = ReturnType<typeof useTransactionsStore.getState>['syncFromMonobank'];

const originalFetch = global.fetch;

let cardsRepository: CardsRepository;
let transactionsRepository: TransactionsRepository;
let teardown: () => Promise<void>;
let fetchSpy: jest.Mock;
let realSyncFromMonobank: SyncAction;
let triggeredSync: Promise<void>;

beforeEach(async () => {
  const testDatabase = createTestDatabase();
  mockDatabase = testDatabase.database;
  teardown = testDatabase.teardown;

  // Read-side handles for the assertions. The store's own repositories are separate
  // instances, but they all reach the one throwaway database above.
  cardsRepository = new CardsRepository();
  transactionsRepository = new TransactionsRepository();

  fetchSpy = jest.fn(() => Promise.reject(new Error('fetch was called')));
  global.fetch = fetchSpy as unknown as typeof fetch;

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

  // connect() fires its sync and deliberately does not await it — that fire-and-forget
  // shape is the product's, and it stays. Wrap the store's own action to keep the
  // promise connect throws away: the REAL sync still runs and still writes the
  // database, so "settles together with the sync it triggers" becomes an await rather
  // than a guess about how many microtasks are enough.
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
  // every case below connects, and a connect that writes the token asynchronously
  // is only isolated from the previous case if the clear this hook performs can be
  // awaited to completion. Pinned in the hook rather than in a case of its own
  // because every case here rests on it.
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

const connect = async (token: string): Promise<void> => {
  await useMonobankStore.getState().connect(USER_ID, token);
  await triggeredSync;
};

describe('useMonobankStore.connect in a sandbox build', () => {
  it('AC-003 — reports the production 401 text for a token that is not a test user', async () => {
    config.OPES_ENV = 'sandbox';

    await connect('uKqRr3fLxYt0');

    // The text is pinned twice over. Once to its literal, character for character
    // including the full stop — this is the string the real 401 branch of api.ts
    // inlines today, and extracting it must not change it. Once to the store, so the
    // sandbox build shows exactly what the production build shows and no separate
    // "test mode" message can grow beside it.
    expect(MONOBANK_UNAUTHORIZED_MESSAGE).toBe('Invalid or missing Monobank token.');
    expect(useMonobankStore.getState().errorMessage).toBe(MONOBANK_UNAUTHORIZED_MESSAGE);
  });

  it('AC-004 — connects on a test token surrounded by whitespace', async () => {
    config.OPES_ENV = 'sandbox';

    await connect('  test-user-1  ');

    // Trimming stays in connect(); the fake compares exactly. Both halves have to
    // hold for this to be 'connected'.
    expect(useMonobankStore.getState().status).toBe('connected');
  });

  it('AC-005 — makes no fetch call at all, connect and its sync together', async () => {
    config.OPES_ENV = 'sandbox';

    await connect(TEST_TOKEN);

    // A connect that failed would report zero fetches too, and for the wrong reason.
    // Say first that the whole path ran.
    expect(useMonobankStore.getState().status).toBe('connected');
    expect(await transactionsRepository.getAll()).not.toHaveLength(0);

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('AC-006 — creates one Monobank card in an empty database', async () => {
    config.OPES_ENV = 'sandbox';
    expect(await cardsRepository.getMonobankCards(USER_ID)).toHaveLength(0);

    await connect(TEST_TOKEN);

    // The card comes from the production upsertMonobankCards path, fed by the fake's
    // one-account client-info fixture — the fake creates no card of its own.
    expect(await cardsRepository.getMonobankCards(USER_ID)).toHaveLength(1);
  });

  it('AC-007 — writes every fixture transaction through the production sync', async () => {
    config.OPES_ENV = 'sandbox';
    expect(await transactionsRepository.getAll()).toHaveLength(0);

    await connect(TEST_TOKEN);

    expect(await transactionsRepository.getAll()).toHaveLength(44);
  });

  it('AC-015 — refills the database after a sandbox reset empties it', async () => {
    config.OPES_ENV = 'sandbox';

    await connect(TEST_TOKEN);
    expect(await transactionsRepository.getAll()).toHaveLength(44);

    await resetSandboxEnvironment();
    expect(await transactionsRepository.getAll()).toHaveLength(0);

    // Nothing is cleared between the two connects but the reset itself: the fake keeps
    // no state, so a second connect has to reach the same place as the first.
    await connect(TEST_TOKEN);

    expect(await transactionsRepository.getAll()).toHaveLength(44);
  });
});
