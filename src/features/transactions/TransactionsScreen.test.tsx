import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import type { Transaction } from '../../domain/transactions';

// Test knob: the whole view-model is stubbed so the screen can be driven with
// exact chip labels and filtered results. Held on a hoisted `var` so the
// hoisted jest.mock factory can read it at render time.
var mockVm: {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  isLoadingFromDb: boolean;
  loadTransactions: jest.Mock;
  syncFromMonobank: jest.Mock;
  getCategoryForTransaction: jest.Mock;
  categoryChipLabel: string | null;
  monthChipLabel: string | null;
  dismissCategoryFilter: jest.Mock;
  dismissMonthFilter: jest.Mock;
};

jest.mock('./state/useTransactionsViewModel', () => ({
  useTransactionsViewModel: () => mockVm,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    canGoBack: () => false,
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));

// The screen imports ROOT_ROUTES from the navigation barrel, which otherwise
// pulls the whole RootNavigator (native-stack, every feature, WatermelonDB) into
// the test. Expose just ROOT_ROUTES from the lightweight routes module.
jest.mock('../../app/navigation', () => ({
  ROOT_ROUTES: jest.requireActual('../../app/navigation/routes').ROOT_ROUTES,
}));

jest.mock('../../stores/useUserStore', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({ currentUserId: null }),
}));

jest.mock('../monobank', () => ({
  useMonobankStore: (selector: (state: unknown) => unknown) =>
    selector({ status: 'idle' }),
}));

// Replace the Screen shell (SafeAreaView + Header + gradient) with a passthrough
// so the test focuses on the chip row and empty state, keeping the real AppText /
// EmptyState / FilterChip so their rendered text and testIDs are asserted.
jest.mock('../../shared/ui', () => {
  const actual = jest.requireActual('../../shared/ui');
  const react = require('react');
  const { View } = require('react-native');
  return {
    ...actual,
    Screen: ({ children }: { children: React.ReactNode }) =>
      react.createElement(View, null, children),
  };
});

import { ThemeProvider } from '../../shared/theme';
import { TransactionsScreen } from './TransactionsScreen';

const baseVm = (): typeof mockVm => ({
  transactions: [],
  filteredTransactions: [],
  isLoadingFromDb: false,
  loadTransactions: jest.fn(),
  syncFromMonobank: jest.fn(),
  getCategoryForTransaction: jest.fn(() => null),
  categoryChipLabel: null,
  monthChipLabel: null,
  dismissCategoryFilter: jest.fn(),
  dismissMonthFilter: jest.fn(),
});

const renderScreen = async (): Promise<void> => {
  await render(
    <ThemeProvider>
      <TransactionsScreen />
    </ThemeProvider>,
  );
};

beforeEach(() => {
  mockVm = baseVm();
});

describe('TransactionsScreen filter chips', () => {
  it('renders the category name in the category chip', async () => {
    // AC-006
    mockVm.categoryChipLabel = 'Groceries';

    await renderScreen();

    expect(screen.getByText('Groceries')).toBeTruthy();
  });

  it('renders the four-digit year in the month chip', async () => {
    // AC-007
    mockVm.monthChipLabel = 'Aug 2026';

    await renderScreen();

    const chip = screen.getByTestId('filter-chip-month');
    expect(within(chip).getByText(/2026/)).toBeTruthy();
  });

  it('places the category chip first in the chip row', async () => {
    // AC-008
    mockVm.categoryChipLabel = 'Groceries';
    mockVm.monthChipLabel = 'Aug 2026';

    await renderScreen();

    const row = screen.getByTestId('transactions-filter-chips');
    const order = within(row)
      .getAllByTestId(/^filter-chip-/)
      .map(node => node.props.testID as string);
    expect(order.indexOf('filter-chip-category')).toBe(0);
  });
});

describe('TransactionsScreen filtered empty state', () => {
  it('shows the filtered empty-state copy when a filter matches nothing', async () => {
    // AC-012
    mockVm.filteredTransactions = [];
    mockVm.categoryChipLabel = 'Groceries';

    await renderScreen();

    expect(screen.getByText(/No transactions match this/)).toBeTruthy();
  });

  it('keeps the category chip visible while the filtered list is empty', async () => {
    // AC-013
    mockVm.filteredTransactions = [];
    mockVm.categoryChipLabel = 'Groceries';

    await renderScreen();

    const row = screen.getByTestId('transactions-filter-chips');
    expect(within(row).getByTestId('filter-chip-category')).toBeTruthy();
  });
});
