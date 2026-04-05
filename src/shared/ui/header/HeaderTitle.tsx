import React from 'react';
import { AppText } from '../AppText';

interface HeaderTitleProps {
  children: string;
}

export const HeaderTitle = ({ children }: HeaderTitleProps) => (
  <AppText variant="body">{children}</AppText>
);
