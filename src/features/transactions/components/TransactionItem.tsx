import React from 'react';
import { View } from 'react-native';
import type { Transaction } from '../../../domain/transactions';
import { AppText } from '../../../shared/ui';
import { formatAmount } from '../utils';
import { useTransactionItemStyles } from './TransactionItem.styles';

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const styles = useTransactionItemStyles();
  const isIncome = transaction.amount >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <AppText variant="body" numberOfLines={1}>
          {transaction.title}
        </AppText>
      </View>
      <AppText
        variant="caption"
        style={isIncome ? styles.amountIncome : styles.amountExpense}
      >
        {formatAmount(transaction.amount, transaction.currencySymbol)}
      </AppText>
    </View>
  );
};
