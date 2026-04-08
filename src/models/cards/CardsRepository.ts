import { Q } from '@nozbe/watermelondb';
import type { Card, CardType } from '../../domain/cards';
import type { MonobankAccount } from '../../services/monobank/types';
import { database } from '../../services/database';
import { CardModel } from '../../services/database/models';

export interface CreateCardInput {
  userId: string;
  title: string;
  moneyAmount: number;
  type: CardType;
  image?: string | null;
}

export interface CardsRepositoryContract {
  getCardsByUser(userId: string): Promise<Card[]>;
  createCard(input: CreateCardInput): Promise<Card>;
  reorderCards(orderedIds: string[]): Promise<void>;
  findByMonobankAccountId(monobankAccountId: string): Promise<Card | null>;
  upsertMonobankCards(userId: string, accounts: MonobankAccount[]): Promise<Card[]>;
  getMonobankCards(userId: string): Promise<Card[]>;
}

const toDomain = (model: CardModel): Card => ({
  id: model.id,
  userId: model.userId,
  title: model.title || model.legacyCardName,
  moneyAmount: model.moneyAmount,
  type: model.type as CardType,
  image: model.image ?? null,
  createdAt: model.createdAt,
  sortOrder: model.sortOrder,
  monobankAccountId: model.monobankAccountId ?? null,
  currencyCode: model.currencyCode ?? null,
  currencySymbol: model.currencySymbol ?? null,
  iban: model.iban ?? null,
  maskedPan: model.maskedPan ?? null,
  creditLimit: model.creditLimit ?? null,
  monobankBalance: model.monobankBalance ?? null,
});

const buildMonobankCardTitle = (account: MonobankAccount): string => {
  const pan = account.maskedPan[0];
  const lastFour = pan ? ` *${pan.slice(-4)}` : '';
  return `${account.currencySymbol}${lastFour}`;
};

export class CardsRepository implements CardsRepositoryContract {
  async getCardsByUser(userId: string): Promise<Card[]> {
    const collection = database.get<CardModel>('cards');
    const cards = await collection
      .query(Q.where('user_id', userId), Q.sortBy('sort_order', Q.asc), Q.sortBy('created_at', Q.asc))
      .fetch();

    return cards.map(toDomain);
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    const collection = database.get<CardModel>('cards');
    const createdAt = Date.now();
    const existingCards = await this.getCardsByUser(input.userId);
    const sortOrder = existingCards.length;

    const card = await database.write(async () => {
      return collection.create(record => {
        record.userId = input.userId;
        record.title = input.title;
        record.moneyAmount = input.moneyAmount;
        record.type = input.type;
        record.image = input.image ?? null;
        record.createdAt = createdAt;
        record.sortOrder = sortOrder;
      });
    });

    return toDomain(card);
  }

  async reorderCards(orderedIds: string[]): Promise<void> {
    const collection = database.get<CardModel>('cards');

    await database.write(async () => {
      const updates = orderedIds.map((id, index) =>
        collection.find(id).then(record => record.prepareUpdate(r => {
          r.sortOrder = index;
        }))
      );
      const preparedUpdates = await Promise.all(updates);
      await database.batch(...preparedUpdates);
    });
  }

  async findByMonobankAccountId(monobankAccountId: string): Promise<Card | null> {
    const collection = database.get<CardModel>('cards');
    const records = await collection
      .query(Q.where('monobank_account_id', monobankAccountId), Q.take(1))
      .fetch();

    return records.length > 0 ? toDomain(records[0]) : null;
  }

  async upsertMonobankCards(userId: string, accounts: MonobankAccount[]): Promise<Card[]> {
    const collection = database.get<CardModel>('cards');
    const existingCards = await this.getCardsByUser(userId);
    let nextSortOrder = existingCards.length;

    const results: Card[] = [];

    for (const account of accounts) {
      const existing = await collection
        .query(Q.where('monobank_account_id', account.id), Q.take(1))
        .fetch();

      if (existing.length > 0) {
        const updated = await database.write(async () => {
          return existing[0].prepareUpdate(r => {
            r.monobankBalance = account.balance;
            r.creditLimit = account.creditLimit;
            r.currencyCode = account.currencyCode;
            r.currencySymbol = account.currencySymbol;
            r.iban = account.iban;
            r.maskedPan = account.maskedPan[0] ?? null;
          });
        });
        await database.write(async () => {
          await database.batch(updated);
        });
        const refreshed = await collection.find(existing[0].id);
        results.push(toDomain(refreshed));
      } else {
        const card = await database.write(async () => {
          return collection.create(r => {
            r.userId = userId;
            r.title = buildMonobankCardTitle(account);
            r.moneyAmount = account.balance;
            r.type = 'monobank';
            r.createdAt = Date.now();
            r.sortOrder = nextSortOrder;
            r.monobankAccountId = account.id;
            r.currencyCode = account.currencyCode;
            r.currencySymbol = account.currencySymbol;
            r.iban = account.iban;
            r.maskedPan = account.maskedPan[0] ?? null;
            r.creditLimit = account.creditLimit;
            r.monobankBalance = account.balance;
          });
        });
        nextSortOrder += 1;
        results.push(toDomain(card));
      }
    }

    return results;
  }

  async getMonobankCards(userId: string): Promise<Card[]> {
    const collection = database.get<CardModel>('cards');
    const cards = await collection
      .query(
        Q.where('user_id', userId),
        Q.where('monobank_account_id', Q.notEq(null)),
      )
      .fetch();

    return cards.map(toDomain);
  }
}
