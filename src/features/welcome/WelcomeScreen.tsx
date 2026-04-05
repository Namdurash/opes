import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { WelcomeScreenNavigationProp, ROOT_ROUTES } from '../../app/navigation';
import { useUserStore } from '../../stores/useUserStore';
import { AppText, Button, Screen } from '../../shared/ui';
import { useWelcomeScreenStyles } from './WelcomeScreen.styles';

export const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const styles = useWelcomeScreenStyles();

  const { status, isCheckedIn, bootstrap, markCheckedIn } = useUserStore(
    useShallow(state => ({
      status: state.status,
      isCheckedIn: state.isCheckedIn,
      bootstrap: state.bootstrap,
      markCheckedIn: state.markCheckedIn,
    })),
  );

  React.useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  React.useEffect(() => {
    if (status === 'ready' && isCheckedIn) {
      navigation.replace(ROOT_ROUTES.HOME);
    }
  }, [status, isCheckedIn, navigation]);

  const onConnectMonobank = () => {
    navigation.navigate(ROOT_ROUTES.CONNECT_MONOBANK);
  };

  const onProceedWithout = async () => {
    await markCheckedIn();
    navigation.replace(ROOT_ROUTES.HOME);
  };

  if (status === 'bootstrapping') {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText>Loading...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen background="gradient">
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="h1">Welcome to Opes</AppText>
          <AppText tone="secondary">Track your finances in one place.</AppText>
        </View>

        <View style={styles.actions}>
          <Button
            title="Connect Monobank"
            onPress={() => { onConnectMonobank(); }}
          />
          <Button
            title="Proceed without integration"
            onPress={() => { onProceedWithout(); }}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
};
