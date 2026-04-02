import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ROOT_ROUTES } from './routes';

export type RootStackParamList = {
  [ROOT_ROUTES.WELCOME]: undefined;
  [ROOT_ROUTES.HOME]: undefined;
  [ROOT_ROUTES.TRANSACTIONS]: undefined;
  [ROOT_ROUTES.CREATE_CARD]: undefined;
  [ROOT_ROUTES.CONNECT_MONOBANK]: undefined;
};

export type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.WELCOME
>;
export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.HOME
>;
export type TransactionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.TRANSACTIONS
>;
export type CreateCardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.CREATE_CARD
>;
export type ConnectMonobankScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.CONNECT_MONOBANK
>;
