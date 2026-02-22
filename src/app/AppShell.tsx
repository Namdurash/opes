import React, { useReducer } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HomeScreen } from '../features/home';
import { TransactionsScreen } from '../features/transactions';
import { appReducer, initialAppState } from '../state';
import { AppRoute } from './navigation/types';

const NAV_ITEMS: Array<{ route: AppRoute; label: string }> = [
  { route: 'home', label: 'Home' },
  { route: 'transactions', label: 'Transactions' },
];

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen(state.route)}</View>
      <View style={styles.navBar}>
        {NAV_ITEMS.map(item => {
          const isActive = state.route === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => dispatch({ type: 'navigate', route: item.route })}
              style={[styles.navButton, isActive && styles.navButtonActive]}
            >
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function renderScreen(route: AppRoute) {
  if (route === 'transactions') {
    return <TransactionsScreen />;
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  navButtonActive: {
    backgroundColor: '#E5E7EB',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  navLabelActive: {
    color: '#111827',
  },
});
