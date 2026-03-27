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
  ...overrides,
});

describe('createCardsStore', () => {
  it('loads cards for a user', async () => {
    const cards: Card[] = [makeCard({ id: 'card-1', title: 'Credit', type: 'credit', image: 'file:///tmp/card.png' })];
    const repository = {
      getCardsByUser: jest.fn().mockResolvedValue(cards),
      createCard: jest.fn(),
      reorderCards: jest.fn(),
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
    };
    const store = createCardsStore({ cardsRepository: repository });
    store.setState({ cards });

    await store.getState().reorderCards([cards[1], cards[0]]);

    expect(store.getState().cards).toEqual(cards);
    expect(store.getState().errorMessage).toBe('Failed to save card order.');
  });
});

describe('createCreateCardStore', () => {
  it('validates required fields before creating a card', async () => {
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn(),
      reorderCards: jest.fn(),
    };
    const store = createCreateCardStore({ cardsRepository: repository });

    const created = await store.getState().createCard('user-1');

    expect(created).toBeNull();
    expect(store.getState().errorMessage).toBe('Title is required.');
    expect(repository.createCard).not.toHaveBeenCalled();
  });

  it('creates a card and resets the form', async () => {
    const createdCard = makeCard({ id: 'new-card', title: 'Salary', type: 'salary', moneyAmount: 1200, sortOrder: 0 });
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn().mockResolvedValue(createdCard),
      reorderCards: jest.fn(),
    };
    const store = createCreateCardStore({ cardsRepository: repository });

    store.getState().setTitle('Salary');
    store.getState().setMoneyAmount('1200');
    store.getState().setType('salary');

    const created = await store.getState().createCard('user-1');

    expect(created).toEqual(createdCard);
    expect(repository.createCard).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Salary',
      moneyAmount: 1200,
      type: 'salary',
      image: null,
    });
    expect(store.getState().title).toBe('');
    expect(store.getState().moneyAmount).toBe('');
    expect(store.getState().type).toBe('storage');
  });

  it('passes the selected image URI to card creation', async () => {
    const createdCard = makeCard({ id: 'new-card', title: 'Main', moneyAmount: 500, image: 'content://media/external/images/media/1' });
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn().mockResolvedValue(createdCard),
      reorderCards: jest.fn(),
    };
    const store = createCreateCardStore({ cardsRepository: repository });

    store.getState().setTitle('Main');
    store.getState().setMoneyAmount('500');
    store.getState().setImage('content://media/external/images/media/1');

    await store.getState().createCard('user-1');

    expect(repository.createCard).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Main',
      moneyAmount: 500,
      type: 'storage',
      image: 'content://media/external/images/media/1',
    });
  });
});
