import { create } from 'zustand';
import { Share } from 'react-native';
import { TransactionsRepository } from '../../../models/transactions';
import { showBottomSheet, showErrorBottomSheet } from '../../../shared/ui/bottom-sheet';
import type { ExportFormat } from '../utils';
import { transactionsToCsv, transactionsToJson } from '../utils';

const transactionsRepository = new TransactionsRepository();

interface SettingsState {
  isExporting: boolean;
  exportTransactions: (format: ExportFormat) => Promise<void>;
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
}));
