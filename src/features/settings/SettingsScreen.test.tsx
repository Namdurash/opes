import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import Config from 'react-native-config';

// Test knobs, held on hoisted `var`s so the hoisted jest.mock factories can read
// them at render time.
var mockNavigation: { goBack: jest.Mock; navigate: jest.Mock; reset: jest.Mock };
var mockSettingsState: {
  isExporting: boolean;
  exportTransactions: jest.Mock;
  resetSandbox: jest.Mock;
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// The screen reads ROOT_ROUTES from the navigation barrel, which otherwise drags the
// whole RootNavigator — native-stack, every feature, WatermelonDB — into the case.
// Expose just ROOT_ROUTES, from the lightweight routes module.
jest.mock('../../app/navigation', () => ({
  ROOT_ROUTES: jest.requireActual('../../app/navigation/routes').ROOT_ROUTES,
}));

// The settings store instantiates its repository at module scope, so importing it
// for real opens the database. What these cases are about is the row, and the
// navigation that follows pressing it — not what the action does behind it.
jest.mock('./state/useSettingsStore', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) => selector(mockSettingsState),
}));

// Replace the Screen shell (SafeAreaView + Header + gradient) with a passthrough,
// keeping the real AppText / Button so what is counted below is the screen's own
// tree rather than a stub of it.
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
import { SettingsScreen } from './SettingsScreen';

// `test/setup.js` hands react-native-config out as a plain object, so raising and
// lowering the build flag is a matter of setting and deleting one property — the
// real isSandboxBuild() is what the screen consults, re-reading it per call (AS-003).
const config = Config as Record<string, string | undefined>;

interface NavigationResetState {
  index: number;
  routes: Array<{ name: string }>;
}

const firstRouteNamePassedToReset = (): string | undefined => {
  const [state] = (mockNavigation.reset.mock.calls[0] ?? []) as [
    NavigationResetState | undefined,
  ];
  return state?.routes?.[0]?.name;
};

// @testing-library/react-native v14 made render, unmount and fireEvent.press async
// (`render` is declared `Promise<{ ... }>`), so every one of them is awaited below —
// the same shape TransactionsScreen.test.tsx already uses. The explicit return type
// is what keeps a missing await a type error rather than a `queryAllByTestId is not
// a function` TypeError that would hide the assertion this file is here to make.
const renderScreen = (): Promise<RenderResult> =>
  render(
    <ThemeProvider>
      <SettingsScreen />
    </ThemeProvider>,
  );

beforeEach(() => {
  mockNavigation = { goBack: jest.fn(), navigate: jest.fn(), reset: jest.fn() };
  mockSettingsState = {
    isExporting: false,
    exportTransactions: jest.fn(),
    resetSandbox: jest.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  delete config.OPES_ENV;
});

describe('SettingsScreen sandbox reset row', () => {
  it('AC-014 — renders the reset item in a sandbox build', async () => {
    config.OPES_ENV = 'sandbox';

    const tree = await renderScreen();

    expect(tree.queryAllByTestId('sandbox-reset-item')).toHaveLength(1);
  });

  it('AC-015 — renders no reset item in a normal build', async () => {
    // A count of zero is only worth asserting if the row can appear at all: against
    // a screen that never renders it, every testID count is zero and this criterion
    // would be green for the wrong reason. So the case establishes the control
    // first — flag up, the row is there — and only then lowers the flag.
    config.OPES_ENV = 'sandbox';
    const sandboxTree = await renderScreen();
    expect(sandboxTree.queryAllByTestId('sandbox-reset-item')).toHaveLength(1);
    await sandboxTree.unmount();

    delete config.OPES_ENV;
    const normalTree = await renderScreen();

    expect(normalTree.queryAllByTestId('sandbox-reset-item')).toHaveLength(0);
  });
});

describe('SettingsScreen sandbox reset navigation', () => {
  it('AC-011 — sends the app back to Welcome once the reset item is pressed', async () => {
    config.OPES_ENV = 'sandbox';

    const tree = await renderScreen();

    // The row does not exist yet, and getByTestId would abort the case before its
    // assertion. Pressing every match presses the row when it is there and does
    // nothing when it is not, so the navigation assertion is what goes red.
    for (const node of tree.queryAllByTestId('sandbox-reset-item')) {
      await fireEvent.press(node);
    }

    await waitFor(() => {
      expect(firstRouteNamePassedToReset()).toBe('Welcome');
    });
  });
});
