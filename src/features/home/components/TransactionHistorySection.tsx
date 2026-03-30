import React from 'react';
import { View } from 'react-native';
import { useShallow } from 'zustand/shallow';
import { AppText } from '../../../shared/ui';
import { useTransactionsStore } from '../../transactions/state/useTransactionsStore';
import { formatAmount } from '../../transactions/utils';
import { useTransactionHistorySectionStyles } from './TransactionHistorySection.styles';

const MAX_DISPLAYED = 10;

export function TransactionHistorySection() {
  const styles = useTransactionHistorySectionStyles();
  const { transactions, isLoading, errorMessage } = useTransactionsStore(
    useShallow(state => ({
      transactions: state.transactions,
      isLoading: state.isLoading,
      errorMessage: state.errorMessage,
    })),
  );

  const displayed = transactions.slice(0, MAX_DISPLAYED);

  return (
    <View style={styles.container}>
      <AppText variant="h2">Recent Transactions</AppText>

      {isLoading ? (
        <AppText variant="caption" style={styles.emptyText}>Loading...</AppText>
      ) : errorMessage ? (
        <AppText variant="caption" style={styles.emptyText}>{errorMessage}</AppText>
      ) : displayed.length === 0 ? (
        <AppText variant="caption" style={styles.emptyText}>No transactions yet.</AppText>
      ) : (
        displayed.map((tx, index) => (
          <React.Fragment key={tx.id}>
            {index > 0 && <View style={styles.separator} />}
            <View style={styles.row}>
              <AppText
                variant="body"
                style={styles.description}
                numberOfLines={1}
              >
                {tx.description}
              </AppText>
              <AppText
                variant="caption"
                style={tx.amount >= 0 ? styles.amountPositive : styles.amountNegative}
              >
                {formatAmount(tx.amount, tx.currencySymbol)}
              </AppText>
            </View>
          </React.Fragment>
        ))
      )}
    </View>
  );
}
