import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ROOT_ROUTES } from './routes';

export type RootStackParamList = {
  [ROOT_ROUTES.SIGN_IN]: undefined;
  [ROOT_ROUTES.REGISTRATION]: undefined;
  [ROOT_ROUTES.HOME]: undefined;
  [ROOT_ROUTES.TRANSACTIONS]: undefined;
};

export type SignInScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.SIGN_IN
>;
export type RegistrationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.REGISTRATION
>;

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.HOME
>;
export type TransactionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.TRANSACTIONS
>;
