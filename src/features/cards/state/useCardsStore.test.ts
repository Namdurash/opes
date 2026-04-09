import { createCardsStore } from './useCardsStore';
import { createCreateCardStore } from './useCreateCardStore';
import { Card } from '../../../domain/cards';

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-1',
  userId: 'user-1',
  title: 'Test',
  moneyAmount: 100,
  type: 'storage',
  image: null,
  createdAt: 1,
  sortOrder: 0,
  monobankAccountId: null,
  currencyCode: null,
  currencySymbol: null,
  iban: null,
  maskedPan: null,
  creditLimit: null,
  monobankBalance: null,
  ...overrides,
});

describe('createCardsStore', () => {
  it('loads cards for a user', async () => {
    const cards: Card[] = [makeCard({ id: 'card-1', title: 'Credit', type: 'credit', image: 'file:///tmp/card.png' })];
    const repository = {
      getCardsByUser: jest.fn().mockResolvedValue(cards),
      createCard: jest.fn(),
      reorderCards: jest.fn(),
      findByMonobankAccountId: jest.fn(),
      upsertMonobankCards: jest.fn(),
      getMonobankCards: jest.fn(),
    };
    const store = createCardsStore({ cardsRepository: repository });

    await store.getState().loadCardsByUser('user-1');

    expect(repository.getCardsByUser).toHaveBeenCalledWith('user-1');
    expect(store.getState().cards).toEqual(cards);
  });

  it('appends a card to the list', () => {
    const existing = makeCard({ id: 'existing', title: 'Savings', moneyAmount: 300, sortOrder: 0 });
    const repository = {
      getCardsByUser: jest.fn().mockResolvedValue([existing]),
      createCard: jest.fn(),
      reorderCards: jest.fn(),
      findByMonobankAccountId: jest.fn(),
      upsertMonobankCards: jest.fn(),
      getMonobankCards: jest.fn(),
    };
    const store = createCardsStore({ cardsRepository: repository });
    store.setState({ cards: [existing] });

    const newCard = makeCard({ id: 'new-card', title: 'Salary', type: 'salary', moneyAmount: 1200, sortOrder: 1 });
    store.getState().appendCard(newCard);

    expect(store.getState().cards).toEqual([existing, newCard]);
  });

  it('rolls back card order on reorderCards failure', async () => {
    const cards = [
      makeCard({ id: 'a', sortOrder: 0 }),
      makeCard({ id: 'b', sortOrder: 1 }),
    ];
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn(),
      reorderCards: jest.fn().mockRejectedValue(new Error('DB error')),
      findByMonobankAccountId: jest.fn(),
      upsertMonobankCards: jest.fn(),
      getMonobankCards: jest.fn(),
    };
    const store = createCardsStore({ cardsRepository: repository });
    store.setState({ cards });

    await store.getState().reorderCards([cards[1], cards[0]]);

    expect(store.getState().cards).toEqual(cards);
    expect(store.getState().errorMessage).toBe('Failed to save card order.');
  });
});

describe('createCreateCardStore', () => {
  it('creates a card with form values and resets the store', async () => {
    const createdCard = makeCard({ id: 'new-card', title: 'Salary', type: 'salary', moneyAmount: 1200, sortOrder: 0 });
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn().mockResolvedValue(createdCard),
      reorderCards: jest.fn(),
      findByMonobankAccountId: jest.fn(),
      upsertMonobankCards: jest.fn(),
      getMonobankCards: jest.fn(),
    };
    const store = createCreateCardStore({ cardsRepository: repository });

    store.getState().setType('salary');

    const created = await store.getState().createCard('user-1', { title: 'Salary', moneyAmount: '1200' });

    expect(created).toEqual(createdCard);
    expect(repository.createCard).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Salary',
      moneyAmount: 1200,
      type: 'salary',
      image: null,
    });
    expect(store.getState().type).toBe('storage');
  });

  it('passes the selected image URI to card creation', async () => {
    const createdCard = makeCard({ id: 'new-card', title: 'Main', moneyAmount: 500, image: 'content://media/external/images/media/1' });
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn().mockResolvedValue(createdCard),
      reorderCards: jest.fn(),
      findByMonobankAccountId: jest.fn(),
      upsertMonobankCards: jest.fn(),
      getMonobankCards: jest.fn(),
    };
    const store = createCreateCardStore({ cardsRepository: repository });

    store.getState().setImage('content://media/external/images/media/1');

    await store.getState().createCard('user-1', { title: 'Main', moneyAmount: '500' });

    expect(repository.createCard).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Main',
      moneyAmount: 500,
      type: 'storage',
      image: 'content://media/external/images/media/1',
    });
  });

  it('returns null and sets error on repository failure', async () => {
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn().mockRejectedValue(new Error('DB error')),
      reorderCards: jest.fn(),
      findByMonobankAccountId: jest.fn(),
      upsertMonobankCards: jest.fn(),
      getMonobankCards: jest.fn(),
    };
    const store = createCreateCardStore({ cardsRepository: repository });

    const created = await store.getState().createCard('user-1', { title: 'Test', moneyAmount: '100' });

    expect(created).toBeNull();
    expect(store.getState().errorMessage).toBe('Failed to create card.');
  });
});
