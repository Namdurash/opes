import React from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { ROOT_ROUTES } from '../../app/navigation';
import type { SettingsScreenNavigationProp } from '../../app/navigation';
import {
  AppText,
  Button,
  HeaderBackButton,
  HeaderTitle,
  Screen,
} from '../../shared/ui';
import { isSandboxBuild } from '../../shared/env';
import { useTheme } from '../../shared/theme';
import { useSettingsStore } from './state/useSettingsStore';
import { useSettingsScreenStyles } from './SettingsScreen.styles';

export const SettingsScreen = () => {
  const styles = useSettingsScreenStyles();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { theme, mode, setMode } = useTheme();

  const { isExporting, exportTransactions, resetSandbox } = useSettingsStore(
    useShallow(state => ({
      isExporting: state.isExporting,
      exportTransactions: state.exportTransactions,
      resetSandbox: state.resetSandbox,
    })),
  );

  const isDark = mode === 'dark';

  // The reset empties the database the whole stack is reading, onboarding flag and all,
  // so the app goes back to the route onboarding starts from rather than keeping a
  // history of screens whose data no longer exists.
  const handleResetSandbox = async (): Promise<void> => {
    await resetSandbox();
    navigation.reset({ index: 0, routes: [{ name: ROOT_ROUTES.WELCOME }] });
  };

  return (
    <Screen
      headerLeft={<HeaderBackButton onPress={() => navigation.goBack()} />}
      headerCenter={<HeaderTitle>Settings</HeaderTitle>}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <AppText variant="h2">Appearance</AppText>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <AppText>Dark mode</AppText>
                <AppText variant="caption" tone="secondary">
                  Switch between the light and dark theme.
                </AppText>
              </View>
              <Switch
                value={isDark}
                onValueChange={next => setMode(next ? 'dark' : 'light')}
                trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h2">Data export</AppText>
          <View style={styles.card}>
            <AppText variant="caption" tone="secondary">
              Export all of your transactions to share or back up.
            </AppText>
            <View style={styles.exportButtons}>
              <Button
                title="Export as JSON"
                variant="secondary"
                loading={isExporting}
                onPress={() => { exportTransactions('json'); }}
              />
              <Button
                title="Export as CSV"
                variant="secondary"
                loading={isExporting}
                onPress={() => { exportTransactions('csv'); }}
              />
            </View>
          </View>
        </View>
        {isSandboxBuild() && (
          <View style={styles.section}>
            <AppText variant="h2">Sandbox</AppText>
            <Pressable
              testID="sandbox-reset-item"
              style={styles.card}
              onPress={() => {
                handleResetSandbox();
              }}
            >
              <View style={styles.settingInfo}>
                <AppText>Reset sandbox data</AppText>
                <AppText variant="caption" tone="secondary">
                  Wipe every card, transaction and connection, then start over from
                  onboarding.
                </AppText>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};
