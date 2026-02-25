import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../features/home';
import { TransactionsScreen } from '../../features/transactions';
import { ROOT_ROUTES } from './routes';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROOT_ROUTES.HOME}>
      <Stack.Screen component={HomeScreen} name={ROOT_ROUTES.HOME} options={{ title: 'Home' }} />
      <Stack.Screen
        component={TransactionsScreen}
        name={ROOT_ROUTES.TRANSACTIONS}
        options={{ title: 'Transactions' }}
      />
    </Stack.Navigator>
  );
}
