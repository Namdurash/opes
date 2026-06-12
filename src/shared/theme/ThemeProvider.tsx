import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode, themes } from './theme';
import { getStoredThemeMode, setStoredThemeMode } from './themeStorage';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const systemScheme = useColorScheme();

  // Persisted choice wins; otherwise default to the current system scheme.
  const [mode, setModeState] = useState<ThemeMode>(
    () => getStoredThemeMode() ?? (systemScheme === 'dark' ? 'dark' : 'light'),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setStoredThemeMode(next);
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[mode], mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return value;
};
