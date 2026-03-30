import React, { PropsWithChildren } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { makeStyles } from '../theme';

export type AppTextVariant = 'h1' | 'h2' | 'body' | 'caption';
export type AppTextTone = 'primary' | 'secondary' | 'tertiary' | 'inverse';

interface AppTextProps extends PropsWithChildren, TextProps {
  variant?: AppTextVariant;
  tone?: AppTextTone;
  style?: StyleProp<TextStyle>;
}

export const AppText = ({
  children,
  variant = 'body',
  tone = 'primary',
  style,
  ...textProps
}: AppTextProps) => {
  const styles = useStyles();

  return (
    <Text
      {...textProps}
      style={[styles.base, styles[variant], styles[`tone_${tone}`], style]}
    >
      {children}
    </Text>
  );
};

const useStyles = makeStyles(theme => ({
  base: {
    color: theme.colors.textPrimary,
  },
  h1: {
    ...theme.typography.h1,
  },
  h2: {
    ...theme.typography.h2,
  },
  body: {
    ...theme.typography.body,
  },
  caption: {
    ...theme.typography.caption,
  },
  tone_primary: {
    color: theme.colors.textPrimary,
  },
  tone_secondary: {
    color: theme.colors.textSecondary,
  },
  tone_tertiary: {
    color: theme.colors.textMuted,
  },
  tone_inverse: {
    color: theme.colors.background,
  },
}));
