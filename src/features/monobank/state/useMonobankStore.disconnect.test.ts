/**
 * OPES-64 — a failed disconnect is visible, and changes nothing.
 *
 * `disconnect` awaits `monobankTokenService.clear()` with no try/catch, so a
 * rejecting clear becomes an unhandled rejection: the user presses Disconnect,
 * nothing moves, and nothing tells them the token is still on disk. What follows
 * pins both halves of the fix — the five store fields and the three tear-down side
 * effects on the failing path, and the sheet the failure raises.
 *
 * Two deliberate departures from the sibling suite (useMonobankStore.test.ts, whose
 * inherited OPES-58 cases are green and reuse these very AC ids for other
 * behaviour — see D-014):
 *
 *   - `src/shared/ui/bottom-sheet` is NOT mocked. AC-011 reads the sheet off
 *     `useBottomSheetStore.getState().config`, which the `jest.fn()` double the
 *     sibling suite installs never writes: mocking the barrel would make the sheet
 *     criterion unobservable while still passing (D-015). The real barrel loads
 *     under jest — App.test.tsx already renders GlobalBottomSheet through it.
 *   - No test database. Importing the store pulls in CardsRepository and the
 *     database barrel, which opens a live LokiJS instance with a 500 ms autosave
 *     that outlives the suite; no criterion here reaches a repository call, so the
 *     singleton is a bare object (D-018).
 *
 * The failure is injected as a rejected promise from a double, and every criterion
 * runs against a doubled MonobankTokenService. So nothing here establishes that a
 * real Keychain delete ever fails (VG-002), that a resolved clear actually removed
 * the secret on a device (VG-001), or that the sheet is something a user can see
 * (VG-003). Those are device checks.
 */
import { makeCard } from '../../../../test/factories';

jest.mock('../../../services/database/database', () => ({ database: {} }));

// The store imports `clearMonobankService` as a named binding and offers no seam,
// so counting it means replacing the module it comes from (D-017).
jest.mock('../../../services/monobank/serviceInstance', () => ({
  getMonobankService: jest.fn(),
  clearMonobankService: jest.fn(),
}));

import { clearMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { monobankAccountSelectionService } from '../../../services/monobank/MonobankAccountSelectionService';
import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import { useTransactionsStore } from '../../transactions/state/useTransactionsStore';
import { useMonobankStore } from './useMonobankStore';

type ResetAction = ReturnType<typeof useTransactionsStore.getState>['reset'];

const realReset: ResetAction = useTransactionsStore.getState().reset;

let resetTransactions: jest.Mock;
let selectionClearSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();

  useBottomSheetStore.setState({ visible: false, config: null });

  // The `given` shared by AC-003 to AC-016: a connected store with one account, an
  // explicit selection and an error message already on it. Each field is spelled
  // out because each is asserted separately below — a half-reset that keeps the
  // status but drops the client name is exactly the state this ticket rules out.
  useMonobankStore.setState({
    status: 'connected',
    clientName: 'Ada',
    errorMessage: 'prior-message',
    accounts: [makeCard({ id: 'card-1', monobankAccountId: 'acc-1' })],
    selectedAccountIds: ['acc-1'],
  });

  resetTransactions = jest.fn();
  useTransactionsStore.setState({ reset: resetTransactions });

  selectionClearSpy = jest.spyOn(monobankAccountSelectionService, 'clear');
});

afterEach(() => {
  jest.restoreAllMocks();
  useTransactionsStore.setState({ reset: realReset });
});

/** Runs disconnect and hands back how it settled, asserting nothing about it. */
const settleDisconnect = async (): Promise<PromiseSettledResult<void>> => {
  const [outcome] = await Promise.allSettled([
    useMonobankStore.getState().disconnect(),
  ]);

  return outcome;
};

/**
 * The `when` of AC-003 to AC-010 and AC-013 to AC-016, in full: "disconnect() is
 * awaited to completion". Today `disconnect` has no catch, so a rejecting clear
 * hands the caller a rejected promise and there is no completion to observe — and
 * on that path the five fields below are untouched only because the function blew
 * up, which is not the same claim as "it finished and changed nothing". Asserting
 * the settlement is what separates those two, and what keeps the eight failure-path
 * cases from passing today for a reason this ticket exists to remove.
 *
 * AC-011 and AC-012 have observables of their own and use `settleDisconnect`
 * directly, so their failure names the sheet and the settlement rather than this.
 */
const disconnectToCompletion = async (): Promise<void> => {
  const outcome = await settleDisconnect();

  expect(outcome.status).toBe('fulfilled');
};

describe('useMonobankStore.disconnect when clearing the token rejects', () => {
  beforeEach(() => {
    jest
      .spyOn(monobankTokenService, 'clear')
      .mockRejectedValue(new Error('Keychain delete failed'));
  });

  it('AC-003 — leaves the status at connected', async () => {
    await disconnectToCompletion();

    expect(useMonobankStore.getState().status).toBe('connected');
  });

  it('AC-004 — keeps the client name', async () => {
    await disconnectToCompletion();

    expect(useMonobankStore.getState().clientName).toBe('Ada');
  });

  it('AC-005 — keeps the error message that was already there', async () => {
    await disconnectToCompletion();

    // Not "clears it", and not "replaces it with a disconnect failure": the failing
    // path issues no set() at all, so whatever was on the store stays on it.
    expect(useMonobankStore.getState().errorMessage).toBe('prior-message');
  });

  it('AC-006 — keeps the linked accounts', async () => {
    await disconnectToCompletion();

    expect(useMonobankStore.getState().accounts).toHaveLength(1);
  });

  it('AC-007 — keeps the account selection', async () => {
    await disconnectToCompletion();

    expect(useMonobankStore.getState().selectedAccountIds).toContain('acc-1');
  });

  it('AC-008 — does not clear the cached Monobank service', async () => {
    await disconnectToCompletion();

    expect(clearMonobankService).toHaveBeenCalledTimes(0);
  });

  it('AC-009 — does not clear the account selection', async () => {
    await disconnectToCompletion();

    expect(selectionClearSpy).toHaveBeenCalledTimes(0);
  });

  it('AC-010 — does not reset the transactions store', async () => {
    await disconnectToCompletion();

    expect(resetTransactions).toHaveBeenCalledTimes(0);
  });

  it('AC-011 — raises the general error sheet', async () => {
    await settleDisconnect();

    // The general sheet, not the network-flavoured "Connection Failed" — a local
    // write that failed does not deserve copy about the connection. Today nothing
    // is raised at all, which is the whole complaint: the user presses Disconnect,
    // nothing moves, and nothing says the token is still on disk.
    expect(useBottomSheetStore.getState().config?.title).toBe('Something went wrong');
  });

  it('AC-012 — resolves rather than rejecting', async () => {
    const outcome = await settleDisconnect();

    // The Disconnect button hands the action straight to onPress with no wrapper,
    // so a rejection here is an unhandled rejection in the app, not an error the
    // screen reports.
    expect(outcome.status).toBe('fulfilled');
  });
});

describe('useMonobankStore.disconnect when clearing the token resolves', () => {
  beforeEach(() => {
    jest.spyOn(monobankTokenService, 'clear').mockResolvedValue(undefined);
  });

  it('AC-013 — moves the status to idle', async () => {
    await disconnectToCompletion();

    expect(useMonobankStore.getState().status).toBe('idle');
  });

  it('AC-014 — clears the cached Monobank service', async () => {
    await disconnectToCompletion();

    expect(clearMonobankService).toHaveBeenCalledTimes(1);
  });

  it('AC-015 — clears the account selection', async () => {
    await disconnectToCompletion();

    expect(selectionClearSpy).toHaveBeenCalledTimes(1);
  });

  it('AC-016 — resets the transactions store', async () => {
    await disconnectToCompletion();

    expect(resetTransactions).toHaveBeenCalledTimes(1);
  });
});
