import React from 'react';
import { Linking, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { ConnectMonobankScreenNavigationProp, ROOT_ROUTES } from '../../app/navigation';
import { useUserStore } from '../../stores/useUserStore';
import { AppText, Button, HeaderBackButton, HeaderTitle, Screen } from '../../shared/ui';
import { useMonobankStore } from './state/useMonobankStore';
import { useConnectMonobankScreenStyles } from './ConnectMonobankScreen.styles';

const MONOBANK_TOKEN_URL = 'https://api.monobank.ua/';

export const ConnectMonobankScreen = () => {
  const navigation = useNavigation<ConnectMonobankScreenNavigationProp>();
  const styles = useConnectMonobankScreenStyles();

  const { currentUserId, isCheckedIn, markCheckedIn } = useUserStore(
    useShallow(state => ({ currentUserId: state.currentUserId, isCheckedIn: state.isCheckedIn, markCheckedIn: state.markCheckedIn })),
  );

  const { token, status, clientName, errorMessage, setToken, connect, disconnect, loadSavedToken } =
    useMonobankStore(
      useShallow(state => ({
        token: state.token,
        status: state.status,
        clientName: state.clientName,
        errorMessage: state.errorMessage,
        setToken: state.setToken,
        connect: state.connect,
        disconnect: state.disconnect,
        loadSavedToken: state.loadSavedToken,
      })),
    );

  React.useEffect(() => {
    loadSavedToken();
  }, [loadSavedToken]);

  React.useEffect(() => {
    if (status === 'connected' && !isCheckedIn) {
      markCheckedIn().then(() => navigation.replace(ROOT_ROUTES.HOME));
    }
  }, [status, isCheckedIn, markCheckedIn, navigation]);

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <Screen
      headerLeft={<HeaderBackButton onPress={() => { navigation.goBack(); }} />}
      headerCenter={<HeaderTitle>Connect Monobank</HeaderTitle>}
    >
      <View style={styles.content}>
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
            <AppText variant="caption" style={styles.label}>Personal Token</AppText>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="Paste your token here"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isConnecting}
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
            onPress={() => { connect(currentUserId!); }}
            loading={isConnecting}
            disabled={isConnecting}
          />
        )}
      </View>
    </Screen>
  );
}
