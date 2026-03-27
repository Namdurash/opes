import { create } from 'zustand';
import { Card, CardType } from '../../../domain/cards';
import { CardsRepository, CardsRepositoryContract } from '../../../models/cards';

interface CreateCardStoreState {
  title: string;
  moneyAmount: string;
  type: CardType;
  image: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  setTitle: (value: string) => void;
  setMoneyAmount: (value: string) => void;
  setType: (value: CardType) => void;
  setImage: (value: string) => void;
  setErrorMessage: (value: string | null) => void;
  createCard: (userId: string) => Promise<Card | null>;
  resetForm: () => void;
}

interface CreateCardStoreDeps {
  cardsRepository: CardsRepositoryContract;
}

const initialFormState = {
  title: '',
  moneyAmount: '',
  type: 'storage' as CardType,
  image: '',
};

function validateDraft(
  title: string,
  moneyAmount: string,
): string | null {
  if (!title.trim()) {
    return 'Title is required.';
  }

  if (!moneyAmount.trim()) {
    return 'Money amount is required.';
  }

  const parsedAmount = Number(moneyAmount);
  if (!Number.isFinite(parsedAmount)) {
    return 'Money amount must be a valid number.';
  }

  return null;
}

export function createCreateCardStore(deps: CreateCardStoreDeps) {
  return create<CreateCardStoreState>((set, get) => ({
    ...initialFormState,
    isSubmitting: false,
    errorMessage: null,
    setTitle: value => set({ title: value, errorMessage: null }),
    setMoneyAmount: value => set({ moneyAmount: value, errorMessage: null }),
    setType: value => set({ type: value, errorMessage: null }),
    setImage: value => set({ image: value, errorMessage: null }),
    setErrorMessage: value => set({ errorMessage: value }),
    createCard: async userId => {
      const { title, moneyAmount, type, image } = get();
      const validationError = validateDraft(title, moneyAmount);

      if (validationError) {
        set({ errorMessage: validationError });
        return null;
      }

      set({ isSubmitting: true, errorMessage: null });

      try {
        const card = await deps.cardsRepository.createCard({
          userId,
          title: title.trim(),
          moneyAmount: Number(moneyAmount),
          type,
          image: image.trim() || null,
        });

        set({ ...initialFormState });
        return card;
      } catch {
        set({ errorMessage: 'Failed to create card.' });
        return null;
      } finally {
        set({ isSubmitting: false });
      }
    },
    resetForm: () => set({ ...initialFormState, errorMessage: null, isSubmitting: false }),
  }));
}

export const useCreateCardStore = createCreateCardStore({
  cardsRepository: new CardsRepository(),
});
