import { create } from 'zustand';
import { MonobankError } from '../../../services/monobank';
import { getMonobankService, clearMonobankService } from '../../../services/monobank/serviceInstance';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import { CardsRepository } from '../../../models/cards';
import { useTransactionsStore } from '../../transactions/state/useTransactionsStore';
import { showErrorBottomSheet } from '../../../shared/ui/bottom-sheet';
import type { MonobankStoreState, MonobankStoreActions } from '../types';

const cardsRepository = new CardsRepository();

export const useMonobankStore = create<MonobankStoreState & MonobankStoreActions>((set) => ({
  status: 'idle',
  clientName: null,
  errorMessage: null,

  async connect(userId: string, token: string) {
    const trimmed = token.trim();

    if (!trimmed) {
      set({ errorMessage: 'Please enter your Monobank personal token.' });
      return;
    }

    set({ status: 'connecting', errorMessage: null });

    try {
      const service = getMonobankService(trimmed);
      const clientInfo = await service.getClientInfo();
      monobankTokenService.save(trimmed, clientInfo.name);

      await cardsRepository.upsertMonobankCards(userId, clientInfo.accounts);

      set({ status: 'connected', clientName: clientInfo.name, errorMessage: null });

      useTransactionsStore.getState().syncFromMonobank(userId).catch(() => {});
    } catch (error) {
      const message =
        error instanceof MonobankError
          ? error.message
          : 'Failed to connect. Please check your token and try again.';
      set({ status: 'error', errorMessage: message });
      showErrorBottomSheet({
        title: 'Connection Failed',
        message,
        buttonTitle: 'OK',
        onPress: () => {},
      });
    }
  },

  disconnect() {
    monobankTokenService.clear();
    clearMonobankService();
    useTransactionsStore.getState().reset();
    set({ status: 'idle', clientName: null, errorMessage: null });
  },

  loadSavedToken() {
    const saved = monobankTokenService.get();
    if (!saved) {
      return null;
    }
    set({ status: 'connected', clientName: saved.clientName ?? null });
    return saved.token;
  },
}));
