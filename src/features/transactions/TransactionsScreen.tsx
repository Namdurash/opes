import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROOT_ROUTES, TransactionsScreenNavigationProp } from '../../app/navigation';
import { useUserStore } from '../../stores/useUserStore';
import { useMonobankStore } from '../monobank';
import { Button, EmptyState, HeaderBackButton, HeaderTitle, LoadingOverlay, Screen } from '../../shared/ui';
import { useTheme } from '../../shared/theme';
import { useTransactionsViewModel } from './state/useTransactionsViewModel';
import { groupTransactionsByDate } from './utils';
import { TransactionListItem } from './components/TransactionListItem';
import { SectionHeader } from './components/SectionHeader';
import { useTransactionsScreenStyles } from './TransactionsScreen.styles';
import type { Transaction } from '../../domain/transactions';
import type { TransactionSection } from './types';

export const TransactionsScreen = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const styles = useTransactionsScreenStyles();
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentUserId = useUserStore(state => state.currentUserId);
  const monobankStatus = useMonobankStore(state => state.status);

  const {
    transactions,
    isLoadingFromDb,
    loadTransactions,
    syncFromMonobank,
    getCategoryForTransaction,
  } = useTransactionsViewModel();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sections: TransactionSection[] = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions],
  );

  const handleRefresh = useCallback(async () => {
    if (!currentUserId || monobankStatus !== 'connected') return;
    setIsRefreshing(true);
    await syncFromMonobank(currentUserId);
    setIsRefreshing(false);
  }, [currentUserId, monobankStatus, syncFromMonobank]);

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionListItem
        transaction={item}
        category={getCategoryForTransaction(item.id)}
      />
    ),
    [getCategoryForTransaction],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: TransactionSection }) => <SectionHeader title={section.title} />,
    [],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <EmptyState message="No transactions yet." />
      </View>
    ),
    [styles.emptyContainer],
  );

  return (
    <Screen
      headerLeft={
        <HeaderBackButton
          onPress={() => {
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate(ROOT_ROUTES.HOME);
          }}
        />
      }
      headerCenter={<HeaderTitle>Transactions</HeaderTitle>}
    >
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button title="New Transaction" onPress={() => { }} variant="primary" />
          </View>
        }
      />
      {isLoadingFromDb ? <LoadingOverlay /> : null}
    </Screen>
  );
};
