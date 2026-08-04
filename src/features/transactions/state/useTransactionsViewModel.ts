import { useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import type { RouteProp } from '@react-navigation/native';
import type { Category, CategoryId } from '../../../domain/categorization';
import { CategorizationService, getCategoryById } from '../../../services/categorization';
import { UserOverridesRepository } from '../../../models/userOverrides';
import { MerchantRulesRepository } from '../../../models/merchantRules';
import { useTransactionsStore } from './useTransactionsStore';
import { formatMonthLabel } from '../utils';
import type { TransactionsScreenNavigationProp, RootStackParamList } from '../../../app/navigation';
import { ROOT_ROUTES } from '../../../app/navigation/routes';

const userOverridesRepo = new UserOverridesRepository();
const merchantRulesRepo = new MerchantRulesRepository();
const categorizationService = new CategorizationService(
  userOverridesRepo,
  merchantRulesRepo,
);

export const useTransactionsViewModel = () => {
  const { transactions, isLoadingFromDb, loadTransactions, syncFromMonobank } =
    useTransactionsStore(
      useShallow(state => ({
        transactions: state.transactions,
        isLoadingFromDb: state.isLoadingFromDb,
        loadTransactions: state.loadTransactions,
        syncFromMonobank: state.syncFromMonobank,
      })),
    );

  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTES.TRANSACTIONS>>();
  const navigation = useNavigation<TransactionsScreenNavigationProp>();

  const [categoryMap, setCategoryMap] = useState<Map<string, Category>>(
    new Map(),
  );

  const [activeFilter, setActiveFilter] = useState<{
    categoryId?: string;
    month?: string;
  } | null>(null);

  useEffect(() => {
    if (transactions.length === 0) {
      setCategoryMap(new Map());
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      const categorized =
        await categorizationService.resolveCategories(transactions);
      if (!cancelled) {
        setCategoryMap(
          new Map(categorized.map(c => [c.transaction.id, c.category])),
        );
      }
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [transactions]);

  useFocusEffect(
    () => {
      const params = route.params;
      if (params?.filter) {
        const filter = params.filter;
        if (filter.categoryId || filter.month) {
          setActiveFilter({
            categoryId: filter.categoryId,
            month: filter.month,
          });
        } else {
          setActiveFilter(null);
        }
        navigation.setParams({ filter: undefined });
      } else {
        setActiveFilter(null);
      }
    },
  );

  const getCategoryForTransaction = useMemo(
    () => (transactionId: string) => categoryMap.get(transactionId) ?? null,
    [categoryMap],
  );

  const filteredTransactions = useMemo(() => {
    if (!activeFilter || (!activeFilter.categoryId && !activeFilter.month)) {
      return transactions;
    }

    return transactions.filter(tx => {
      if (activeFilter.categoryId) {
        const txCategory = categoryMap.get(tx.id);
        if (txCategory?.id !== activeFilter.categoryId) {
          return false;
        }
      }

      if (activeFilter.month) {
        const txMonth = tx.occurredAtIso.slice(0, 7);
        if (txMonth !== activeFilter.month) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, activeFilter, categoryMap]);

  const categoryChipLabel = useMemo(() => {
    if (!activeFilter?.categoryId) return null;
    // The route param types categoryId as a plain string (AS-001, the OPES-49
    // contract); getCategoryById wants a CategoryId from the closed set and
    // falls back to "other" for anything outside it, so the cast is safe here.
    return getCategoryById(activeFilter.categoryId as CategoryId).label;
  }, [activeFilter?.categoryId]);

  const monthChipLabel = useMemo(() => {
    if (!activeFilter?.month) return null;
    return formatMonthLabel(activeFilter.month);
  }, [activeFilter?.month]);

  const dismissCategoryFilter = useMemo(
    () => () => {
      const newFilter = { ...activeFilter, categoryId: undefined };
      if (!newFilter.categoryId && !newFilter.month) {
        setActiveFilter(null);
      } else {
        setActiveFilter(newFilter);
      }
    },
    [activeFilter],
  );

  const dismissMonthFilter = useMemo(
    () => () => {
      const newFilter = { ...activeFilter, month: undefined };
      if (!newFilter.categoryId && !newFilter.month) {
        setActiveFilter(null);
      } else {
        setActiveFilter(newFilter);
      }
    },
    [activeFilter],
  );

  return {
    transactions,
    filteredTransactions,
    isLoadingFromDb,
    loadTransactions,
    syncFromMonobank,
    getCategoryForTransaction,
    categoryChipLabel,
    monthChipLabel,
    dismissCategoryFilter,
    dismissMonthFilter,
  };
};
