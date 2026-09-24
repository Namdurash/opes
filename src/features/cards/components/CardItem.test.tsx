/**
 * OPES-68 — a Monobank card survives disconnection as a tombstone.
 *
 * Disconnecting deletes nothing: the row stays, the imported history stays, and the
 * card keeps its place on Home. What changes is how it is presented — greyed, badged
 * `Disconnected`, and carrying the only control that can remove it. This file pins
 * that presentation on CardItem itself, which is where the two props live:
 * `inactive` switches the whole tombstone treatment on, `onDelete` receives the
 * confirmed deletion. Which cards are inactive is CardStack's decision, asserted in
 * its own suite.
 *
 * ## Why AC-004 and AC-014 measure a number
 *
 * The first round of this ticket shipped green and changed nothing on screen. AC-004
 * then said "the inactivity flag that greys the card", `expect: true`, so the test
 * below counted a `testID` — and the node it counted was a `#FAFAFA` wash at 0.75
 * laid over a `#FFFFFF` card, painted as the FIRST child, with the name, the amount
 * and the turquoise type tile drawn over it at full contrast. Flag set, test green,
 * card not grey.
 *
 * So both criteria now name the number a person can see: the opacity actually
 * resolved on the group that holds the name, the amount and the type tile — 0.5 on a
 * tombstone (AC-004), 1 once the card is live again (AC-014). Each of those two
 * cases is the other's control: a group that is always 0.5, or always 1, fails one
 * of them.
 *
 * Reading the resolved style is not a proxy for the flag. It is what RN hands the
 * host view, so an implementation cannot satisfy it without the pixels changing —
 * and the membership assertions (title, amount, type tile are INSIDE the group)
 * close the other hole, where a bare wrapper carries the testID and dims nothing.
 *
 * Every count elsewhere has a control beside it. AC-008 expects zero, and zero is
 * what a component that never renders the thing at all also produces — so it first
 * renders the inactive card, proves the delete control is there, and only then
 * lowers the flag.
 *
 * The honest limit is VG-001: nothing below establishes that 0.5 actually READS as
 * "this card is dead", or that the badge and Delete stay noticeable over the dimmed
 * content. A number is present in a style object; whether a person sees a tombstone
 * is a question for a built app.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import type { Card } from '../../../domain/cards';
import { makeCard } from '../../../../test/factories';
import { ThemeProvider } from '../../../shared/theme';
import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import { CardItem } from './CardItem';

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

const CARD_TITLE = '₴ *1234';

/**
 * `1 200,00 ₴` under the uk-UA locale, written loosely on purpose: the group
 * separator is a non-breaking space and the decimal separator a comma only when the
 * runtime carries full ICU, and which one jest has is not what AC-004 is about.
 */
const CARD_AMOUNT = /1\D?200\D00/;

const monobankCard = (): Card =>
  makeCard({
    id: 'mono-1',
    title: CARD_TITLE,
    type: 'monobank',
    monobankAccountId: 'acc-1',
    currencyCode: 980,
    currencySymbol: '₴',
    monobankBalance: 1200,
    moneyAmount: 1200,
  });

/**
 * The opacity RN would apply to the group named by AC-004 and AC-014.
 *
 * `queryAll` rather than `get`: with no such group the flatten yields nothing and
 * the criterion fails on its own `expect`, naming the number that is missing,
 * instead of aborting on a query that found no element.
 */
const contentOpacity = (tree: RenderResult): ViewStyle['opacity'] => {
  const [group] = tree.queryAllByTestId('card-content');

  return StyleSheet.flatten<ViewStyle>(group?.props.style)?.opacity;
};

beforeEach(() => {
  useBottomSheetStore.setState({ visible: false, config: null });
});

describe('CardItem when Monobank is disconnected', () => {
  it('AC-003 — badges the monobank card Disconnected', async () => {
    const tree = await renderCardItem({ card: monobankCard(), inactive: true });

    expect(tree.queryAllByText('Disconnected')).toHaveLength(1);
  });

  it('AC-004 — dims the name, amount and type tile to opacity 0.5', async () => {
    const tree = await renderCardItem({ card: monobankCard(), inactive: true });

    // What the opacity is applied TO is half the criterion. Asserted first, because
    // an empty view carrying this testID would satisfy the number below while the
    // card on screen stayed exactly as bright as it was — which is the defect that
    // sent this ticket back from Review.
    expect(tree.queryAllByTestId('card-content')).toHaveLength(1);
    const group = tree.getByTestId('card-content');
    expect(within(group).queryAllByText(CARD_TITLE)).toHaveLength(1);
    expect(within(group).queryAllByText(CARD_AMOUNT)).toHaveLength(1);
    expect(within(group).queryAllByText('monobank')).toHaveLength(1);

    expect(contentOpacity(tree)).toBe(0.5);
  });

  it('AC-009 — tapping the delete control asks Delete card? and deletes on confirm', async () => {
    const onDelete = jest.fn();
    const tree = await renderCardItem({ card: monobankCard(), inactive: true, onDelete });

    // Pressing every match presses the control when it is there and does nothing
    // when it is not, so the confirmation assertion is what goes red rather than a
    // `getByTestId` aborting the case before it.
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

  it('keeps the badge and the delete control out of the dimmed group', async () => {
    // Not a criterion of its own — the decided answer that badge and Delete stay at
    // full opacity is only enforceable as "they are not inside the thing AC-004
    // dims". Live controls on a dead card are what the user has to see first.
    const tree = await renderCardItem({ card: monobankCard(), inactive: true });

    expect(tree.queryAllByTestId('card-content')).toHaveLength(1);
    const group = tree.getByTestId('card-content');

    expect(within(group).queryAllByText('Disconnected')).toHaveLength(0);
    expect(within(group).queryAllByTestId('card-delete')).toHaveLength(0);
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

  it('AC-014 — restores the group to full opacity once the card is live again', async () => {
    // The same card, disconnected and then reconnected. The dimming is derived from
    // the status with no stored flag, so it has to switch back as readily as it
    // switched on — a tombstone stranded on a working card is the failure mode.
    const tombstone = await renderCardItem({ card: monobankCard(), inactive: true });
    expect(contentOpacity(tombstone)).toBe(0.5);
    await tombstone.unmount();

    const tree = await renderCardItem({ card: monobankCard(), inactive: false });

    // The literal 1, not "unset": an undefined opacity renders the same but says
    // nothing, and AC-014 asks for the number.
    expect(contentOpacity(tree)).toBe(1);
  });
});
