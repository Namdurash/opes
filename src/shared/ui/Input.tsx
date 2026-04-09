import React, { useState, forwardRef } from 'react';
import type { ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { makeStyles } from '../theme';
import { AppText } from './AppText';

export interface InputProps extends Omit<TextInputProps, 'style' | 'editable'> {
  label?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      disabled = false,
      leftIcon,
      rightIcon,
      containerStyle,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref,
  ) => {
    const styles = useStyles();
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus: InputProps['onFocus'] = e => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur: InputProps['onBlur'] = e => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={containerStyle}>
        {label ? (
          <AppText variant="caption" tone="secondary" style={styles.label}>
            {label}
          </AppText>
        ) : null}

        <View
          style={[
            styles.inputRow,
            isFocused && styles.inputRowFocused,
            !!error && styles.inputRowError,
            disabled && styles.inputRowDisabled,
          ]}
        >
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            {...textInputProps}
            editable={!disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.textInput,
              textInputProps.multiline && styles.textInputMultiline,
            ]}
            placeholderTextColor={styles.placeholder.color}
          />

          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>

        {error ? (
          <AppText variant="caption" style={styles.errorText}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const useStyles = makeStyles(theme => ({
  label: {
    marginBottom: theme.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
  },
  inputRowFocused: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  inputRowError: {
    borderColor: theme.colors.error,
  },
  inputRowDisabled: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textPrimary,
  },
  textInputMultiline: {
    textAlignVertical: 'top' as const,
    minHeight: 40,
  },
  iconLeft: {
    paddingLeft: theme.spacing.md,
  },
  iconRight: {
    paddingRight: theme.spacing.md,
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
}));
