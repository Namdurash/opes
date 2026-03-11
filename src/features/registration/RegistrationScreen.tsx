import React from 'react';
import { TextInput, View } from 'react-native';
import { AppText, Button, Screen } from '../../shared/ui';
import { useRegistrationStore } from './state/useRegistrationStore';
import { useRegistrationStyles } from './RegistrationScreen.styles';
import { useAuthStore } from '../../stores/useAuthStore';

export function RegistrationScreen() {
  const styles = useRegistrationStyles();
  const markRegistered = useAuthStore(state => state.markRegistered);

  const {
    name,
    password,
    cardName,
    isCardVisible,
    isSubmitting,
    errorMessage,
    setName,
    setPassword,
    setCardName,
    showCardField,
    submit,
  } = useRegistrationStore();

  const onSubmit = async () => {
    const success = await submit();
    if (success) {
      markRegistered();
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="h1">Registration</AppText>
        <AppText tone="secondary">Create your local profile to continue.</AppText>

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

          {isCardVisible ? (
            <View>
              <AppText variant="caption" tone="secondary" style={styles.sectionHeader}>
                Card name
              </AppText>
              <TextInput
                onChangeText={setCardName}
                placeholder="Enter card name"
                style={styles.input}
                value={cardName}
              />
            </View>
          ) : (
            <Button onPress={showCardField} style={styles.addCardButton} title="Add card" variant="secondary" />
          )}

          {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}

          <Button loading={isSubmitting} onPress={onSubmit} title="Continue" />
        </View>
      </View>
    </Screen>
  );
}
