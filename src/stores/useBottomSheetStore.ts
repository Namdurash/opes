import { create } from 'zustand';

export type BottomSheetVariant = 'error' | 'success' | 'info';

export interface BottomSheetAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export interface BottomSheetConfig {
  variant: BottomSheetVariant;
  title: string;
  message?: string;
  actions?: BottomSheetAction[];
  onDismiss?: () => void;
}

interface BottomSheetStoreState {
  visible: boolean;
  config: BottomSheetConfig | null;
  show: (config: BottomSheetConfig) => void;
  hide: () => void;
}

export const useBottomSheetStore = create<BottomSheetStoreState>(set => ({
  visible: false,
  config: null,
  show: config => set({ visible: true, config }),
  hide: () => set({ visible: false }),
}));
