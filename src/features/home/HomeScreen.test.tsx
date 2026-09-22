import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import type { Card } from '../../domain/cards';
import { makeCard } from '../../../test/factories';

// Test knobs, held on a hoisted `var` so the hoisted jest.mock factories can close
// over them; every factory only *reads* the knobs at render time, by which point
// beforeEach has assigned them.
var mockEnv: {
  currentUserId: string | null;
  cards: Card[];
  cardReads: Card[][];
  focusTick: number;
  monobankStatus: string;
  loadCardsByUser: jest.Mock;
  loadSavedToken: jest.Mock;
  loadTransactions: jest.Mock;
  syncFromMonobank: jest.Mock;
  onForeground: (() => void) | null;
};

// Navigation. There is no navigator in a screen test, so focus is faked the way
// useTransactionsViewModel.test.tsx already fakes it: a tick the test bumps by hand.
//
// The deps array carries the callback as well as the tick, because the real hook
// does — @react-navigation/core's useFocusEffect re-subscribes whenever the
// callback's identity changes, which is why the screen has to memoise it. Dropping
// `cb` from the deps here would make an un-memoised inline arrow indistinguishable
// from a memoised one, and AC-004 / AC-005 are exactly the criteria that tell them
// apart.
jest.mock('@react-navigation/native', () => {
  const react = require('react');
  return {
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (cb: React.EffectCallback) =>
      react.useEffect(cb, [cb, mockEnv.focusTick]),
  };
});

// The screen reads ROOT_ROUTES from the navigation barrel, which otherwise drags
// the whole RootNavigator — native-stack, every feature, WatermelonDB — into the
// case. Expose just ROOT_ROUTES, from the lightweight routes module.
jest.mock('../../app/navigation', () => ({
  ROOT_ROUTES: jest.requireActual('../../app/navigation/routes').ROOT_ROUTES,
}));

// The cards store is a real zustand singleton wired to a WatermelonDB repository.
// The screen reaches for it through the deep path (HomeScreen.tsx:12) while it
// takes CardStack from the barrel (line 6), so both have to be replaced — mocking
// only the barrel would leave the real store, and the real database, in place.
//
// `loadCardsByUser` is what a read *is* in this suite: each call consumes the next
// entry of `cardReads` and makes it the list the selector hands back. That is the
// only way the rendered list can change, since the fixture is not React state.
jest.mock('../cards/state/useCardsStore', () => ({
  useCardsStore: (selector: (state: unknown) => unknown) =>
    selector({
      cards: mockEnv.cards,
      isLoading: false,
      loadCardsByUser: mockEnv.loadCardsByUser,
    }),
}));

// The real CardStack pulls reanimated shared values and a PanResponder, and no
// production element carries a testID to count. Stand in one View per card.
jest.mock('../cards', () => {
  const react = require('react');
  const { View } = require('react-native');
  return {
    CardStack: ({ cards }: { cards: Card[] }) =>
      react.createElement(
        View,
        null,
        cards.map(card =>
          react.createElement(View, { key: card.id, testID: 'home-card' }),
        ),
      ),
  };
});

jest.mock('../../stores/useUserStore', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({ currentUserId: mockEnv.currentUserId }),
}));

jest.mock('../monobank', () => ({
  useMonobankStore: (selector: (state: unknown) => unknown) =>
    selector({
      status: mockEnv.monobankStatus,
      clientName: null,
      loadSavedToken: mockEnv.loadSavedToken,
    }),
}));

// Serves the screen and TransactionHistorySection, which reads the same module.
jest.mock('../transactions/state/useTransactionsStore', () => ({
  useTransactionsStore: (selector: (state: unknown) => unknown) =>
    selector({
      transactions: [],
      isLoadingFromDb: false,
      syncStatus: 'idle',
      loadTransactions: mockEnv.loadTransactions,
      syncFromMonobank: mockEnv.syncFromMonobank,
    }),
}));

// The hook listens on AppState; keep the callback so the foreground case can fire
// it directly instead of emulating a native event.
jest.mock('../transactions/hooks/useAppForegroundSync', () => ({
  useAppForegroundSync: (onForeground: () => void) => {
    mockEnv.onForeground = onForeground;
  },
}));

// Replace the Screen shell (SafeAreaView + Header + gradient) with a passthrough,
// keeping the real AppText / Button / LoadingOverlay.
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
import { HomeScreen } from './HomeScreen';

// A *new* element every time, deliberately. Handing rerender the same element
// object React already holds lets it bail out of the subtree entirely — props are
// referentially equal, so the screen would never re-render and every case below
// would read a stale tree.
const homeTree = (): React.ReactElement => (
  <ThemeProvider>
    <HomeScreen />
  </ThemeProvider>
);

// RNTL 14 returns a Promise from render/rerender, so both are awaited everywhere.
// The explicit return type is what turns a forgotten await into a type error
// rather than a `queryAllByTestId is not a function` far from its cause.
const renderHome = (): Promise<RenderResult> => render(homeTree());

// A fresh focus: bump the tick and re-render. The second re-render is not a second
// focus — the tick does not move, so the focus effect does not fire again — it only
// lets the tree catch up with the fixture the focus read replaced, since the faked
// store is a plain object and nothing schedules a render when it changes.
const refocus = async (tree: RenderResult): Promise<void> => {
  mockEnv.focusTick += 1;
  await tree.rerender(homeTree());
  await tree.rerender(homeTree());
};

// The jest ScrollView mock spreads its props onto the RCTScrollView host node, so
// the refreshControl element — and with it the screen's own onRefresh — is readable
// there. The RefreshControl mock renders a bare host node with no props at all, so
// this is the one place the handler survives into the tree.
const pullToRefresh = async (tree: RenderResult): Promise<void> => {
  const handlers = tree.container
    .queryAll(
      node =>
        typeof node.props.onRefresh === 'function' ||
        typeof node.props.refreshControl?.props?.onRefresh === 'function',
    )
    .map(
      node =>
        (node.props.onRefresh ??
          node.props.refreshControl.props.onRefresh) as () => Promise<void>,
    );

  if (handlers.length === 0) {
    throw new Error('HomeScreen rendered no pull-to-refresh control');
  }

  await act(async () => {
    await handlers[0]();
  });
};

beforeEach(() => {
  mockEnv = {
    currentUserId: 'user-1',
    cards: [],
    cardReads: [],
    focusTick: 0,
    monobankStatus: 'idle',
    loadCardsByUser: jest.fn(async () => {
      const next = mockEnv.cardReads.shift();
      if (next) {
        mockEnv.cards = next;
      }
    }),
    loadSavedToken: jest.fn(async () => {}),
    loadTransactions: jest.fn(),
    syncFromMonobank: jest.fn(async () => {}),
    onForeground: null,
  };
});

describe('HomeScreen reads cards on focus', () => {
  it('AC-001 — reads the cards once when the screen mounts and is focused', async () => {
    await renderHome();

    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(1);
  });

  it('AC-002 — reads the cards again when the screen is focused a second time', async () => {
    const tree = await renderHome();
    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(1);

    await refocus(tree);

    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(2);
  });

  it('AC-003 — renders the card the second read returns', async () => {
    // Empty on the first read, one card on the next — the shape of coming back
    // from the Monobank connect screen. The criterion is the transition: a case
    // that mounted once with a card already in the fixture would be green against
    // today's broken screen too.
    mockEnv.cardReads = [[], [makeCard({ id: 'mono-1' })]];

    const tree = await renderHome();
    expect(tree.queryAllByTestId('home-card')).toHaveLength(0);

    await refocus(tree);

    expect(tree.queryAllByTestId('home-card')).toHaveLength(1);
  });
});

describe('HomeScreen does not re-read cards on Monobank activity', () => {
  it('AC-004 — does not re-read when the Monobank status turns connected', async () => {
    const tree = await renderHome();

    mockEnv.monobankStatus = 'connected';
    await tree.rerender(homeTree());

    // Control: the connected branch did run, so a count of one is the screen
    // declining to re-read rather than the status change never landing.
    expect(mockEnv.loadTransactions).toHaveBeenCalledTimes(1);
    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(1);
  });

  it('AC-005 — reads once when a saved token connects during mount', async () => {
    mockEnv.loadSavedToken = jest.fn(async () => {
      mockEnv.monobankStatus = 'connected';
    });

    const tree = await renderHome();
    await tree.rerender(homeTree());

    expect(mockEnv.loadTransactions).toHaveBeenCalledTimes(1);
    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(1);
  });

  it('AC-006 — does not re-read when pull-to-refresh syncs', async () => {
    mockEnv.monobankStatus = 'connected';

    const tree = await renderHome();
    expect(mockEnv.syncFromMonobank).toHaveBeenCalledTimes(1);

    await pullToRefresh(tree);

    // Control: the refresh really synced — a second sync on top of the mount one.
    expect(mockEnv.syncFromMonobank).toHaveBeenCalledTimes(2);
    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(1);
  });

  it('AC-007 — does not re-read when returning to the foreground syncs', async () => {
    mockEnv.monobankStatus = 'connected';

    await renderHome();

    await act(async () => {
      mockEnv.onForeground?.();
    });

    // Control: the background sync ran, with the silent flag the foreground path
    // passes and no other caller does.
    expect(mockEnv.syncFromMonobank).toHaveBeenCalledWith('user-1', { silent: true });
    expect(mockEnv.loadCardsByUser).toHaveBeenCalledTimes(1);
  });
});
