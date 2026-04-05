import React from 'react';
import ChevronLeftSvg from './assets/ChevronLeft.svg';
import type { IconComponentProps } from './types';

export const ChevronLeft = ({ size, color }: IconComponentProps) => (
  <ChevronLeftSvg width={size} height={size} color={color} />
);
