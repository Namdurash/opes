import React from 'react';
import { View } from 'react-native';
import { useShallow } from 'zustand/shallow';
import { AppText } from '../../../shared/ui';
import { useTransactionsStore } from '../../transactions/state/useTransactionsStore';
import { formatAmount } from '../../transactions/utils';
import { useTransactionHistorySectionStyles } from './TransactionHistorySection.styles';

const MAX_DISPLAYED = 10;

export const TransactionHistorySection = () => {
  const styles = useTransactionHistorySectionStyles();
  const { transactions, isLoadingFromDb, syncStatus } = useTransactionsStore(
    useShallow(state => ({
      transactions: state.transactions,
      isLoadingFromDb: state.isLoadingFromDb,
      syncStatus: state.syncStatus,
    })),
  );

  const displayed = transactions.slice(0, MAX_DISPLAYED);
  const isLoading = isLoadingFromDb || syncStatus === 'syncing';

  return (
    <View style={styles.container}>
      <AppText variant="h2">Recent Transactions</AppText>

      {isLoading && displayed.length === 0 ? (
        <AppText variant="caption" style={styles.emptyText}>Loading...</AppText>
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
                {tx.title}
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
};
