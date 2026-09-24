/**
 * OPES-68 — the stack decides which cards are tombstones, and what they still do.
 *
 * A disconnected Monobank card keeps its place in the stack. What it loses is the
 * tap: the gesture that promised a detail screen and a sync that no longer exist.
 * What it keeps is the drag — the human ruled that a tombstone must still be
 * pushable down the pile, and long-press is already spoken for by the reorder, so
 * only the press path may be gated (D-009).
 *
 * Two departures from the sibling component suite worth naming:
 *
 *   - The stores are the REAL zustand singletons with their actions replaced, not
 *     module mocks. CardStack takes `reorderCards` from '../state/useCardsStore' and
 *     — once D-001/D-002 land — the Monobank status from
 *     '../../monobank/state/useMonobankStore'; a module mock would only cover the
 *     exact specifier the implementation happens to import, and would quietly stop
 *     covering anything if it imported the barrel instead. Replacing state on the
 *     real store works through every path to it.
 *   - `PanResponder.create` is replaced by a spy that keeps the config. The drag
 *     lives in a PanResponder on the container, and driving it for real would mean
 *     hand-building a touch history for RN to differentiate — that tests RN, not
 *     this component. Calling the captured `onPanResponderRelease` with a gesture
 *     state exercises the component's own arithmetic, which is what AC-007 is about.
 *
 * Neither the greying nor the badge is asserted here; they belong to CardItem and
 * are pinned in CardItem.test.tsx. And nothing below shows that a real finger on a
 * real device gets the same outcome — VG-001 again.
 */
import React from 'react';
import { PanResponder } from 'react-native';
import type {
  GestureResponderEvent,
  PanResponderCallbacks,
  PanResponderGestureState,
  PanResponderInstance,
} from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import type { Card } from '../../../domain/cards';
import { makeCard } from '../../../../test/factories';

// Importing the real stores pulls CardsRepository and the database barrel in, which
// opens a live LokiJS instance whose 500 ms autosave outlives the suite. No case
// here reaches a repository call, so the singleton is a bare object — the same
// treatment the monobank store suites give it.
jest.mock('../../../services/database/database', () => ({ database: {} }));

import { ThemeProvider } from '../../../shared/theme';
import { useMonobankStore } from '../../monobank/state/useMonobankStore';
import { useCardsStore } from '../state/useCardsStore';
import { CardStack } from './CardStack';
import { CARD_STEP } from './CardStack.styles';

type ReorderAction = ReturnType<typeof useCardsStore.getState>['reorderCards'];
type DeleteAction = ReturnType<typeof useCardsStore.getState>['deleteCard'];

const realReorderCards: ReorderAction = useCardsStore.getState().reorderCards;
const realDeleteCard: DeleteAction = useCardsStore.getState().deleteCard;

const MONOBANK_CARD = makeCard({
  id: 'mono-1',
  title: 'Mono',
  type: 'monobank',
  monobankAccountId: 'acc-1',
  currencyCode: 980,
  currencySymbol: '₴',
  monobankBalance: 1200,
  moneyAmount: 1200,
  sortOrder: 0,
});

const MANUAL_CARD = makeCard({
  id: 'manual-1',
  title: 'Cash',
  type: 'storage',
  moneyAmount: 500,
  sortOrder: 1,
});

// The release handler ignores its event argument entirely (`_`, CardStack.tsx:156),
// so a bare object stands in for it rather than twenty synthetic touch fields.
const TOUCH_EVENT = {} as unknown as GestureResponderEvent;

const gestureMovedBy = (dy: number): PanResponderGestureState => ({
  stateID: 1,
  moveX: 0,
  moveY: dy,
  x0: 0,
  y0: 0,
  dx: 0,
  dy,
  vx: 0,
  vy: 0,
  numberActiveTouches: 1,
  _accountsForMovesUpTo: 0,
});

let reorderCards: jest.Mock;
let deleteCard: jest.Mock;
let panConfigs: PanResponderCallbacks[];

const renderStack = (cards: Card[], onCardPress?: (card: Card) => void): Promise<RenderResult> =>
  render(
    <ThemeProvider>
      <CardStack cards={cards} onCardPress={onCardPress} />
    </ThemeProvider>,
  );

/**
 * A finished drag of `rows` card-steps, on whichever card was long-pressed last.
 *
 * The latest captured config is used, not the first: `create` runs on every render,
 * and every config closes over the same refs and shared values, so the newest one
 * drives the same drag the mounted instance would.
 */
const dragBy = async (rows: number): Promise<void> => {
  const config = panConfigs[panConfigs.length - 1];
  const gesture = gestureMovedBy(CARD_STEP * rows);

  await act(async () => {
    config?.onPanResponderMove?.(TOUCH_EVENT, gesture);
    config?.onPanResponderRelease?.(TOUCH_EVENT, gesture);
  });
};

beforeEach(() => {
  panConfigs = [];
  jest
    .spyOn(PanResponder, 'create')
    .mockImplementation((config: PanResponderCallbacks): PanResponderInstance => {
      panConfigs.push(config);
      return { panHandlers: {} };
    });

  reorderCards = jest.fn(async () => {});
  deleteCard = jest.fn(async () => {});
  useCardsStore.setState({ cards: [], reorderCards, deleteCard });

  // The `given` shared by every case below: Monobank is not connected. 'idle' is
  // what disconnect() leaves behind, and the tombstone state is derived from the
  // status alone (D-001) — there is no column and nothing to seed.
  useMonobankStore.setState({ status: 'idle' });
});

afterEach(() => {
  jest.restoreAllMocks();
  useCardsStore.setState({ reorderCards: realReorderCards, deleteCard: realDeleteCard });
});

describe('CardStack while Monobank is disconnected', () => {
  it('AC-005 — does not open the disconnected monobank card when its body is tapped', async () => {
    const onCardPress = jest.fn();
    const tree = await renderStack([MONOBANK_CARD, MANUAL_CARD], onCardPress);

    await fireEvent.press(tree.getByText('Mono'));

    expect(onCardPress).toHaveBeenCalledTimes(0);

    // Control, in this very tree: the press path is wired and reaches the handler,
    // so the zero above is the tombstone being gated rather than fireEvent finding
    // nothing to press.
    await fireEvent.press(tree.getByText('Cash'));
    expect(onCardPress).toHaveBeenCalledTimes(1);
  });

  it('AC-006 — still opens a manual card in the same stack', async () => {
    const onCardPress = jest.fn();
    const tree = await renderStack([MONOBANK_CARD, MANUAL_CARD], onCardPress);

    await fireEvent.press(tree.getByText('Cash'));

    expect(onCardPress).toHaveBeenCalledTimes(1);
    // The gate is per card, not per stack: a manual card sharing a stack with a
    // tombstone must still hand its own card to the caller.
    expect(onCardPress).toHaveBeenCalledWith(MANUAL_CARD);
  });

  it('AC-007 — still reorders when the disconnected card is dragged down the stack', async () => {
    // The tombstone sits first of two, so there is somewhere below to drop it.
    const tree = await renderStack([MONOBANK_CARD, MANUAL_CARD]);

    await fireEvent(tree.getByText('Mono'), 'longPress');
    await dragBy(1);

    expect(reorderCards).toHaveBeenCalledTimes(1);
    // …and to the position the drag asked for. A reorder call with the old order
    // would satisfy the count while moving nothing.
    expect(reorderCards).toHaveBeenCalledWith([MANUAL_CARD, MONOBANK_CARD]);
  });
});
