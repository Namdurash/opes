import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const ITEMS = [
  { id: '1', title: 'Groceries', amountLabel: '-$42.10' },
  { id: '2', title: 'Salary', amountLabel: '+$2,500.00' },
  { id: '3', title: 'Transport', amountLabel: '-$15.00' },
];

export function TransactionListPlaceholder() {
  return (
    <FlatList
      data={ITEMS}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.amount}>{item.amountLabel}</Text>
        </View>
      )}
      ItemSeparatorComponent={ItemSeparator}
    />
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
});
