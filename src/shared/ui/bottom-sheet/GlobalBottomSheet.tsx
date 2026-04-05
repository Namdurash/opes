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
import { useTheme } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { useGlobalBottomSheetStyles } from './GlobalBottomSheet.styles';

const getVariantIcon = (variant: BottomSheetVariant): IconName | null => {
  switch (variant) {
    case 'error': return 'errorRound';
    case 'success': return 'check';
    case 'info': return null;
  }
};

const getVariantIconColor = (variant: BottomSheetVariant, colors: ReturnType<typeof useTheme>['theme']['colors']): string => {
  switch (variant) {
    case 'error': return colors.error;
    case 'success': return colors.success;
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

  const iconName = config ? getVariantIcon(config.variant) : null;
  const iconColor = config ? getVariantIconColor(config.variant, theme.colors) : undefined;
  const hasActions = config?.actions && config.actions.length > 0;

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
        {iconName && (
          <View style={styles.iconContainer}>
            <Icon name={iconName} size="lg" color={iconColor} />
          </View>
        )}
        {config && (
          <>
            <AppText variant="h2" style={styles.title}>{config.title}</AppText>
            {config.message && (
              <AppText variant="body" style={styles.message}>{config.message}</AppText>
            )}
            <View style={styles.actions}>
              {hasActions
                ? config.actions!.map((action, index) => (
                    <Button
                      key={index}
                      title={action.label}
                      variant={action.variant ?? 'primary'}
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
