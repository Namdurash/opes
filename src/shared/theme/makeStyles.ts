import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './useTheme';
import { Theme } from './theme';

export const makeStyles = <T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (theme: Theme) => T,
) => () => {
  const { theme } = useTheme();
  return useMemo(() => StyleSheet.create(styleFactory(theme)), [theme]);
};
