import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateCardScreen } from '../../features/cards';
import { HomeScreen } from '../../features/home';
import { ConnectMonobankScreen } from '../../features/monobank';
import { TransactionsScreen } from '../../features/transactions';
import { WelcomeScreen } from '../../features/welcome';
import { ROOT_ROUTES } from './routes';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROOT_ROUTES.WELCOME}
      screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: true }}
    >
      <Stack.Screen
        component={WelcomeScreen}
        name={ROOT_ROUTES.WELCOME}
      />
      <Stack.Screen
        component={HomeScreen}
        name={ROOT_ROUTES.HOME}
      />
      <Stack.Screen
        component={TransactionsScreen}
        name={ROOT_ROUTES.TRANSACTIONS}
      />
      <Stack.Screen
        component={CreateCardScreen}
        name={ROOT_ROUTES.CREATE_CARD}
      />
      <Stack.Screen
        component={ConnectMonobankScreen}
        name={ROOT_ROUTES.CONNECT_MONOBANK}
      />
    </Stack.Navigator>
  );
}
