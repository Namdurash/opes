import React from 'react';
import { TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, Screen } from '../../shared/ui';
import { useAuthStore } from '../../stores/useAuthStore';
import { ROOT_ROUTES, SignInScreenNavigationProp } from '../../app/navigation';
import { useSignInStore } from './state/useSignInStore';
import { useSignInStyles } from './SignInScreen.styles';

export function SignInScreen() {
  const styles = useSignInStyles();
  const markRegistered = useAuthStore(state => state.markRegistered);
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const {
    name,
    password,
    isSubmitting,
    errorMessage,
    setName,
    setPassword,
    submit,
  } = useSignInStore();

  const onSubmit = async () => {
    const success = await submit();
    if (success) {
      markRegistered();
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="h1">Sign in</AppText>
        <AppText tone="secondary">Use your existing local profile to continue.</AppText>

        <View style={styles.card}>
          <View>
            <AppText variant="caption" tone="secondary" style={styles.sectionHeader}>
              Name
            </AppText>
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Enter your name"
              style={styles.input}
              value={name}
            />
          </View>

          <View>
            <AppText variant="caption" tone="secondary" style={styles.sectionHeader}>
              Password
            </AppText>
            <TextInput
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}

          <Button loading={isSubmitting} onPress={onSubmit} title="Sign in" />
          <Button
            onPress={() => navigation.navigate(ROOT_ROUTES.REGISTRATION)}
            title="Sign up"
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
