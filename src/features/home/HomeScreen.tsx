import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp, ROOT_ROUTES } from '../../app/navigation';
import { makeStyles } from '../../shared/theme';
import { AppText, Button, Screen } from '../../shared/ui';
import { useAuthStore } from '../../stores/useAuthStore';

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const signOut = useAuthStore(state => state.signOut);
  const styles = useStyles();

  return (
    <Screen>
      <View style={styles.wrapper}>
        <AppText variant="h1">Home</AppText>
        <AppText tone="secondary">
          Overview placeholder for balances and monthly stats.
        </AppText>

        <View style={styles.quickActions}>
          <AppText variant="h2">Quick Actions</AppText>
          <View style={styles.quickActionsButton}>
            <Button
              title="Go to Transactions"
              onPress={() => navigation.navigate(ROOT_ROUTES.TRANSACTIONS)}
            />
          </View>
        </View>

        <View style={styles.signOutContainer}>
          <Button title="Sign out" onPress={() => void signOut()} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  wrapper: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  quickActions: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  quickActionsButton: {
    marginTop: theme.spacing.sm,
  },
  signOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
