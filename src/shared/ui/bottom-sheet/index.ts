export { GlobalBottomSheet } from './GlobalBottomSheet';
export type { BottomSheetConfig, BottomSheetAction, BottomSheetVariant } from '../../../stores/useBottomSheetStore';

import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import type { BottomSheetConfig } from '../../../stores/useBottomSheetStore';

export const showBottomSheet = (config: BottomSheetConfig): void => {
  useBottomSheetStore.getState().show(config);
};
