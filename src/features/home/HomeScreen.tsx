import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../shared/theme';
import { AppText, Button, Screen } from '../../shared/ui';

export function HomeScreen() {
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
            <Button title="Add Transaction" onPress={() => {}} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  wrapper: {
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
}));
