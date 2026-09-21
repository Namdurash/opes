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
 */
import type { MonobankClientInfo } from '../../../services/monobank';

jest.mock('../../../services/database/database', () => ({ database: {} }));

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
