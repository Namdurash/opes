import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

export const useAppForegroundSync = (onForeground: () => void): void => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        onForeground();
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [onForeground]);
};
