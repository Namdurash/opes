import { create } from 'zustand';
import { Share } from 'react-native';
import { TransactionsRepository } from '../../../models/transactions';
import { resetSandboxEnvironment } from '../../../services/sandbox';
import { showBottomSheet, showErrorBottomSheet } from '../../../shared/ui/bottom-sheet';
// Deep, not through the monobank barrel: that barrel exports ConnectMonobankScreen and
// would close an import cycle back through app/navigation.
import { useMonobankStore } from '../../monobank/state/useMonobankStore';
import type { ExportFormat } from '../utils';
import { transactionsToCsv, transactionsToJson } from '../utils';

const transactionsRepository = new TransactionsRepository();

interface SettingsState {
  isExporting: boolean;
  exportTransactions: (format: ExportFormat) => Promise<void>;
  resetSandbox: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>(set => ({
  isExporting: false,
  exportTransactions: async format => {
    set({ isExporting: true });

    try {
      const transactions = await transactionsRepository.getAll();

      if (transactions.length === 0) {
        showBottomSheet({
          variant: 'info',
          title: 'Nothing to Export',
          message: 'You have no transactions to export yet.',
          actions: [{ label: 'OK', onPress: () => {} }],
        });
        return;
      }

      const content =
        format === 'json'
          ? transactionsToJson(transactions)
          : transactionsToCsv(transactions);

      // Share the serialized data as text — no file-system dependency.
      await Share.share({ title: `opes-transactions.${format}`, message: content });
    } catch {
      showErrorBottomSheet({
        title: 'Export Failed',
        message: 'Failed to export transactions.',
        buttonTitle: 'OK',
        onPress: () => {},
      });
    } finally {
      set({ isExporting: false });
    }
  },

  // No busy flag on purpose: the reset is not atomic and running it twice is the
  // recovery path, so the row has nothing to disable itself against.
  resetSandbox: async () => {
    try {
      await resetSandboxEnvironment();
      // Returns the monobank and transactions stores to their defaults, so the
      // in-memory state matches the database the reset just emptied.
      useMonobankStore.getState().disconnect();
    } catch {
      showErrorBottomSheet({
        title: 'Reset Failed',
        message: 'Failed to reset the sandbox environment.',
        buttonTitle: 'OK',
        onPress: () => {},
      });
    }
  },
}));
