import { create } from 'zustand';
import { MonobankService, MonobankError } from '../../../services/monobank';
import { monobankTokenService } from '../../../services/monobank/MonobankTokenService';
import type { MonobankStoreState, MonobankStoreActions } from '../types';

export const useMonobankStore = create<MonobankStoreState & MonobankStoreActions>((set, get) => ({
  token: '',
  status: 'idle',
  clientName: null,
  errorMessage: null,

  setToken(token) {
    set({ token, errorMessage: null });
  },

  async connect() {
    const { token } = get();
    const trimmed = token.trim();

    if (!trimmed) {
      set({ errorMessage: 'Please enter your Monobank personal token.' });
      return;
    }

    set({ status: 'connecting', errorMessage: null });

    try {
      const service = new MonobankService(trimmed);
      const clientInfo = await service.getClientInfo();
      monobankTokenService.save(trimmed, clientInfo.name);
      set({ status: 'connected', clientName: clientInfo.name, errorMessage: null });
    } catch (error) {
      const message =
        error instanceof MonobankError
          ? error.message
          : 'Failed to connect. Please check your token and try again.';
      set({ status: 'error', errorMessage: message });
    }
  },

  disconnect() {
    monobankTokenService.clear();
    set({ status: 'idle', token: '', clientName: null, errorMessage: null });
  },

  loadSavedToken() {
    const saved = monobankTokenService.get();
    if (!saved) return;
    set({ token: saved.token, status: 'connected', clientName: saved.clientName || null });
  },
}));
