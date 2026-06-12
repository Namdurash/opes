import React from 'react';
import { Linking, ScrollView, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { ConnectMonobankScreenNavigationProp } from '../../app/navigation';
import { ROOT_ROUTES } from '../../app/navigation';
import { useUserStore } from '../../stores/useUserStore';
import { AppText, Button, FormInput, HeaderBackButton, HeaderTitle, Screen } from '../../shared/ui';
import { useTheme } from '../../shared/theme';
import { formatMoney } from '../../shared/utils';
import { connectMonobankSchema } from '../../shared/validation';
import type { ConnectMonobankFormValues } from '../../shared/validation';
import { useMonobankStore } from './state/useMonobankStore';
import { useConnectMonobankScreenStyles } from './ConnectMonobankScreen.styles';

const MONOBANK_TOKEN_URL = 'https://api.monobank.ua/';

export const ConnectMonobankScreen = () => {
  const navigation = useNavigation<ConnectMonobankScreenNavigationProp>();
  const styles = useConnectMonobankScreenStyles();
  const { theme } = useTheme();

  const { currentUserId, isCheckedIn, markCheckedIn } = useUserStore(
    useShallow(state => ({ currentUserId: state.currentUserId, isCheckedIn: state.isCheckedIn, markCheckedIn: state.markCheckedIn })),
  );

  const { status, clientName, accounts, selectedAccountIds, connect, disconnect, loadSavedToken, loadAccounts, toggleAccount } =
    useMonobankStore(
      useShallow(state => ({
        status: state.status,
        clientName: state.clientName,
        accounts: state.accounts,
        selectedAccountIds: state.selectedAccountIds,
        connect: state.connect,
        disconnect: state.disconnect,
        loadSavedToken: state.loadSavedToken,
        loadAccounts: state.loadAccounts,
        toggleAccount: state.toggleAccount,
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

  React.useEffect(() => {
    if (status === 'connected' && currentUserId) {
      loadAccounts(currentUserId);
    }
  }, [status, currentUserId, loadAccounts]);

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  const isAccountEnabled = (accountId: string): boolean =>
    selectedAccountIds == null || selectedAccountIds.includes(accountId);

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
          <>
            <View style={styles.connectedCard}>
              <View style={styles.badge}>
                <AppText variant="caption" style={styles.badgeText}>Connected</AppText>
              </View>
              {clientName ? (
                <AppText variant="h2">{clientName}</AppText>
              ) : null}
              <AppText tone="secondary">Your Monobank account is linked.</AppText>
            </View>

            {accounts.length > 0 ? (
              <View style={styles.accountsSection}>
                <AppText variant="h2">Accounts to sync</AppText>
                <AppText variant="caption" tone="secondary">
                  Only the accounts you enable are synced.
                </AppText>
                {accounts.map(account => {
                  const accountId = account.monobankAccountId;
                  if (!accountId) {
                    return null;
                  }
                  return (
                    <View key={account.id} style={styles.accountRow}>
                      <View style={styles.accountInfo}>
                        <AppText numberOfLines={1}>{account.title}</AppText>
                        <AppText variant="caption" tone="secondary">
                          {formatMoney(account.moneyAmount, {
                            code: account.currencyCode,
                            symbol: account.currencySymbol,
                          })}
                        </AppText>
                      </View>
                      <Switch
                        value={isAccountEnabled(accountId)}
                        onValueChange={() => toggleAccount(accountId)}
                        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
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
