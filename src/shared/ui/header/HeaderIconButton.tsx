import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from '../icons';
import type { IconName } from '../icons';

interface HeaderIconButtonProps {
  icon: IconName;
  onPress: () => void;
}

export const HeaderIconButton = ({ icon, onPress }: HeaderIconButtonProps) => (
  <TouchableOpacity onPress={onPress} hitSlop={8}>
    <Icon name={icon} size="lg" />
  </TouchableOpacity>
);
