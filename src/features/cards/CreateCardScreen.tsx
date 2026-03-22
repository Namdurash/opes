import React from 'react';
import { Image, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { CardType } from '../../domain/auth';
import { CreateCardScreenNavigationProp } from '../../app/navigation';
import { AppText, Button, Screen } from '../../shared/ui';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCardsStore } from './state/useCardsStore';
import { useCreateCardScreenStyles } from './CreateCardScreen.styles';

const CARD_TYPES: CardType[] = ['salary', 'credit', 'storage'];

export function CreateCardScreen() {
  const styles = useCreateCardScreenStyles();
  const navigation = useNavigation<CreateCardScreenNavigationProp>();
  const currentUserId = useAuthStore(state => state.currentUserId);
  const title = useCardsStore(state => state.title);
  const moneyAmount = useCardsStore(state => state.moneyAmount);
  const type = useCardsStore(state => state.type);
  const image = useCardsStore(state => state.image);
  const isSubmitting = useCardsStore(state => state.isSubmitting);
  const errorMessage = useCardsStore(state => state.errorMessage);
  const setTitle = useCardsStore(state => state.setTitle);
  const setMoneyAmount = useCardsStore(state => state.setMoneyAmount);
  const setType = useCardsStore(state => state.setType);
  const setImage = useCardsStore(state => state.setImage);
  const setErrorMessage = useCardsStore(state => state.setErrorMessage);
  const createCard = useCardsStore(state => state.createCard);
  const resetForm = useCardsStore(state => state.resetForm);

  React.useEffect(() => {
    resetForm();

    return resetForm;
  }, [resetForm]);

  const onSubmit = async () => {
    if (!currentUserId) {
      return;
    }

    const created = await createCard(currentUserId);
    if (created) {
      navigation.goBack();
    }
  };

  const onSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      setErrorMessage('Failed to select image.');
      return;
    }

    const selectedImage = result.assets?.[0]?.uri;
    if (!selectedImage) {
      setErrorMessage('No image was selected.');
      return;
    }

    setImage(selectedImage);
  };

  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="h1">Create card</AppText>
        <AppText tone="secondary">Add a money source or account for the current user.</AppText>

        <View style={styles.form}>
          <View>
            <AppText variant="caption" tone="secondary" style={styles.sectionHeader}>
              Title
            </AppText>
            <TextInput
              onChangeText={setTitle}
              placeholder="Enter card title"
              style={styles.input}
              value={title}
            />
          </View>

          <View>
            <AppText variant="caption" tone="secondary" style={styles.sectionHeader}>
              Money amount
            </AppText>
            <TextInput
              keyboardType="numeric"
              onChangeText={setMoneyAmount}
              placeholder="Enter amount"
              style={styles.input}
              value={moneyAmount}
            />
          </View>

          <View style={styles.typeSection}>
            <AppText variant="caption" tone="secondary">
              Type
            </AppText>
            <View style={styles.typeRow}>
              {CARD_TYPES.map(cardType => (
                <Button
                  key={cardType}
                  onPress={() => setType(cardType)}
                  style={styles.typeButton}
                  title={cardType}
                  variant={type === cardType ? 'primary' : 'secondary'}
                />
              ))}
            </View>
          </View>

          <View style={styles.imageSection}>
            <AppText variant="caption" tone="secondary">
              Image
            </AppText>
            <Button
              onPress={() => void onSelectImage()}
              title={image ? 'Replace Image' : 'Select Image'}
              variant="secondary"
            />
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : null}
          </View>

          {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}

          <Button loading={isSubmitting} onPress={onSubmit} title="Save card" />
        </View>
      </View>
    </Screen>
  );
}
