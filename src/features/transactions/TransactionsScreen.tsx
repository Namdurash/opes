import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../shared/theme';
import { AppText, Button, Screen } from '../../shared/ui';
import { TransactionListPlaceholder } from './components/TransactionListPlaceholder';

export function TransactionsScreen() {
  const styles = useStyles();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="h1">Transactions</AppText>
        <AppText tone="secondary">Offline placeholder list.</AppText>
      </View>

      <View style={styles.listContainer}>
        <TransactionListPlaceholder />
      </View>

      <View style={styles.actions}>
        <Button title="New Transaction" onPress={() => {}} variant="primary" />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  listContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
  },
  actions: {
    marginTop: theme.spacing.md,
  },
}));
