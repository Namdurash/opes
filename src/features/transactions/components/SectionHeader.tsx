import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui';
import { useSectionHeaderStyles } from './SectionHeader.styles';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader = ({ title }: SectionHeaderProps) => {
  const styles = useSectionHeaderStyles();

  return (
    <View style={styles.container}>
      <AppText variant="caption" tone="secondary">
        {title}
      </AppText>
    </View>
  );
};
