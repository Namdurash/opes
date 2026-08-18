import type { Database } from '@nozbe/watermelondb';
import type { MonobankAccount } from '../../services/monobank/types';
import { createTestDatabase } from '../../../test/db';

// The repository reaches WatermelonDB through a module singleton rather than an
// injected handle, so the only way to point it at a throwaway database is to
// replace that module. The barrel is left alone — it also re-exports the schema
// and model classes the test helper itself needs.
//
// `var`, not `let`: the jest.mock factory is hoisted above this declaration, and
// jest only lets a factory close over names beginning with `mock`.
var mockDatabase: Database;

jest.mock('../../services/database/database', () => ({
  get database() {
    return mockDatabase;
  },
}));

import { CardsRepository } from './CardsRepository';

let repository: CardsRepository;
let teardown: () => Promise<void>;

beforeEach(() => {
  const testDatabase = createTestDatabase();
  mockDatabase = testDatabase.database;
  teardown = testDatabase.teardown;
  repository = new CardsRepository();
});

afterEach(async () => {
  await teardown();
});

const account = (overrides: Partial<MonobankAccount> = {}): MonobankAccount => ({
  id: 'acc-1',
  sendId: 'send-1',
  balance: 1200,
  creditLimit: 0,
  type: 'black',
  currencyCode: 980,
  currencySymbol: '₴',
  maskedPan: ['537541******1234'],
  iban: 'UA000000000000000000000000000',
  ...overrides,
});

describe('CardsRepository reads', () => {
  it('returns an empty list for a user with no cards', async () => {
    expect(await repository.getCardsByUser('user-1')).toEqual([]);
  });

  it('returns the cards belonging to one user, in sort order', async () => {
    await repository.createCard({ userId: 'user-1', title: 'First', moneyAmount: 100, type: 'salary' });
    await repository.createCard({ userId: 'user-1', title: 'Second', moneyAmount: 200, type: 'credit' });
    await repository.createCard({ userId: 'user-2', title: 'Other', moneyAmount: 300, type: 'storage' });

    const cards = await repository.getCardsByUser('user-1');

    expect(cards.map(card => card.title)).toEqual(['First', 'Second']);
    expect(cards.map(card => card.sortOrder)).toEqual([0, 1]);
  });

  it('finds a card by id', async () => {
    const created = await repository.createCard({
      userId: 'user-1',
      title: 'Salary',
      moneyAmount: 1200,
      type: 'salary',
      image: 'file:///tmp/card.png',
    });

    const found = await repository.findById(created.id);

    expect(found).toEqual(created);
  });

  it('returns null when the id does not exist', async () => {
    expect(await repository.findById('nope')).toBeNull();
  });

  it('returns null when no card carries the monobank account id', async () => {
    expect(await repository.findByMonobankAccountId('acc-1')).toBeNull();
  });
});

describe('CardsRepository writes', () => {
  it('creates a card with the given fields and appends it to the order', async () => {
    const created = await repository.createCard({
      userId: 'user-1',
      title: 'Salary',
      moneyAmount: 1200,
      type: 'salary',
    });

    expect(created).toMatchObject({
      userId: 'user-1',
      title: 'Salary',
      moneyAmount: 1200,
      type: 'salary',
      image: null,
      sortOrder: 0,
    });
  });

  it('updates only the fields it is given', async () => {
    const created = await repository.createCard({
      userId: 'user-1',
      title: 'Old',
      moneyAmount: 100,
      type: 'storage',
      image: 'file:///tmp/old.png',
    });

    const updated = await repository.updateCard(created.id, { title: 'New', moneyAmount: 250 });

    expect(updated).toMatchObject({
      id: created.id,
      title: 'New',
      moneyAmount: 250,
      type: 'storage',
      image: 'file:///tmp/old.png',
    });
  });

  it('deletes a card so it can no longer be found', async () => {
    const created = await repository.createCard({ userId: 'user-1', title: 'Gone', moneyAmount: 10, type: 'storage' });

    await repository.deleteCard(created.id);

    expect(await repository.findById(created.id)).toBeNull();
    expect(await repository.getCardsByUser('user-1')).toEqual([]);
  });

  it('rewrites sort order to match the given id sequence', async () => {
    const first = await repository.createCard({ userId: 'user-1', title: 'First', moneyAmount: 1, type: 'storage' });
    const second = await repository.createCard({ userId: 'user-1', title: 'Second', moneyAmount: 2, type: 'storage' });

    await repository.reorderCards([second.id, first.id]);

    const cards = await repository.getCardsByUser('user-1');
    expect(cards.map(card => card.title)).toEqual(['Second', 'First']);
  });
});

describe('CardsRepository monobank cards', () => {
  it('creates a monobank card from an account and finds it by account id', async () => {
    const [created] = await repository.upsertMonobankCards('user-1', [account()]);

    expect(created).toMatchObject({
      userId: 'user-1',
      type: 'monobank',
      monobankAccountId: 'acc-1',
      monobankBalance: 1200,
      currencyCode: 980,
      currencySymbol: '₴',
      maskedPan: '537541******1234',
    });
    expect(await repository.findByMonobankAccountId('acc-1')).toMatchObject({ id: created.id });
  });

  it('updates the existing card instead of adding a second one for the same account', async () => {
    await repository.upsertMonobankCards('user-1', [account({ balance: 1200 })]);
    await repository.upsertMonobankCards('user-1', [account({ balance: 999 })]);

    const cards = await repository.getCardsByUser('user-1');
    expect(cards).toHaveLength(1);
    expect(cards[0].monobankBalance).toBe(999);
  });

  it('returns only the cards linked to a monobank account', async () => {
    await repository.createCard({ userId: 'user-1', title: 'Manual', moneyAmount: 100, type: 'storage' });
    await repository.upsertMonobankCards('user-1', [account()]);

    const monobankCards = await repository.getMonobankCards('user-1');

    expect(monobankCards.map(card => card.monobankAccountId)).toEqual(['acc-1']);
  });
});

// The helper promises a fresh database per test CASE, not per file. These two
// cases prove it: if the instance were shared, the second would see the first's
// row and fail. Without them, a regression in teardown would look like nothing.
describe('CardsRepository test-database isolation', () => {
  it('writes a card that the next case must not see', async () => {
    await repository.createCard({ userId: 'shared', title: 'Leaked', moneyAmount: 1, type: 'storage' });

    expect(await repository.getCardsByUser('shared')).toHaveLength(1);
  });

  it('starts from an empty table despite the previous case writing one', async () => {
    expect(await repository.getCardsByUser('shared')).toEqual([]);
  });
});
