export { GlobalBottomSheet } from './GlobalBottomSheet';
export type { BottomSheetConfig, BottomSheetAction, BottomSheetVariant } from '../../../stores/useBottomSheetStore';

import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import type { BottomSheetConfig } from '../../../stores/useBottomSheetStore';

export const showBottomSheet = (config: BottomSheetConfig): void => {
  useBottomSheetStore.getState().show(config);
};

interface NotificationSheetConfig {
  title: string;
  message?: string;
  buttonTitle: string;
  onPress: () => void;
}

export const showSuccessBottomSheet = ({
  title,
  message,
  buttonTitle,
  onPress,
}: NotificationSheetConfig): void => {
  showBottomSheet({
    variant: 'success',
    title,
    message,
    actions: [{ label: buttonTitle, onPress, variant: 'success' }],
  });
};

export const showErrorBottomSheet = ({
  title,
  message,
  buttonTitle,
  onPress,
}: NotificationSheetConfig): void => {
  showBottomSheet({
    variant: 'error',
    title,
    message,
    actions: [{ label: buttonTitle, onPress, variant: 'danger' }],
  });
};
