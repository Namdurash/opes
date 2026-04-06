import React from 'react';
import { useTheme } from '../../theme';
import { iconRegistry } from './registry';
import type { IconProps, IconSize } from './types';

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 56,
};

export const Icon = ({ name, size = 'md', color }: IconProps) => {
  const { theme: { colors } } = useTheme();
  const Component = iconRegistry[name];

  return <Component size={SIZE_MAP[size]} color={color ?? colors.textPrimary} />;
};
