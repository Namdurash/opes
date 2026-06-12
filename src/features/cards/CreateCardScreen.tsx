import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { launchImageLibrary } from 'react-native-image-picker';
import type { CardType } from '../../domain/cards';
import { ROOT_ROUTES } from '../../app/navigation';
import type {
  CreateCardScreenNavigationProp,
  RootStackParamList,
} from '../../app/navigation';
import { AppText, Button, FormInput, Screen } from '../../shared/ui';
import { showErrorBottomSheet } from '../../shared/ui/bottom-sheet';
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
  const { params } = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTES.CREATE_CARD>>();
  const editingCardId = params?.cardId ?? null;
  const isEditing = editingCardId != null;
  const currentUserId = useUserStore(state => state.currentUserId);

  const { control, handleSubmit, reset } = useForm<CreateCardFormValues>({
    resolver: yupResolver(createCardSchema),
    defaultValues: { title: '', moneyAmount: '' },
  });

  const { type, image, isSubmitting, setType, setImage, createCard, resetForm } =
    useCreateCardStore(
      useShallow(state => ({
        type: state.type,
        image: state.image,
        isSubmitting: state.isSubmitting,
        setType: state.setType,
        setImage: state.setImage,
        createCard: state.createCard,
        resetForm: state.resetForm,
      })),
    );

  const { appendCard, updateCard } = useCardsStore(
    useShallow(state => ({ appendCard: state.appendCard, updateCard: state.updateCard })),
  );

  React.useEffect(() => {
    // Read the working set imperatively so the prefill effect only re-runs when
    // the edited card id changes, not on every cards-array update.
    const editingCard = editingCardId
      ? useCardsStore.getState().cards.find(c => c.id === editingCardId) ?? null
      : null;

    if (editingCard) {
      reset({ title: editingCard.title, moneyAmount: String(editingCard.moneyAmount) });
      setType(editingCard.type as CardType);
      setImage(editingCard.image ?? '');
    } else {
      reset();
      resetForm();
    }

    return () => {
      reset();
      resetForm();
    };
  }, [editingCardId, reset, resetForm, setType, setImage]);

  const onSubmit = handleSubmit(async data => {
    if (editingCardId) {
      const updated = await updateCard(editingCardId, {
        title: data.title.trim(),
        moneyAmount: Number(data.moneyAmount),
        type,
        image: image.trim() || null,
      });
      if (updated) {
        navigation.goBack();
      }
      return;
    }

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
      showErrorBottomSheet({
        title: 'Image Error',
        message: 'Failed to select image.',
        buttonTitle: 'OK',
        onPress: () => {},
      });
      return;
    }

    const selectedImage = result.assets?.[0]?.uri;
    if (!selectedImage) {
      showErrorBottomSheet({
        title: 'Image Error',
        message: 'No image was selected.',
        buttonTitle: 'OK',
        onPress: () => {},
      });
      return;
    }

    setImage(selectedImage);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
        <AppText variant="h1">{isEditing ? 'Edit card' : 'Create card'}</AppText>
        <AppText tone="secondary">
          {isEditing
            ? 'Update the details for this card.'
            : 'Add a money source or account for the current user.'}
        </AppText>

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

          <Button
            loading={isSubmitting}
            onPress={onSubmit}
            title={isEditing ? 'Save changes' : 'Save card'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};
