import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateCardScreen } from '../../features/cards';
import { HomeScreen } from '../../features/home';
import { ConnectMonobankScreen } from '../../features/monobank';
import { TransactionsScreen } from '../../features/transactions';
import { RegistrationScreen } from '../../features/registration';
import { SignInScreen } from '../../features/sign-in';
import { ROOT_ROUTES } from './routes';
import { RootStackParamList } from './types';
import { useAuthStore } from '../../stores/useAuthStore';
import { AppText, Screen } from '../../shared/ui';
import { makeStyles } from '../../shared/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useAuthStore(state => state.status);
  const bootstrap = useAuthStore(state => state.bootstrap);
  const styles = useStyles();

  React.useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'checking') {
    return (
      <Screen>
        <View style={styles.centered}>
          <AppText>Loading...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={
        status === 'registered' ? ROOT_ROUTES.HOME : ROOT_ROUTES.SIGN_IN
      }
      screenOptions={{ headerShown: false }}
    >
      {status === 'registered' ? (
        <>
          <Stack.Screen
            component={HomeScreen}
            name={ROOT_ROUTES.HOME}
            options={{ title: 'Home' }}
          />
          <Stack.Screen
            component={TransactionsScreen}
            name={ROOT_ROUTES.TRANSACTIONS}
            options={{ title: 'Transactions' }}
          />
          <Stack.Screen
            component={CreateCardScreen}
            name={ROOT_ROUTES.CREATE_CARD}
            options={{ headerShown: true, title: 'Create card' }}
          />
          <Stack.Screen
            component={ConnectMonobankScreen}
            name={ROOT_ROUTES.CONNECT_MONOBANK}
            options={{ headerShown: true, title: 'Connect Monobank' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            component={SignInScreen}
            name={ROOT_ROUTES.SIGN_IN}
            options={{ title: 'Sign in' }}
          />
          <Stack.Screen
            component={RegistrationScreen}
            name={ROOT_ROUTES.REGISTRATION}
            options={{ title: 'Registration' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const useStyles = makeStyles(() => ({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
