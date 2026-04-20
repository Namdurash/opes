import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { useEmptyStateStyles } from './EmptyState.styles';

interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => {
  const styles = useEmptyStateStyles();

  return (
    <View style={styles.container}>
      <AppText tone="secondary" style={styles.text}>{message}</AppText>
    </View>
  );
};
