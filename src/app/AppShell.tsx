import React, { useReducer } from 'react';
import { Pressable, View } from 'react-native';
import { HomeScreen } from '../features/home';
import { TransactionsScreen } from '../features/transactions';
import { AppText } from '../shared/ui';
import { makeStyles } from '../shared/theme';
import { appReducer, initialAppState } from '../state';
import { AppRoute } from './navigation/types';

const NAV_ITEMS: Array<{ route: AppRoute; label: string }> = [
  { route: 'home', label: 'Home' },
  { route: 'transactions', label: 'Transactions' },
];

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const styles = useStyles();

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
              <AppText tone={isActive ? 'primary' : 'tertiary'} variant="caption">
                {item.label}
              </AppText>
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

const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  navButtonActive: {
    backgroundColor: theme.colors.border,
  },
}));
