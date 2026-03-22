import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROOT_ROUTES, HomeScreenNavigationProp } from '../../app/navigation';
import { CardStack } from '../cards';
import { AppText, Button, Screen } from '../../shared/ui';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCardsStore } from '../cards/state/useCardsStore';
import { useHomeScreenStyles } from './HomeScreen.styles';

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const styles = useHomeScreenStyles();
  const signOut = useAuthStore(state => state.signOut);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const cards = useCardsStore(state => state.cards);
  const isLoading = useCardsStore(state => state.isLoading);
  const errorMessage = useCardsStore(state => state.errorMessage);
  const loadCardsByUser = useCardsStore(state => state.loadCardsByUser);

  React.useEffect(() => {
    if (currentUserId) {
      void loadCardsByUser(currentUserId);
    }
  }, [currentUserId, loadCardsByUser]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="h1">Home</AppText>
          <AppText tone="secondary">Track your cards and move quickly between flows.</AppText>
        </View>

        {isLoading ? <AppText tone="secondary">Loading cards...</AppText> : null}
        {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
        {cards.length > 0 ? <CardStack cards={cards} /> : null}
        <Button onPress={() => navigation.navigate(ROOT_ROUTES.CREATE_CARD)} title="Create card" />

        <View style={styles.quickActions}>
          <AppText variant="h2">Quick Actions</AppText>
          <View style={styles.quickActionsButton}>
            <Button
              title="Go to Transactions"
              onPress={() => navigation.navigate(ROOT_ROUTES.TRANSACTIONS)}
              variant="secondary"
            />
          </View>
        </View>

        <Button title="Sign out" onPress={() => void signOut()} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}
