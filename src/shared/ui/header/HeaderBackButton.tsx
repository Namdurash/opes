import React from 'react';
import { HeaderIconButton } from './HeaderIconButton';

interface HeaderBackButtonProps {
  onPress: () => void;
}

export const HeaderBackButton = ({ onPress }: HeaderBackButtonProps) => (
  <HeaderIconButton icon="chevronLeft" onPress={onPress} />
);
