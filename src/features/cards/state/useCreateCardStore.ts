import { create } from 'zustand';
import type { Card, CardType } from '../../../domain/cards';
import { CardsRepository } from '../../../models/cards';
import type { CardsRepositoryContract } from '../../../models/cards';
import { showErrorBottomSheet } from '../../../shared/ui/bottom-sheet';

interface CreateCardStoreState {
  type: CardType;
  image: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  setType: (value: CardType) => void;
  setImage: (value: string) => void;
  setErrorMessage: (value: string | null) => void;
  createCard: (userId: string, formValues: { title: string; moneyAmount: string }) => Promise<Card | null>;
  resetForm: () => void;
}

interface CreateCardStoreDeps {
  cardsRepository: CardsRepositoryContract;
}

const initialFormState = {
  type: 'storage' as CardType,
  image: '',
};

export const createCreateCardStore = (deps: CreateCardStoreDeps) =>
  create<CreateCardStoreState>((set, get) => ({
    ...initialFormState,
    isSubmitting: false,
    errorMessage: null,
    setType: value => set({ type: value, errorMessage: null }),
    setImage: value => set({ image: value, errorMessage: null }),
    setErrorMessage: value => set({ errorMessage: value }),
    createCard: async (userId, formValues) => {
      const { type, image } = get();

      set({ isSubmitting: true, errorMessage: null });

      try {
        const card = await deps.cardsRepository.createCard({
          userId,
          title: formValues.title.trim(),
          moneyAmount: Number(formValues.moneyAmount),
          type,
          image: image.trim() || null,
        });

        set({ ...initialFormState });
        return card;
      } catch {
        set({ errorMessage: 'Failed to create card.' });
        showErrorBottomSheet({
          title: 'Creation Failed',
          message: 'Failed to create card.',
          buttonTitle: 'OK',
          onPress: () => {},
        });
        return null;
      } finally {
        set({ isSubmitting: false });
      }
    },
    resetForm: () => set({ ...initialFormState, errorMessage: null, isSubmitting: false }),
  }));

export const useCreateCardStore = createCreateCardStore({
  cardsRepository: new CardsRepository(),
});
