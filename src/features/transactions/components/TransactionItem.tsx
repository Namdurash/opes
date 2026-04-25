import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { Transaction } from '../../../domain/transactions';
import type { Category } from '../../../domain/categorization';
import { AppText } from '../../../shared/ui';
import { formatAmount } from '../utils';
import { useTransactionItemStyles } from './TransactionItem.styles';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | null;
}

export const TransactionItem = ({
  transaction,
  category,
}: TransactionItemProps) => {
  const styles = useTransactionItemStyles();
  const isIncome = transaction.amount >= 0;

  const dotBackgroundColor = useMemo(
    () => (category ? `${category.color}1A` : '#9E9E9E1A'),
    [category],
  );

  const dotColor = category?.color ?? '#9E9E9E';

  return (
    <View style={styles.container}>
      <View style={[styles.categoryDot, { backgroundColor: dotBackgroundColor }]}>
        <View style={[styles.dotInner, { backgroundColor: dotColor }]} />
      </View>
      <View style={styles.content}>
        <AppText variant="body" numberOfLines={1}>
          {transaction.title}
        </AppText>
        {category ? (
          <AppText
            variant="caption"
            tone="tertiary"
            style={styles.categoryLabel}
          >
            {category.label}
          </AppText>
        ) : null}
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
