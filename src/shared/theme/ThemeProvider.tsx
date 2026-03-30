import React, { PropsWithChildren, createContext, useContext } from 'react';
import { Theme, lightTheme } from './theme';

interface ThemeContextValue {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: PropsWithChildren) => (
  <ThemeContext.Provider value={{ theme: lightTheme }}>
    {children}
  </ThemeContext.Provider>
);

export const useThemeContext = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return value;
};
