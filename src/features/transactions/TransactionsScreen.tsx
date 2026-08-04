import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROOT_ROUTES, TransactionsScreenNavigationProp } from '../../app/navigation';
import { useUserStore } from '../../stores/useUserStore';
import { useMonobankStore } from '../monobank';
import { EmptyState, HeaderBackButton, HeaderTitle, LoadingOverlay, Screen } from '../../shared/ui';
import { useTheme } from '../../shared/theme';
import { useTransactionsViewModel } from './state/useTransactionsViewModel';
import { groupTransactionsByDate } from './utils';
import { TransactionListItem } from './components/TransactionListItem';
import { SectionHeader } from './components/SectionHeader';
import { FilterChip } from './components/FilterChip';
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
    filteredTransactions,
    isLoadingFromDb,
    loadTransactions,
    syncFromMonobank,
    getCategoryForTransaction,
    categoryChipLabel,
    monthChipLabel,
    dismissCategoryFilter,
    dismissMonthFilter,
  } = useTransactionsViewModel();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sections: TransactionSection[] = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
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
        <EmptyState
          message={
            categoryChipLabel || monthChipLabel
              ? 'No transactions match this filter.'
              : 'No transactions yet.'
          }
        />
      </View>
    ),
    [styles.emptyContainer, categoryChipLabel, monthChipLabel],
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
      <View style={styles.chipRow} testID="transactions-filter-chips">
        {categoryChipLabel ? (
          <FilterChip
            label={categoryChipLabel}
            onDismiss={dismissCategoryFilter}
            testID="filter-chip-category"
          />
        ) : null}
        {monthChipLabel ? (
          <FilterChip
            label={monthChipLabel}
            onDismiss={dismissMonthFilter}
            testID="filter-chip-month"
          />
        ) : null}
      </View>
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
      />
      {isLoadingFromDb ? <LoadingOverlay /> : null}
    </Screen>
  );
};
