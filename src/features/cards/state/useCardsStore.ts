import { create } from 'zustand';
import { Card } from '../../../domain/cards';
import { CardsRepository, CardsRepositoryContract } from '../../../models/cards';

interface CardsStoreState {
  cards: Card[];
  isLoading: boolean;
  errorMessage: string | null;
  loadCardsByUser: (userId: string) => Promise<void>;
  appendCard: (card: Card) => void;
  reorderCards: (newOrder: Card[]) => Promise<void>;
}

interface CardsStoreDeps {
  cardsRepository: CardsRepositoryContract;
}

export function createCardsStore(deps: CardsStoreDeps) {
  return create<CardsStoreState>((set, get) => ({
    cards: [],
    isLoading: false,
    errorMessage: null,
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
    appendCard: card => set(state => ({ cards: [...state.cards, card] })),
    reorderCards: async newOrder => {
      const previousCards = get().cards;
      set({ cards: newOrder });

      try {
        await deps.cardsRepository.reorderCards(newOrder.map(c => c.id));
      } catch {
        set({ cards: previousCards, errorMessage: 'Failed to save card order.' });
      }
    },
  }));
}

export const useCardsStore = createCardsStore({
  cardsRepository: new CardsRepository(),
});
