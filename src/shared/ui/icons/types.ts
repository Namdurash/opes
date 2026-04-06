import type { iconRegistry } from './registry';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export type IconName = keyof typeof iconRegistry;

export interface IconComponentProps {
  size: number;
  color: string;
}

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
}
