import { Card } from '../../domain/auth';
import { database } from '../../services/database';
import { CardModel } from '../../services/database/models';

export interface CreateCardInput {
  userId: string;
  cardName: string;
}

export interface CardsRepositoryContract {
  create(input: CreateCardInput): Promise<Card>;
}

function toDomain(model: CardModel): Card {
  return {
    id: model.id,
    userId: model.userId,
    cardName: model.cardName,
    createdAt: model.createdAt,
  };
}

export class CardsRepository implements CardsRepositoryContract {
  async create(input: CreateCardInput): Promise<Card> {
    const collection = database.get<CardModel>('cards');
    const createdAt = Date.now();

    const card = await database.write(async () => {
      return collection.create(record => {
        record.userId = input.userId;
        record.cardName = input.cardName;
        record.createdAt = createdAt;
      });
    });

    return toDomain(card);
  }
}
