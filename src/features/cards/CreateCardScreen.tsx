import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { launchImageLibrary } from 'react-native-image-picker';
import type { CardType } from '../../domain/cards';
import type { CreateCardScreenNavigationProp } from '../../app/navigation';
import { AppText, Button, FormInput, Screen } from '../../shared/ui';
import { createCardSchema } from '../../shared/validation';
import type { CreateCardFormValues } from '../../shared/validation';
import { useUserStore } from '../../stores/useUserStore';
import { useCardsStore } from './state/useCardsStore';
import { useCreateCardStore } from './state/useCreateCardStore';
import { useCreateCardScreenStyles } from './CreateCardScreen.styles';

const CARD_TYPES: CardType[] = ['salary', 'credit', 'storage'];

export const CreateCardScreen = () => {
  const styles = useCreateCardScreenStyles();
  const navigation = useNavigation<CreateCardScreenNavigationProp>();
  const currentUserId = useUserStore(state => state.currentUserId);

  const { control, handleSubmit, reset } = useForm<CreateCardFormValues>({
    resolver: yupResolver(createCardSchema),
    defaultValues: { title: '', moneyAmount: '' },
  });

  const { type, image, isSubmitting, errorMessage, setType, setImage, setErrorMessage, createCard, resetForm } =
    useCreateCardStore(
      useShallow(state => ({
        type: state.type,
        image: state.image,
        isSubmitting: state.isSubmitting,
        errorMessage: state.errorMessage,
        setType: state.setType,
        setImage: state.setImage,
        setErrorMessage: state.setErrorMessage,
        createCard: state.createCard,
        resetForm: state.resetForm,
      })),
    );

  const appendCard = useCardsStore(state => state.appendCard);

  React.useEffect(() => {
    reset();
    resetForm();

    return () => {
      reset();
      resetForm();
    };
  }, [reset, resetForm]);

  const onSubmit = handleSubmit(async data => {
    if (!currentUserId) {
      return;
    }

    const created = await createCard(currentUserId, data);
    if (created) {
      appendCard(created);
      navigation.goBack();
    }
  });

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
      <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
        <AppText variant="h1">Create card</AppText>
        <AppText tone="secondary">Add a money source or account for the current user.</AppText>

        <View style={styles.form}>
          <FormInput
            control={control}
            name="title"
            label="Title"
            placeholder="Enter card title"
          />

          <FormInput
            control={control}
            name="moneyAmount"
            label="Money amount"
            placeholder="Enter amount"
            keyboardType="numeric"
          />

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
              onPress={() => { onSelectImage(); }}
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
      </ScrollView>
    </Screen>
  );
};
