/**
 * OPES-68 — a Monobank card survives disconnection as a tombstone.
 *
 * Disconnecting deletes nothing: the row stays, the imported history stays, and the
 * card keeps its place on Home. What changes is how it is presented — greyed, badged
 * `Disconnected`, and carrying the only control that can remove it. This file pins
 * that presentation on CardItem itself, which is where D-003 puts the two new props:
 * `inactive` switches the whole tombstone treatment on, `onDelete` receives the
 * confirmed deletion. Which cards are inactive is CardStack's decision, asserted in
 * its own suite.
 *
 * Every count here has a control beside it. AC-008 and AC-014 both expect zero, and
 * zero is what a component that never renders the thing at all also produces — so
 * each of those cases first renders the inactive card, proves the badge or the delete
 * control is there, and only then lowers the flag. Without that, both criteria would
 * be green today for the wrong reason.
 *
 * The honest limit is VG-001: nothing below establishes that the grey actually reads
 * as "this card is dead", or that the delete control is noticeable on it. A testID is
 * present or absent; whether a person sees a tombstone is a question for a built app.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import type { Card } from '../../../domain/cards';
import { makeCard } from '../../../../test/factories';
import { ThemeProvider } from '../../../shared/theme';
import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import { CardItem } from './CardItem';

/**
 * CardItem does not declare `inactive` or `onDelete` yet — D-003 adds them.
 *
 * The props are typed here and spread into the element rather than written on the
 * JSX, because a JSX spread is not excess-property checked: an unknown prop is
 * dropped silently today and reaches the component the moment it exists, so this
 * file compiles on both sides of the change and goes red on its assertions rather
 * than on `tsc`.
 */
interface TombstoneCardItemProps {
  card: Card;
  collapsed?: boolean;
  inactive?: boolean;
  onDelete?: () => void;
}

const renderCardItem = (props: TombstoneCardItemProps): Promise<RenderResult> =>
  render(
    <ThemeProvider>
      <CardItem {...props} />
    </ThemeProvider>,
  );

const monobankCard = (): Card =>
  makeCard({
    id: 'mono-1',
    title: '₴ *1234',
    type: 'monobank',
    monobankAccountId: 'acc-1',
    currencyCode: 980,
    currencySymbol: '₴',
    monobankBalance: 1200,
    moneyAmount: 1200,
  });

beforeEach(() => {
  useBottomSheetStore.setState({ visible: false, config: null });
});

describe('CardItem when Monobank is disconnected', () => {
  it('AC-003 — badges the monobank card Disconnected', async () => {
    const tree = await renderCardItem({ card: monobankCard(), inactive: true });

    expect(tree.queryAllByText('Disconnected')).toHaveLength(1);
  });

  it('AC-004 — carries the inactivity flag that greys the card', async () => {
    // Control first: without the flag there is no grey node, so the `true` below is
    // the flag doing something rather than a node that is always in the tree.
    const activeTree = await renderCardItem({ card: monobankCard(), inactive: false });
    expect(activeTree.queryAllByTestId('card-inactive')).toHaveLength(0);
    await activeTree.unmount();

    const tree = await renderCardItem({ card: monobankCard(), inactive: true });

    const isGreyedOut = tree.queryAllByTestId('card-inactive').length === 1;
    expect(isGreyedOut).toBe(true);
  });

  it('AC-009 — tapping the delete control asks Delete card? and deletes on confirm', async () => {
    const onDelete = jest.fn();
    const tree = await renderCardItem({ card: monobankCard(), inactive: true, onDelete });

    // The control does not exist yet, and getByTestId would abort the case before
    // its assertion. Pressing every match presses it when it is there and does
    // nothing when it is not, so the confirmation assertion is what goes red.
    for (const node of tree.queryAllByTestId('card-delete')) {
      await fireEvent.press(node);
    }

    expect(useBottomSheetStore.getState().config?.title).toBe('Delete card?');

    // The title alone would be satisfied by a sheet that asks and then drops the
    // answer. Confirming has to reach the caller, or the tap is a dead end.
    const confirm = useBottomSheetStore
      .getState()
      .config?.actions?.find(action => action.label === 'Delete');
    confirm?.onPress();

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('CardItem while Monobank is connected', () => {
  it('AC-008 — shows no delete control on a live monobank card', async () => {
    // Control: the delete control can appear at all, so the zero below is the live
    // card withholding it rather than CardItem never having one.
    const tombstone = await renderCardItem({ card: monobankCard(), inactive: true });
    expect(tombstone.queryAllByTestId('card-delete')).toHaveLength(1);
    await tombstone.unmount();

    const tree = await renderCardItem({ card: monobankCard(), inactive: false });

    expect(tree.queryAllByTestId('card-delete')).toHaveLength(0);
  });

  it('AC-014 — drops the Disconnected badge once the card is live again', async () => {
    // The same card, disconnected and then reconnected: the badge has to leave with
    // the flag it arrived on, because a derived state that only switches one way
    // would strand the tombstone on a working card.
    const tombstone = await renderCardItem({ card: monobankCard(), inactive: true });
    expect(tombstone.queryAllByText('Disconnected')).toHaveLength(1);
    await tombstone.unmount();

    const tree = await renderCardItem({ card: monobankCard(), inactive: false });

    expect(tree.queryAllByText('Disconnected')).toHaveLength(0);
  });
});
