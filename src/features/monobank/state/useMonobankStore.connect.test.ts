/**
 * OPES-64 — which sheet `connect` raises is decided by the step that failed.
 *
 * `connect` runs two failable steps through one catch today: the Monobank API call
 * and the local `save`. AS-003 separates them by the step rather than by the class
 * of the thrown error — a rejecting local `save` raises the general sheet, and
 * everything coming out of the API keeps "Connection Failed", a `TypeError`
 * included. AC-018 and AC-019 are regression guards on that second half: they hold
 * today and must still hold once the save branch is split out.
 *
 * Same two departures from the sibling suite as the disconnect file (D-014):
 * `src/shared/ui/bottom-sheet` is deliberately NOT mocked, because AC-017 reads the
 * sheet off `useBottomSheetStore.getState().config` and a `jest.fn()` double never
 * writes it (D-015); and the database singleton is a bare object, because no
 * criterion here reaches a repository call (D-018).
 *
 * The sheet is only ever observed as a config object, never as rendered output
 * (VG-003), and the save failure is injected as a rejected promise from a double —
 * nothing here establishes that a real Keychain write ever fails (VG-002).
 *
 * ---
 *
 * OPES-68 adds the last describe: reconnecting the same account picks the surviving
 * card back up rather than adding a second one.
 *
 * That is the other half of "disconnect deletes nothing" — a row left behind is only
 * a kindness if reconnecting adopts it, and a second card for the same account would
 * split one account's history into two strips on Home. The criterion is a count of
 * ROWS, so it runs against a real throwaway database rather than a stand-in object,
 * and it is expected to be GREEN the day it is written: `upsertMonobankCards`
 * already matches on `monobank_account_id`, and OPES-68 leaves it alone (D-010). It
 * is the regression guard that makes the claim falsifiable, not work to be done.
 *
 * Its honest limit is VG-002: the account comes from a doubled Monobank service, so
 * nothing here establishes that a real account comes back from the live API with the
 * same id after a disconnect.
 */
import type { Database } from '@nozbe/watermelondb';
import type { MonobankClientInfo } from '../../../services/monobank';
import type { MonobankAccount } from '../../../services/monobank/types';
import { createTestDatabase } from '../../../../test/db';

/**
 * The database singleton is a getter so the two halves of this file can disagree
 * about it: every OPES-64 case keeps the bare stand-in it has always had (no
 * criterion there reaches a repository call, and a live LokiJS instance brings a
 * 500 ms autosave that outlives the suite), while the OPES-68 case that counts rows
 * swaps in a real throwaway database for the length of its case.
 *
 * `var`, not `let`: the jest.mock factory is hoisted above this declaration, and
 * jest only lets a factory close over names beginning with `mock`.
 */
var mockDatabase: Database;

jest.mock('../../../services/database/database', () => ({
  get database() {
    return mockDatabase;
  },
}));

/** What the singleton is for every case that never reaches a repository. */
const NO_DATABASE = {} as Database;

// `var`, not `let`: the jest.mock factory below is hoisted above this declaration,
// and a factory may only close over a name that already exists at that point.
var mockGetClientInfo: jest.Mock<Promise<MonobankClientInfo>, []>;

jest.mock('../../../services/monobank/serviceInstance', () => ({
  getMonobankService: () => ({
    getClientInfo: mockGetClientInfo,
    getStatements: jest.fn(),
  }),
  clearMonobankService: jest.fn(),
}));

import { MonobankError } from '../../../services/monobank';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import { CardsRepository } from '../../../models/cards';
import { useTransactionsStore } from '../../transactions/state/useTransactionsStore';
import { useMonobankStore } from './useMonobankStore';

type SyncAction = ReturnType<typeof useTransactionsStore.getState>['syncFromMonobank'];

const USER_ID = 'user-1';
const TOKEN = 'uKqRr3fLxYt0';

const CLIENT_INFO: MonobankClientInfo = {
  clientId: 'client-1',
  name: 'Ada',
  accounts: [],
};

const realSyncFromMonobank: SyncAction =
  useTransactionsStore.getState().syncFromMonobank;

let saveSpy: jest.SpyInstance<Promise<void>, [string, string]>;

beforeEach(() => {
  jest.clearAllMocks();

  mockDatabase = NO_DATABASE;
  useBottomSheetStore.setState({ visible: false, config: null });
  useMonobankStore.setState({
    status: 'idle',
    clientName: null,
    errorMessage: null,
    accounts: [],
    selectedAccountIds: null,
  });

  // The default is the happy path for both steps; each case below breaks exactly
  // the one step its `given` names.
  mockGetClientInfo = jest.fn(async () => CLIENT_INFO);
  saveSpy = jest.spyOn(monobankTokenService, 'save').mockResolvedValue(undefined);

  // connect fires its sync and deliberately does not await it. No criterion here
  // reaches that line — every case fails before it — but a fire-and-forget promise
  // outliving the case is worth not having.
  useTransactionsStore.setState({ syncFromMonobank: jest.fn(async () => {}) });
});

afterEach(() => {
  jest.restoreAllMocks();
  useTransactionsStore.setState({ syncFromMonobank: realSyncFromMonobank });
});

describe('useMonobankStore.connect when saving the token rejects', () => {
  beforeEach(() => {
    saveSpy.mockRejectedValue(new Error('Keychain write failed'));
  });

  it('AC-017 — raises the general error sheet, not "Connection Failed"', async () => {
    await useMonobankStore.getState().connect(USER_ID, TOKEN);

    // The API call resolved — the connection is fine and saying otherwise would be
    // a lie about what broke. What failed is the local write.
    expect(mockGetClientInfo).toHaveBeenCalledTimes(1);
    expect(useBottomSheetStore.getState().config?.title).toBe('Something went wrong');
  });

  it('AC-020 — puts the store in the error status', async () => {
    await useMonobankStore.getState().connect(USER_ID, TOKEN);

    // AS-004: this branch keeps writing the state it writes today — only the sheet
    // it raises changes. Leaving the store at `connecting` after a save that will
    // never complete is the alternative, and it is worse.
    expect(useMonobankStore.getState().status).toBe('error');
  });
});

describe('useMonobankStore.connect when the Monobank API rejects', () => {
  it('AC-018 — keeps "Connection Failed" for a MonobankError', async () => {
    mockGetClientInfo.mockRejectedValue(
      new MonobankError('NETWORK_ERROR', 'Network request failed.'),
    );

    await useMonobankStore.getState().connect(USER_ID, TOKEN);

    expect(saveSpy).toHaveBeenCalledTimes(0);
    expect(useBottomSheetStore.getState().config?.title).toBe('Connection Failed');
  });

  it('AC-019 — keeps "Connection Failed" for an error that is not a MonobankError', async () => {
    const notAMonobankError = new TypeError('Cannot read properties of undefined');
    // The `given` in full: the sheet is chosen by the step that failed, never by
    // the class of the error, so routing every non-MonobankError to the general
    // sheet would silently move today's network-failure copy off "Connection
    // Failed".
    expect(notAMonobankError).not.toBeInstanceOf(MonobankError);
    mockGetClientInfo.mockRejectedValue(notAMonobankError);

    await useMonobankStore.getState().connect(USER_ID, TOKEN);

    expect(saveSpy).toHaveBeenCalledTimes(0);
    expect(useBottomSheetStore.getState().config?.title).toBe('Connection Failed');
  });
});

/**
 * OPES-68 AC-013 — reconnecting account A adopts the card account A left behind.
 *
 * The `given` is the state disconnect leaves: the card is still in the database,
 * carrying `monobank_account_id = acc-1` and whatever balance it last synced.
 */
const ACCOUNT_A: MonobankAccount = {
  id: 'acc-1',
  sendId: 'send-1',
  balance: 1200,
  creditLimit: 0,
  type: 'black',
  currencyCode: 980,
  currencySymbol: '₴',
  maskedPan: ['537541******1234'],
  iban: 'UA000000000000000000000000000',
};

/** What the API returns on the reconnect: the same account, same id. */
const CLIENT_INFO_WITH_ACCOUNT_A: MonobankClientInfo = {
  ...CLIENT_INFO,
  accounts: [ACCOUNT_A],
};

describe('useMonobankStore.connect reconnecting the account a disconnect left behind', () => {
  let cardsRepository: CardsRepository;
  let survivingCardId: string;
  let teardown: () => Promise<void>;

  const cardsForAccountA = async (): Promise<string[]> => {
    const cards = await cardsRepository.getMonobankCards(USER_ID);

    return cards.filter(card => card.monobankAccountId === ACCOUNT_A.id).map(card => card.id);
  };

  beforeEach(async () => {
    const testDatabase = createTestDatabase();
    mockDatabase = testDatabase.database;
    teardown = testDatabase.teardown;

    cardsRepository = new CardsRepository();

    // Written by the same method `connect` writes through, so the surviving row is
    // the row a previous connect would actually have left.
    const [survivor] = await cardsRepository.upsertMonobankCards(USER_ID, [ACCOUNT_A]);
    survivingCardId = survivor.id;

    mockGetClientInfo = jest.fn(async () => CLIENT_INFO_WITH_ACCOUNT_A);
  });

  afterEach(async () => {
    await teardown();
  });

  it('AC-013 — leaves one card for the account instead of adding a second', async () => {
    // The precondition spelled out: exactly one row carries this account id going
    // in, so the one coming out is an adoption rather than a table that was empty.
    expect(await cardsForAccountA()).toHaveLength(1);

    await useMonobankStore.getState().connect(USER_ID, TOKEN);

    expect(useMonobankStore.getState().status).toBe('connected');
    expect(await cardsForAccountA()).toHaveLength(1);

    // …and it is the SAME row. A connect that destroyed the survivor and created a
    // replacement would also leave one card, while orphaning every transaction that
    // pointed at the old id — the continuous history is the whole point.
    expect(await cardsForAccountA()).toEqual([survivingCardId]);
  });
});
