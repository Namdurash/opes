import { Q } from '@nozbe/watermelondb';
import { Card, CardType } from '../../domain/cards';
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
}

function toDomain(model: CardModel): Card {
  return {
    id: model.id,
    userId: model.userId,
    title: model.title || model.legacyCardName,
    moneyAmount: model.moneyAmount,
    type: model.type as CardType,
    image: model.image ?? null,
    createdAt: model.createdAt,
    sortOrder: model.sortOrder,
  };
}

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
}
