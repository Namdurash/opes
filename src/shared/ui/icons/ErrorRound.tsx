import React from 'react';
import ErrorRoundSvg from './assets/ErrorRound.svg';
import type { IconComponentProps } from './types';

export const ErrorRound = ({ size, color }: IconComponentProps) => (
  <ErrorRoundSvg width={size} height={size} color={color} />
);
