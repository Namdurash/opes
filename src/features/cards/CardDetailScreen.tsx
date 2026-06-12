import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import type { Card } from '../../domain/cards';
import { ROOT_ROUTES } from '../../app/navigation';
import type {
  CardDetailScreenNavigationProp,
  RootStackParamList,
} from '../../app/navigation';
import {
  AppText,
  Button,
  EmptyState,
  HeaderBackButton,
  HeaderTitle,
  Screen,
} from '../../shared/ui';
import { showBottomSheet } from '../../shared/ui/bottom-sheet';
import { formatMoney } from '../../shared/utils';
import { CardItem } from './components/CardItem';
import { useCardsStore } from './state/useCardsStore';
import { useCardDetailScreenStyles } from './CardDetailScreen.styles';

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow = ({ label, value }: DetailRowProps) => {
  const styles = useCardDetailScreenStyles();
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      <AppText style={styles.detailValue}>{value}</AppText>
    </View>
  );
};

export const CardDetailScreen = () => {
  const styles = useCardDetailScreenStyles();
  const navigation = useNavigation<CardDetailScreenNavigationProp>();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTES.CARD_DETAIL>>();

  const { card, deleteCard } = useCardsStore(
    useShallow(state => ({
      card: state.cards.find(c => c.id === params.cardId) ?? null,
      deleteCard: state.deleteCard,
    })),
  );

  const isManual = card?.monobankAccountId == null;

  const handleDelete = (target: Card) => {
    showBottomSheet({
      variant: 'error',
      title: 'Delete card?',
      message: `"${target.title}" will be permanently removed. This cannot be undone.`,
      actions: [
        {
          label: 'Delete',
          variant: 'danger',
          onPress: () => {
            deleteCard(target.id);
            navigation.goBack();
          },
        },
        { label: 'Cancel', variant: 'secondary', onPress: () => {} },
      ],
    });
  };

  return (
    <Screen
      headerLeft={<HeaderBackButton onPress={() => navigation.goBack()} />}
      headerCenter={<HeaderTitle>Card</HeaderTitle>}
    >
      {card ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <CardItem card={card} />

          <View style={styles.details}>
            <DetailRow
              label="Balance"
              value={formatMoney(card.moneyAmount, {
                code: card.currencyCode,
                symbol: card.currencySymbol,
              })}
            />
            <DetailRow label="Type" value={card.type} />
            <DetailRow label="Created" value={new Date(card.createdAt).toLocaleDateString()} />
            {card.maskedPan ? <DetailRow label="Card number" value={`*${card.maskedPan.slice(-4)}`} /> : null}
            {card.iban ? <DetailRow label="IBAN" value={card.iban} /> : null}
            {card.creditLimit != null && card.creditLimit > 0 ? (
              <DetailRow
                label="Credit limit"
                value={formatMoney(card.creditLimit, {
                  code: card.currencyCode,
                  symbol: card.currencySymbol,
                })}
              />
            ) : null}
          </View>

          {isManual ? (
            <View style={styles.actions}>
              <Button
                title="Edit card"
                onPress={() => navigation.navigate(ROOT_ROUTES.CREATE_CARD, { cardId: card.id })}
              />
              <Button title="Delete card" variant="danger" onPress={() => handleDelete(card)} />
            </View>
          ) : (
            <AppText variant="caption" tone="secondary" style={styles.readOnlyNote}>
              Synced from Monobank — this card is read-only.
            </AppText>
          )}
        </ScrollView>
      ) : (
        <EmptyState message="This card is no longer available." />
      )}
    </Screen>
  );
};
