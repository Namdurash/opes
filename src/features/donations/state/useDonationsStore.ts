import { create } from 'zustand';
import type { Transaction } from '../../../domain/transactions';
import { TransactionsRepository } from '../../../models/transactions';
import { UserOverridesRepository } from '../../../models/userOverrides';
import { MerchantRulesRepository } from '../../../models/merchantRules';
import { CategorizationService } from '../../../services/categorization';
import { showErrorBottomSheet } from '../../../shared/ui/bottom-sheet';

const DONATIONS_CATEGORY_ID = 'donations';

const transactionsRepository = new TransactionsRepository();
const categorizationService = new CategorizationService(
  new UserOverridesRepository(),
  new MerchantRulesRepository(),
);

interface DonationsState {
  donations: Transaction[];
  isLoading: boolean;
  loadDonations: () => Promise<void>;
}

export const useDonationsStore = create<DonationsState>(set => ({
  donations: [],
  isLoading: false,
  loadDonations: async () => {
    set({ isLoading: true });

    try {
      const transactions = await transactionsRepository.getAll();
      const categorized = await categorizationService.resolveCategories(transactions);
      const donations = categorized
        .filter(({ category }) => category.id === DONATIONS_CATEGORY_ID)
        .map(({ transaction }) => transaction);

      set({ donations, isLoading: false });
    } catch {
      set({ isLoading: false });
      showErrorBottomSheet({
        title: 'Load Failed',
        message: 'Failed to load donations.',
        buttonTitle: 'OK',
        onPress: () => {},
      });
    }
  },
}));
