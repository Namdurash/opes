import React from 'react';
import { FlatList, View } from 'react-native';
import { makeStyles } from '../../../shared/theme';
import { AppText } from '../../../shared/ui';

const ITEMS = [
  { id: '1', title: 'Groceries', amountLabel: '-$42.10' },
  { id: '2', title: 'Salary', amountLabel: '+$2,500.00' },
  { id: '3', title: 'Transport', amountLabel: '-$15.00' },
];

export const TransactionListPlaceholder = () => {
  const styles = useStyles();

  return (
    <FlatList
      data={ITEMS}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <AppText>{item.title}</AppText>
          <AppText style={styles.amount}>{item.amountLabel}</AppText>
        </View>
      )}
      ItemSeparatorComponent={ItemSeparator}
    />
  );
};

const ItemSeparator = () => {
  const styles = useStyles();
  return <View style={styles.separator} />;
};

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  amount: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
}));
