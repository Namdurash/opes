import { create } from 'zustand';
import { Card, CardType } from '../../../domain/auth';
import { CardsRepository, CardsRepositoryContract } from '../../../models/cards';

interface CardsStoreState {
  cards: Card[];
  title: string;
  moneyAmount: string;
  type: CardType;
  image: string;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  setTitle: (value: string) => void;
  setMoneyAmount: (value: string) => void;
  setType: (value: CardType) => void;
  setImage: (value: string) => void;
  setErrorMessage: (value: string | null) => void;
  loadCardsByUser: (userId: string) => Promise<void>;
  createCard: (userId: string) => Promise<Card | null>;
  resetForm: () => void;
}

interface CardsStoreDeps {
  cardsRepository: CardsRepositoryContract;
}

const initialFormState = {
  title: '',
  moneyAmount: '',
  type: 'storage' as CardType,
  image: '',
};

function validateDraft({
  title,
  moneyAmount,
}: Pick<CardsStoreState, 'title' | 'moneyAmount'>): string | null {
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

export function createCardsStore(deps: CardsStoreDeps) {
  return create<CardsStoreState>((set, get) => ({
    cards: [],
    ...initialFormState,
    isLoading: false,
    isSubmitting: false,
    errorMessage: null,
    setTitle: value => set({ title: value, errorMessage: null }),
    setMoneyAmount: value => set({ moneyAmount: value, errorMessage: null }),
    setType: value => set({ type: value, errorMessage: null }),
    setImage: value => set({ image: value, errorMessage: null }),
    setErrorMessage: value => set({ errorMessage: value }),
    loadCardsByUser: async userId => {
      set({ isLoading: true, errorMessage: null });

      try {
        const cards = await deps.cardsRepository.getCardsByUser(userId);
        set({ cards });
      } catch {
        set({ errorMessage: 'Failed to load cards.' });
      } finally {
        set({ isLoading: false });
      }
    },
    createCard: async userId => {
      const current = get();
      const validationError = validateDraft(current);

      if (validationError) {
        set({ errorMessage: validationError });
        return null;
      }

      set({ isSubmitting: true, errorMessage: null });

      try {
        const card = await deps.cardsRepository.createCard({
          userId,
          title: current.title.trim(),
          moneyAmount: Number(current.moneyAmount),
          type: current.type,
          image: current.image.trim() || null,
        });

        set(state => ({
          cards: [...state.cards, card],
          ...initialFormState,
        }));

        return card;
      } catch {
        set({ errorMessage: 'Failed to create card.' });
        return null;
      } finally {
        set({ isSubmitting: false });
      }
    },
    resetForm: () =>
      set({
        ...initialFormState,
        errorMessage: null,
        isSubmitting: false,
      }),
  }));
}

export const useCardsStore = createCardsStore({
  cardsRepository: new CardsRepository(),
});
