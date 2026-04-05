import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';

interface HeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export const Header = ({ left, center, right }: HeaderProps) => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.left}>{left ?? null}</View>

      <View style={styles.center} pointerEvents="box-none">
        {center ?? null}
      </View>

      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
};

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    minHeight: 56,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    zIndex: 1,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginLeft: 'auto',
    zIndex: 1,
  },
}));
