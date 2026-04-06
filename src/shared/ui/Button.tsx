import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from 'react-native';
import { makeStyles } from '../theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) => {
  const styles = useStyles();
  const isDisabled = disabled || loading;
  const hasLightText = variant !== 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={hasLightText ? styles.lightText.color : styles.darkText.color}
        />
      ) : (
        <AppText
          variant="body"
          style={hasLightText ? styles.lightText : styles.darkText}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
};

const useStyles = makeStyles(theme => ({
  base: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: {
    backgroundColor: theme.colors.cta,
  },
  primaryPressed: {
    backgroundColor: theme.colors.ctaSoft,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryPressed: {
    backgroundColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.success,
  },
  successPressed: {
    opacity: 0.8,
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  dangerPressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  lightText: {
    color: theme.colors.background,
    ...theme.typography.button,
  },
  darkText: {
    color: theme.colors.textPrimary,
    ...theme.typography.button,
  },
}));
