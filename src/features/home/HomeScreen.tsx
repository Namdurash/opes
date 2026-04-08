import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { ROOT_ROUTES, HomeScreenNavigationProp } from '../../app/navigation';
import { CardStack } from '../cards';
import { useMonobankStore } from '../monobank';
import { useTransactionsStore } from '../transactions/state/useTransactionsStore';
import { useAppForegroundSync } from '../transactions/hooks/useAppForegroundSync';
import { AppText, Button, Screen } from '../../shared/ui';
import { useUserStore } from '../../stores/useUserStore';
import { useCardsStore } from '../cards/state/useCardsStore';
import { TransactionHistorySection } from './components/TransactionHistorySection';
import { useHomeScreenStyles } from './HomeScreen.styles';

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const styles = useHomeScreenStyles();
  const [scrollEnabled, setScrollEnabled] = React.useState(true);

  const currentUserId = useUserStore(state => state.currentUserId);

  const { cards, isLoading, errorMessage, loadCardsByUser } = useCardsStore(
    useShallow(state => ({
      cards: state.cards,
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
      loadCardsByUser: state.loadCardsByUser,
    })),
  );

  const { status: monobankStatus, clientName: monobankClientName, loadSavedToken } = useMonobankStore(
    useShallow(state => ({
      status: state.status,
      clientName: state.clientName,
      loadSavedToken: state.loadSavedToken,
    })),
  );

  const { loadTransactions, syncFromMonobank } = useTransactionsStore(
    useShallow(state => ({
      loadTransactions: state.loadTransactions,
      syncFromMonobank: state.syncFromMonobank,
    })),
  );

  React.useEffect(() => {
    if (currentUserId) {
      loadCardsByUser(currentUserId);
    }
  }, [currentUserId, loadCardsByUser]);

  React.useEffect(() => {
    loadSavedToken();
  }, [loadSavedToken]);

  React.useEffect(() => {
    if (monobankStatus === 'connected' && currentUserId) {
      loadTransactions();
      syncFromMonobank(currentUserId).catch(() => {});
    }
  }, [monobankStatus, currentUserId, loadTransactions, syncFromMonobank]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePullToRefresh = useCallback(async () => {
    if (monobankStatus !== 'connected' || !currentUserId) return;

    setIsRefreshing(true);
    try {
      await syncFromMonobank(currentUserId);
    } finally {
      setIsRefreshing(false);
    }
  }, [monobankStatus, currentUserId, syncFromMonobank]);

  const handleForeground = useCallback(() => {
    if (monobankStatus === 'connected' && currentUserId) {
      syncFromMonobank(currentUserId, { silent: true }).catch(() => {});
    }
  }, [monobankStatus, currentUserId, syncFromMonobank]);

  useAppForegroundSync(handleForeground);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} />
        }
      >
        <View style={styles.header}>
          <AppText variant="h1">Home</AppText>
          <AppText tone="secondary">Track your cards and move quickly between flows.</AppText>
        </View>

        {isLoading ? <AppText tone="secondary">Loading cards...</AppText> : null}
        {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
        {cards.length > 0 ? <CardStack cards={cards} onDragStateChange={isDragging => setScrollEnabled(!isDragging)} /> : null}
        <Button onPress={() => navigation.navigate(ROOT_ROUTES.CREATE_CARD)} title="Create card" />

        {monobankStatus === 'connected' ? <TransactionHistorySection /> : null}

        <View style={styles.quickActions}>
          <AppText variant="h2">Quick Actions</AppText>
          <View style={styles.quickActionsButton}>
            <Button
              title="Go to Transactions"
              onPress={() => navigation.navigate(ROOT_ROUTES.TRANSACTIONS)}
              variant="secondary"
            />
          </View>
          <View style={styles.quickActionsButton}>
            <Button
              title={
                monobankStatus === 'connected'
                  ? `Monobank${monobankClientName ? `: ${monobankClientName}` : ' (connected)'}`
                  : 'Connect Monobank'
              }
              onPress={() => navigation.navigate(ROOT_ROUTES.CONNECT_MONOBANK)}
              variant="secondary"
            />
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
};
