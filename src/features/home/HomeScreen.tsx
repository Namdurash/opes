import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../shared/ui';

export function HomeScreen() {
  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>Overview placeholder for balances and monthly stats.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
  },
});
