import { create } from 'zustand';
import type { Transaction } from '../../../domain/transactions';
import { MonobankError } from '../../../services/monobank';
import { getMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { TransactionSyncService } from '../../../services/sync';
import { TransactionsRepository } from '../../../models/transactions';
import { CardsRepository } from '../../../models/cards';
import { showErrorBottomSheet } from '../../../shared/ui/bottom-sheet';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface TransactionsState {
  transactions: Transaction[];
  syncStatus: SyncStatus;
  isLoadingFromDb: boolean;
  lastSyncErrorMessage: string | null;
}

interface SyncOptions {
  silent?: boolean;
}

interface TransactionsActions {
  loadTransactions(): Promise<void>;
  syncFromMonobank(userId: string, options?: SyncOptions): Promise<void>;
  reset(): void;
}

const transactionsRepository = new TransactionsRepository();
const cardsRepository = new CardsRepository();

export const useTransactionsStore = create<TransactionsState & TransactionsActions>((set, get) => ({
  transactions: [],
  syncStatus: 'idle',
  isLoadingFromDb: false,
  lastSyncErrorMessage: null,

  async loadTransactions() {
    set({ isLoadingFromDb: true });

    try {
      const transactions = await transactionsRepository.getAll();
      set({ transactions, isLoadingFromDb: false });
    } catch {
      set({ isLoadingFromDb: false });
    }
  },

  async syncFromMonobank(userId: string, options?: SyncOptions) {
    const { silent = false } = options ?? {};

    const saved = monobankTokenService.get();
    if (!saved) return;

    if (get().syncStatus === 'syncing') return;

    set({ syncStatus: 'syncing', lastSyncErrorMessage: null });

    try {
      const service = getMonobankService(saved.token);
      const syncService = new TransactionSyncService(transactionsRepository, cardsRepository);
      await syncService.syncAllAccounts(userId, service);

      const transactions = await transactionsRepository.getAll();
      set({ transactions, syncStatus: 'idle' });
    } catch (error) {
      if (error instanceof MonobankError && error.code === 'RATE_LIMITED') {
        if (!silent) {
          const retrySeconds = Math.ceil((error.retryAfterMs ?? 60000) / 1000);
          showErrorBottomSheet({
            title: 'Too Many Requests',
            message: `Monobank API rate limit reached. Please try again in ${retrySeconds} seconds.`,
            buttonTitle: 'Got it',
            onPress: () => {},
          });
        }
        set({ syncStatus: 'idle' });
        return;
      }

      const message =
        error instanceof MonobankError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to sync transactions.';

      if (!silent) {
        showErrorBottomSheet({
          title: 'Sync Failed',
          message,
          buttonTitle: 'OK',
          onPress: () => {},
        });
      }
      set({ syncStatus: 'error', lastSyncErrorMessage: message });
    }
  },

  reset() {
    set({ transactions: [], syncStatus: 'idle', isLoadingFromDb: false, lastSyncErrorMessage: null });
  },
}));
