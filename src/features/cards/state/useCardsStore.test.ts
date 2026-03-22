import { createCardsStore } from './useCardsStore';
import { Card } from '../../../domain/auth';

describe('createCardsStore', () => {
  it('validates required fields before creating a card', async () => {
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn(),
    };
    const store = createCardsStore({ cardsRepository: repository });

    const created = await store.getState().createCard('user-1');

    expect(created).toBeNull();
    expect(store.getState().errorMessage).toBe('Title is required.');
    expect(repository.createCard).not.toHaveBeenCalled();
  });

  it('creates a card and appends it to the current list', async () => {
    const existingCard: Card = {
      id: 'existing',
      userId: 'user-1',
      title: 'Savings',
      moneyAmount: 300,
      type: 'storage',
      image: null,
      createdAt: 1,
    };
    const createdCard: Card = {
      id: 'new-card',
      userId: 'user-1',
      title: 'Salary',
      moneyAmount: 1200,
      type: 'salary',
      image: null,
      createdAt: 2,
    };
    const repository = {
      getCardsByUser: jest.fn().mockResolvedValue([existingCard]),
      createCard: jest.fn().mockResolvedValue(createdCard),
    };
    const store = createCardsStore({ cardsRepository: repository });

    await store.getState().loadCardsByUser('user-1');
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
    expect(store.getState().cards).toEqual([existingCard, createdCard]);
    expect(store.getState().title).toBe('');
    expect(store.getState().moneyAmount).toBe('');
    expect(store.getState().type).toBe('storage');
  });

  it('loads cards for a user', async () => {
    const cards: Card[] = [
      {
        id: 'card-1',
        userId: 'user-1',
        title: 'Credit',
        moneyAmount: 800,
        type: 'credit',
        image: 'file:///tmp/card.png',
        createdAt: 1,
      },
    ];
    const repository = {
      getCardsByUser: jest.fn().mockResolvedValue(cards),
      createCard: jest.fn(),
    };
    const store = createCardsStore({ cardsRepository: repository });

    await store.getState().loadCardsByUser('user-1');

    expect(repository.getCardsByUser).toHaveBeenCalledWith('user-1');
    expect(store.getState().cards).toEqual(cards);
  });

  it('passes the selected image URI to card creation', async () => {
    const createdCard: Card = {
      id: 'new-card',
      userId: 'user-1',
      title: 'Main',
      moneyAmount: 500,
      type: 'storage',
      image: 'content://media/external/images/media/1',
      createdAt: 3,
    };
    const repository = {
      getCardsByUser: jest.fn(),
      createCard: jest.fn().mockResolvedValue(createdCard),
    };
    const store = createCardsStore({ cardsRepository: repository });

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
