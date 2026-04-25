import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import type { Category } from '../../../domain/categorization';
import { CategorizationService } from '../../../services/categorization';
import { UserOverridesRepository } from '../../../models/userOverrides';
import { MerchantRulesRepository } from '../../../models/merchantRules';
import { useTransactionsStore } from './useTransactionsStore';

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

  const [categoryMap, setCategoryMap] = useState<Map<string, Category>>(
    new Map(),
  );

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

  const getCategoryForTransaction = useMemo(
    () => (transactionId: string) => categoryMap.get(transactionId) ?? null,
    [categoryMap],
  );

  return {
    transactions,
    isLoadingFromDb,
    loadTransactions,
    syncFromMonobank,
    getCategoryForTransaction,
  };
};
