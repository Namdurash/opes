import React from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { ConnectMonobankScreenNavigationProp } from '../../app/navigation';
import { ROOT_ROUTES } from '../../app/navigation';
import { useUserStore } from '../../stores/useUserStore';
import { AppText, Button, FormInput, HeaderBackButton, HeaderTitle, Screen } from '../../shared/ui';
import { connectMonobankSchema } from '../../shared/validation';
import type { ConnectMonobankFormValues } from '../../shared/validation';
import { useMonobankStore } from './state/useMonobankStore';
import { useConnectMonobankScreenStyles } from './ConnectMonobankScreen.styles';

const MONOBANK_TOKEN_URL = 'https://api.monobank.ua/';

export const ConnectMonobankScreen = () => {
  const navigation = useNavigation<ConnectMonobankScreenNavigationProp>();
  const styles = useConnectMonobankScreenStyles();

  const { currentUserId, isCheckedIn, markCheckedIn } = useUserStore(
    useShallow(state => ({ currentUserId: state.currentUserId, isCheckedIn: state.isCheckedIn, markCheckedIn: state.markCheckedIn })),
  );

  const { status, clientName, errorMessage, connect, disconnect, loadSavedToken } =
    useMonobankStore(
      useShallow(state => ({
        status: state.status,
        clientName: state.clientName,
        errorMessage: state.errorMessage,
        connect: state.connect,
        disconnect: state.disconnect,
        loadSavedToken: state.loadSavedToken,
      })),
    );

  const { control, handleSubmit, setValue } = useForm<ConnectMonobankFormValues>({
    resolver: yupResolver(connectMonobankSchema),
    defaultValues: { token: '' },
  });

  React.useEffect(() => {
    const savedToken = loadSavedToken();
    if (savedToken) {
      setValue('token', savedToken);
    }
  }, [loadSavedToken, setValue]);

  React.useEffect(() => {
    if (status === 'connected' && !isCheckedIn) {
      markCheckedIn().then(() => navigation.replace(ROOT_ROUTES.HOME));
    }
  }, [status, isCheckedIn, markCheckedIn, navigation]);

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  const onConnect = handleSubmit(data => {
    connect(currentUserId!, data.token);
  });

  return (
    <Screen
      headerLeft={<HeaderBackButton onPress={() => { navigation.goBack(); }} />}
      headerCenter={<HeaderTitle>Connect Monobank</HeaderTitle>}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <AppText variant="h1">Connect Monobank</AppText>
          <AppText tone="secondary">
            Link your Monobank account to import accounts and transactions automatically.
          </AppText>
        </View>

        {isConnected ? (
          <View style={styles.connectedCard}>
            <View style={styles.badge}>
              <AppText variant="caption" style={styles.badgeText}>Connected</AppText>
            </View>
            {clientName ? (
              <AppText variant="h2">{clientName}</AppText>
            ) : null}
            <AppText tone="secondary">Your Monobank account is linked.</AppText>
          </View>
        ) : (
          <View style={styles.form}>
            <FormInput
              control={control}
              name="token"
              label="Personal Token"
              placeholder="Paste your token here"
              autoCapitalize="none"
              autoCorrect={false}
              disabled={isConnecting}
              multiline
            />
            <AppText variant="caption" style={styles.hint}>
              Open the Monobank developer portal, scroll to "Personal use", and copy your token.
            </AppText>
            <Button
              title="Get my token"
              variant="secondary"
              onPress={() => { Linking.openURL(MONOBANK_TOKEN_URL); }}
            />
          </View>
        )}

        {errorMessage ? (
          <AppText variant="caption" style={styles.error}>
            {errorMessage}
          </AppText>
        ) : null}

        <View style={styles.spacer} />

        {isConnected ? (
          <Button title="Disconnect" variant="secondary" onPress={disconnect} />
        ) : (
          <Button
            title="Connect"
            onPress={onConnect}
            loading={isConnecting}
            disabled={isConnecting}
          />
        )}
      </ScrollView>
    </Screen>
  );
};
