import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useShallow } from 'zustand/shallow';
import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';
import type { BottomSheetVariant } from '../../../stores/useBottomSheetStore';
import type { ButtonVariant } from '../Button';
import { useTheme } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { useGlobalBottomSheetStyles } from './GlobalBottomSheet.styles';

const VARIANT_ICON: Record<BottomSheetVariant, IconName | null> = {
  success: 'check',
  error: 'errorRound',
  info: null,
};

const VARIANT_BUTTON: Record<BottomSheetVariant, ButtonVariant> = {
  success: 'success',
  error: 'danger',
  info: 'primary',
};

const getVariantIconColor = (
  variant: BottomSheetVariant,
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string => {
  switch (variant) {
    case 'success': return colors.success;
    case 'error': return colors.error;
    case 'info': return colors.primary;
  }
};

export const GlobalBottomSheet = () => {
  const { visible, config, hide } = useBottomSheetStore(
    useShallow(state => ({ visible: state.visible, config: state.config, hide: state.hide })),
  );
  const { theme } = useTheme();
  const styles = useGlobalBottomSheetStyles();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    config?.onDismiss?.();
    hide();
  }, [config, hide]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const iconName = config ? VARIANT_ICON[config.variant] : null;
  const iconColor = config ? getVariantIconColor(config.variant, theme.colors) : undefined;
  const defaultButtonVariant = config ? VARIANT_BUTTON[config.variant] : 'primary';

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        {iconName && iconColor && (
          <View style={styles.iconContainer}>
            <Icon name={iconName} size="xl" color={iconColor} />
          </View>
        )}
        {config && (
          <>
            <AppText variant="h2" style={styles.title}>{config.title}</AppText>
            {config.message && (
              <AppText variant="body" style={styles.message}>{config.message}</AppText>
            )}
            <View style={styles.actions}>
              {config.actions && config.actions.length > 0
                ? config.actions.map((action, index) => (
                    <Button
                      key={index}
                      title={action.label}
                      variant={action.variant ?? defaultButtonVariant}
                      onPress={() => { action.onPress(); hide(); }}
                    />
                  ))
                : <Button title="Close" variant="secondary" onPress={handleDismiss} />
              }
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};
