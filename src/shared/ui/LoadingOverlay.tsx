import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme';
import { useLoadingOverlayStyles } from './LoadingOverlay.styles';

export const LoadingOverlay = () => {
  const { theme } = useTheme();
  const styles = useLoadingOverlayStyles();

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.backdrop} />
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};
