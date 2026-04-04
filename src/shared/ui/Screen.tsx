import React, { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { makeStyles, useTheme } from '../theme';

export type ScreenBackground = 'blank' | 'gradient';

interface ScreenProps extends PropsWithChildren {
  contentStyle?: StyleProp<ViewStyle>;
  background?: ScreenBackground;
}

export const Screen = ({ children, contentStyle, background = 'blank' }: ScreenProps) => {
  const styles = useStyles();
  const { theme: { colors } } = useTheme();

  const content = (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  if (background === 'gradient') {
    return (
      <LinearGradient
        colors={[colors.gradientLightPurple, colors.gradientBoldPurple]}
        style={styles.safeArea}
      >
        <SafeAreaView style={styles.fill}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
};

const useStyles = makeStyles(theme => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
}));
