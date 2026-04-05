import type { ComponentType } from 'react';
import { ChevronLeft } from './ChevronLeft';
import type { IconComponentProps } from './types';

/**
 * Icon registry — add new icons here.
 * Each entry: iconName -> SVG component that accepts { size: number; color: string }
 *
 * Steps to add a new icon:
 * 1. Create src/shared/ui/icons/<IconName>.tsx (copy ChevronLeft.tsx as a template)
 * 2. Import it below and add an entry to this map
 * 3. IconName type updates automatically
 */
export const iconRegistry = {
  chevronLeft: ChevronLeft,
} as const satisfies Record<string, ComponentType<IconComponentProps>>;
