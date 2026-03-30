import { create } from 'zustand';
import { MonobankService, MonobankError } from '../../../services/monobank';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import type { MonobankStatement } from '../../../services/monobank/types';

const HISTORY_DAYS = 30;

interface TransactionsState {
  transactions: MonobankStatement[];
  isLoading: boolean;
  errorMessage: string | null;
}

interface TransactionsActions {
  loadTransactions(): Promise<void>;
  reset(): void;
}

export const useTransactionsStore = create<TransactionsState & TransactionsActions>(set => ({
  transactions: [],
  isLoading: false,
  errorMessage: null,

  async loadTransactions() {
    const saved = monobankTokenService.get();
    if (!saved) return;

    set({ isLoading: true, errorMessage: null });

    try {
      const service = new MonobankService(saved.token);
      const to = new Date();
      const from = new Date(to.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
      const transactions = await service.getStatements('0', from, to);
      set({ transactions, isLoading: false });
    } catch (error) {
      const message =
        error instanceof MonobankError
          ? error.message
          : 'Failed to load transactions.';
      set({ isLoading: false, errorMessage: message });
    }
  },

  reset() {
    set({ transactions: [], isLoading: false, errorMessage: null });
  },
}));
