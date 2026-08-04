import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { Transaction } from '../../../domain/transactions';

// Test knobs. Held on a `var` (hoisted) so the hoisted jest.mock factories can
// close over it; every factory only *reads* it at render time, by which point
// the knobs below have been assigned in beforeEach.
var mockEnv: {
  transactions: Transaction[];
  params: { filter?: { categoryId?: string; month?: string } } | undefined;
  focusTick: number;
  categoryByTxId: Record<string, string>;
  loadTransactions: jest.Mock;
  syncFromMonobank: jest.Mock;
  setParams: jest.Mock;
};

// The store is a real zustand singleton wired to WatermelonDB repositories; swap
// it for a selector that reads the in-memory fixture transactions.
jest.mock('./useTransactionsStore', () => ({
  useTransactionsStore: (selector: (state: unknown) => unknown) =>
    selector({
      transactions: mockEnv.transactions,
      isLoadingFromDb: false,
      loadTransactions: mockEnv.loadTransactions,
      syncFromMonobank: mockEnv.syncFromMonobank,
    }),
}));

// Navigation: the view-model reads the incoming filter from route params and
// consumes it once per focus. useFocusEffect fires the callback whenever the
// test bumps focusTick (i.e. a fresh focus / navigation).
jest.mock('@react-navigation/native', () => {
  const react = require('react');
  return {
    useRoute: () => ({ params: mockEnv.params }),
    useNavigation: () => ({ setParams: mockEnv.setParams }),
    useFocusEffect: (cb: React.EffectCallback) =>
      react.useEffect(cb, [mockEnv.focusTick]),
  };
});

// Categorization: resolveCategories yields each transaction's category id from
// the fixture map (drives category matching); getCategoryById is identity so the
// chip label equals the active category id, letting tests read it back.
jest.mock('../../../services/categorization', () => ({
  CategorizationService: class {
    async resolveCategories(txs: Transaction[]) {
      return txs.map(t => ({
        transaction: t,
        category: {
          id: mockEnv.categoryByTxId[t.id] ?? 'other',
          label: mockEnv.categoryByTxId[t.id] ?? 'other',
        },
      }));
    }
  },
  getCategoryById: (id: string) => ({ id, label: id }),
}));

jest.mock('../../../models/userOverrides', () => ({
  UserOverridesRepository: class {},
}));
jest.mock('../../../models/merchantRules', () => ({
  MerchantRulesRepository: class {},
}));

import { useTransactionsViewModel } from './useTransactionsViewModel';

type ViewModel = ReturnType<typeof useTransactionsViewModel> & {
  filteredTransactions: Transaction[];
  categoryChipLabel: string | null;
  monthChipLabel: string | null;
  dismissCategoryFilter: () => void;
  dismissMonthFilter: () => void;
};

const makeTx = (id: string, over: Partial<Transaction> = {}): Transaction => ({
  id,
  title: id,
  amount: -100,
  type: 'expense',
  occurredAtIso: '2026-08-10T12:00:00+00:00',
  cardId: 'card-1',
  mcc: 5411,
  currencyCode: 980,
  currencySymbol: '₴',
  balance: 0,
  hold: false,
  comment: null,
  ...over,
});

const vmRef: { current: ViewModel | undefined } = { current: undefined };

const Host = (): null => {
  vmRef.current = useTransactionsViewModel() as ViewModel;
  return null;
};

let renderer: TestRenderer.ReactTestRenderer;

const renderVM = async (): Promise<void> => {
  await act(async () => {
    renderer = TestRenderer.create(<Host />);
  });
};

const refocus = async (): Promise<void> => {
  mockEnv.focusTick += 1;
  await act(async () => {
    renderer.update(<Host />);
  });
};

const vm = (): ViewModel => {
  if (!vmRef.current) throw new Error('view-model not rendered');
  return vmRef.current;
};

beforeEach(() => {
  mockEnv = {
    transactions: [],
    params: undefined,
    focusTick: 0,
    categoryByTxId: {},
    loadTransactions: jest.fn(),
    syncFromMonobank: jest.fn(),
    setParams: jest.fn(),
  };
  vmRef.current = undefined;
});

describe('useTransactionsViewModel filtering', () => {
  it('filters to a single category id — 3 of cat-a', async () => {
    // AC-001
    mockEnv.transactions = [
      makeTx('a1'),
      makeTx('a2'),
      makeTx('a3'),
      makeTx('b1'),
      makeTx('b2'),
    ];
    mockEnv.categoryByTxId = {
      a1: 'cat-a',
      a2: 'cat-a',
      a3: 'cat-a',
      b1: 'cat-b',
      b2: 'cat-b',
    };
    mockEnv.params = { filter: { categoryId: 'cat-a' } };

    await renderVM();

    expect(vm().filteredTransactions).toHaveLength(3);
  });

  it('filters to a single month prefix — 4 of 2026-08', async () => {
    // AC-002
    mockEnv.transactions = [
      makeTx('t1', { occurredAtIso: '2026-08-01T12:00:00+00:00' }),
      makeTx('t2', { occurredAtIso: '2026-08-14T12:00:00+00:00' }),
      makeTx('t3', { occurredAtIso: '2026-08-20T12:00:00+00:00' }),
      makeTx('t4', { occurredAtIso: '2026-08-31T12:00:00+00:00' }),
      makeTx('t5', { occurredAtIso: '2026-07-15T12:00:00+00:00' }),
    ];
    mockEnv.params = { filter: { month: '2026-08' } };

    await renderVM();

    expect(vm().filteredTransactions).toHaveLength(4);
  });

  it('ANDs category and month — only 2 match both', async () => {
    // AC-003
    mockEnv.transactions = [
      makeTx('both1', { occurredAtIso: '2026-08-02T12:00:00+00:00' }),
      makeTx('both2', { occurredAtIso: '2026-08-09T12:00:00+00:00' }),
      makeTx('catOnly', { occurredAtIso: '2026-07-09T12:00:00+00:00' }),
      makeTx('monthOnly', { occurredAtIso: '2026-08-09T12:00:00+00:00' }),
      makeTx('neither', { occurredAtIso: '2026-07-09T12:00:00+00:00' }),
    ];
    mockEnv.categoryByTxId = {
      both1: 'cat-a',
      both2: 'cat-a',
      catOnly: 'cat-a',
      monthOnly: 'cat-b',
      neither: 'cat-b',
    };
    mockEnv.params = { filter: { categoryId: 'cat-a', month: '2026-08' } };

    await renderVM();

    expect(vm().filteredTransactions).toHaveLength(2);
  });

  it('shows the full list when no filter payload is present', async () => {
    // AC-004
    mockEnv.transactions = Array.from({ length: 10 }, (_, i) => makeTx(`t${i}`));
    mockEnv.params = undefined;

    await renderVM();

    expect(vm().filteredTransactions).toHaveLength(10);
  });

  it('matches a month by string prefix ignoring timezone offset', async () => {
    // AC-005
    mockEnv.transactions = [
      makeTx('tz', { occurredAtIso: '2026-08-01T01:00:00+03:00' }),
      makeTx('other', { occurredAtIso: '2026-07-20T12:00:00+00:00' }),
    ];
    mockEnv.params = { filter: { month: '2026-08' } };

    await renderVM();

    expect(vm().filteredTransactions.some(t => t.id === 'tz')).toBe(true);
  });
});

describe('useTransactionsViewModel chip dismissal', () => {
  const twoDimFixture = (): void => {
    mockEnv.transactions = [
      makeTx('t1', { occurredAtIso: '2026-08-01T12:00:00+00:00' }), // cat-a + aug
      makeTx('t2', { occurredAtIso: '2026-07-01T12:00:00+00:00' }), // cat-a + jul
      makeTx('t3', { occurredAtIso: '2026-08-02T12:00:00+00:00' }), // cat-b + aug
      makeTx('t4', { occurredAtIso: '2026-07-02T12:00:00+00:00' }), // cat-b + jul
    ];
    mockEnv.categoryByTxId = {
      t1: 'cat-a',
      t2: 'cat-a',
      t3: 'cat-b',
      t4: 'cat-b',
    };
    mockEnv.params = { filter: { categoryId: 'cat-a', month: '2026-08' } };
  };

  it('keeps the month filter when the category chip is dismissed', async () => {
    // AC-009
    twoDimFixture();
    await renderVM();

    await act(async () => {
      vm().dismissCategoryFilter();
    });

    const months = Array.from(
      new Set(vm().filteredTransactions.map(t => t.occurredAtIso.slice(0, 7))),
    );
    expect(months).toEqual(['2026-08']);
    expect(vm().categoryChipLabel).toBeNull();
  });

  it('keeps the category filter when the month chip is dismissed', async () => {
    // AC-010
    twoDimFixture();
    await renderVM();

    await act(async () => {
      vm().dismissMonthFilter();
    });

    expect(vm().categoryChipLabel).toBe('cat-a');
  });

  it('restores the full list when the only active filter is dismissed', async () => {
    // AC-011
    mockEnv.transactions = Array.from({ length: 10 }, (_, i) =>
      makeTx(`t${i}`),
    );
    mockEnv.categoryByTxId = { t0: 'cat-a', t1: 'cat-a' };
    mockEnv.params = { filter: { categoryId: 'cat-a' } };
    await renderVM();

    await act(async () => {
      vm().dismissCategoryFilter();
    });

    expect(vm().filteredTransactions).toHaveLength(10);
  });
});

describe('useTransactionsViewModel focus re-application', () => {
  it('clears the active filter when re-focused without a payload', async () => {
    // AC-014
    mockEnv.transactions = Array.from({ length: 10 }, (_, i) =>
      makeTx(`t${i}`),
    );
    mockEnv.categoryByTxId = { t0: 'cat-a', t1: 'cat-a' };
    mockEnv.params = { filter: { categoryId: 'cat-a' } };
    await renderVM();

    mockEnv.params = undefined;
    await refocus();

    expect(vm().filteredTransactions).toHaveLength(10);
  });

  it('replaces the active filter when navigated to with a new payload', async () => {
    // AC-015
    mockEnv.transactions = [makeTx('a1'), makeTx('b1')];
    mockEnv.categoryByTxId = { a1: 'cat-a', b1: 'cat-b' };
    mockEnv.params = { filter: { categoryId: 'cat-a' } };
    await renderVM();

    mockEnv.params = { filter: { categoryId: 'cat-b' } };
    await refocus();

    expect(vm().categoryChipLabel).toBe('cat-b');
  });
});
