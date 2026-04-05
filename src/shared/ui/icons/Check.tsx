import React from 'react';
import CheckSvg from './assets/Check.svg';
import type { IconComponentProps } from './types';

export const Check = ({ size, color }: IconComponentProps) => (
  <CheckSvg width={size} height={size} color={color} />
);
