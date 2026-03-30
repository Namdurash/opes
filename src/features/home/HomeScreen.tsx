import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { ROOT_ROUTES, HomeScreenNavigationProp } from '../../app/navigation';
import { CardStack } from '../cards';
import { useMonobankStore } from '../monobank';
import { useTransactionsStore } from '../transactions/state/useTransactionsStore';
import { AppText, Button, Screen } from '../../shared/ui';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCardsStore } from '../cards/state/useCardsStore';
import { TransactionHistorySection } from './components/TransactionHistorySection';
import { useHomeScreenStyles } from './HomeScreen.styles';

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const styles = useHomeScreenStyles();
  const [scrollEnabled, setScrollEnabled] = React.useState(true);

  const { signOut, currentUserId } = useAuthStore(
    useShallow(state => ({ signOut: state.signOut, currentUserId: state.currentUserId })),
  );

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

  const { loadTransactions } = useTransactionsStore(
    useShallow(state => ({ loadTransactions: state.loadTransactions })),
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
    if (monobankStatus === 'connected') {
      loadTransactions();
    }
  }, [monobankStatus, loadTransactions]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
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

        <Button title="Sign out" onPress={() => { signOut(); }} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}
