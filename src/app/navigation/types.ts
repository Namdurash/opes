import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ROOT_ROUTES } from './routes';

export type RootStackParamList = {
  [ROOT_ROUTES.WELCOME]: undefined;
  [ROOT_ROUTES.HOME]: undefined;
  [ROOT_ROUTES.TRANSACTIONS]: { filter?: { categoryId?: string; month?: string } } | undefined;
  [ROOT_ROUTES.CARD_DETAIL]: { cardId: string };
  // `cardId` switches the screen into edit mode; omit it to create a new card.
  [ROOT_ROUTES.CREATE_CARD]: { cardId?: string } | undefined;
  [ROOT_ROUTES.CONNECT_MONOBANK]: undefined;
  [ROOT_ROUTES.DONATIONS]: undefined;
  [ROOT_ROUTES.SETTINGS]: undefined;
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
export type CardDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.CARD_DETAIL
>;
export type CreateCardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.CREATE_CARD
>;
export type ConnectMonobankScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.CONNECT_MONOBANK
>;
export type DonationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.DONATIONS
>;
export type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROOT_ROUTES.SETTINGS
>;
