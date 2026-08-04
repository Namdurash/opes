import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../shared/ui';
import { useTheme } from '../../../shared/theme';
import { useFilterChipStyles } from './FilterChip.styles';

interface FilterChipProps {
  label: string;
  onDismiss: () => void;
  testID?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onDismiss, testID }) => {
  const styles = useFilterChipStyles();
  const { theme } = useTheme();

  return (
    <View style={styles.pill} testID={testID}>
      <AppText style={styles.label}>{label}</AppText>
      <Pressable onPress={onDismiss} hitSlop={theme.spacing.sm}>
        <AppText style={styles.dismissText}>×</AppText>
      </Pressable>
    </View>
  );
};
