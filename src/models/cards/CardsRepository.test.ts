import type { Database } from '@nozbe/watermelondb';
import type { MonobankAccount } from '../../services/monobank/types';
import { createTestDatabase } from '../../../test/db';
import { makeTransaction } from '../../../test/factories';

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
import { TransactionsRepository } from '../transactions';

let repository: CardsRepository;
let transactions: TransactionsRepository;
let teardown: () => Promise<void>;

beforeEach(() => {
  const testDatabase = createTestDatabase();
  mockDatabase = testDatabase.database;
  teardown = testDatabase.teardown;
  repository = new CardsRepository();
  transactions = new TransactionsRepository();
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

/**
 * OPES-68 AC-010 to AC-012 — deleting a card takes its transactions with it.
 *
 * Disconnecting deletes nothing; deleting is the user's own, explicit act, and when
 * they ask for it the card's imported history has to go too. Today `deleteCard`
 * destroys the card row alone, so every transaction carrying its `card_id` is left
 * orphaned — AC-011 is the criterion that says so, and it is the red one here.
 *
 * The other two are guards on either side of it, and they hold today:
 *
 *   - AC-010 counts what the user asked to remove. It would also be satisfied by
 *     today's code, which is the point — the cascade must not cost the card its own
 *     deletion.
 *   - AC-012 counts the card nobody touched. `destroyPermanently` has no backup and
 *     no undo, so a cascade with a predicate one field too wide (user-wide,
 *     type-wide, monobank-wide) destroys history this whole ticket exists to keep.
 *     A green AC-011 with a red AC-012 is a worse outcome than a red AC-011.
 *
 * Asserted at the repository rather than at `useCardsStore.deleteCard`, the surface
 * the criteria name: the store delegates to this method verbatim and owns only the
 * optimistic list and its rollback (D-008), and rows are only countable here.
 *
 * The honest limit is VG-003. Two cards and five rows in LokiJS are not months of
 * imported history on a device, and a green run below is not the sandbox check that
 * the ticket still asks for.
 */
describe('CardsRepository delete cascade', () => {
  let cardAId: string;
  let cardBId: string;

  beforeEach(async () => {
    // Card A is the tombstone the user asked to remove: a monobank card with three
    // imported transactions. Card B is the bystander, with two of its own.
    const [cardA] = await repository.upsertMonobankCards('user-1', [account()]);
    const cardB = await repository.createCard({
      userId: 'user-1',
      title: 'Cash',
      moneyAmount: 500,
      type: 'storage',
    });

    cardAId = cardA.id;
    cardBId = cardB.id;

    await transactions.upsertBatch([
      makeTransaction({ id: 'a-1', cardId: cardAId, occurredAtIso: '2026-05-01T10:00:00.000Z' }),
      makeTransaction({ id: 'a-2', cardId: cardAId, occurredAtIso: '2026-05-02T10:00:00.000Z' }),
      makeTransaction({ id: 'a-3', cardId: cardAId, occurredAtIso: '2026-05-03T10:00:00.000Z' }),
      makeTransaction({ id: 'b-1', cardId: cardBId, occurredAtIso: '2026-04-01T10:00:00.000Z' }),
      makeTransaction({ id: 'b-2', cardId: cardBId, occurredAtIso: '2026-04-02T10:00:00.000Z' }),
    ]);
  });

  it('AC-010 — leaves the user no monobank cards once the disconnected one is deleted', async () => {
    expect(await repository.getMonobankCards('user-1')).toHaveLength(1);

    await repository.deleteCard(cardAId);

    expect(await repository.getMonobankCards('user-1')).toHaveLength(0);
  });

  it('AC-011 — destroys the deleted card\'s transactions with it', async () => {
    // The precondition, spelled out: three rows exist and carry this card_id, so
    // the zero below is the cascade removing them rather than a query that never
    // matched anything.
    expect(await transactions.getByCardId(cardAId)).toHaveLength(3);

    await repository.deleteCard(cardAId);

    expect(await transactions.getByCardId(cardAId)).toHaveLength(0);
  });

  it('AC-012 — leaves the other card and its transactions untouched', async () => {
    await repository.deleteCard(cardAId);

    expect(await transactions.getByCardId(cardBId)).toHaveLength(2);
    // Its rows surviving would mean little if the card they hang off were gone —
    // a too-wide cascade takes the row and the card, or either one alone.
    expect(await repository.findById(cardBId)).not.toBeNull();
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
