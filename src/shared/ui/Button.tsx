import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from 'react-native';
import { makeStyles } from '../theme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const styles = useStyles();
  const isDisabled = disabled || loading;

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
          color={variant === 'primary' ? styles.primaryText.color : styles.secondaryText.color}
        />
      ) : (
        <AppText
          variant="body"
          style={variant === 'primary' ? styles.primaryText : styles.secondaryText}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryPressed: {
    backgroundColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: theme.colors.background,
    ...theme.typography.button,
  },
  secondaryText: {
    color: theme.colors.textPrimary,
    ...theme.typography.button,
  },
}));
