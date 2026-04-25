import { Q } from '@nozbe/watermelondb';
import type { CategoryId, UserOverride } from '../../domain/categorization';
import { database } from '../../services/database';
import { UserOverrideModel } from '../../services/database/models';

export interface UserOverridesRepositoryContract {
  findByTransactionId(transactionId: string): Promise<UserOverride | null>;
  findByTransactionIds(
    transactionIds: string[],
  ): Promise<Map<string, UserOverride>>;
  upsert(transactionId: string, categoryId: CategoryId): Promise<void>;
}

const toDomain = (model: UserOverrideModel): UserOverride => ({
  id: model.id,
  transactionId: model.transactionId,
  categoryId: model.categoryId as CategoryId,
  createdAt: model.createdAt,
});

export class UserOverridesRepository
  implements UserOverridesRepositoryContract
{
  async findByTransactionId(
    transactionId: string,
  ): Promise<UserOverride | null> {
    const collection = database.get<UserOverrideModel>('user_overrides');
    const records = await collection
      .query(Q.where('transaction_id', transactionId), Q.take(1))
      .fetch();

    return records.length > 0 ? toDomain(records[0]) : null;
  }

  async findByTransactionIds(
    transactionIds: string[],
  ): Promise<Map<string, UserOverride>> {
    if (transactionIds.length === 0) return new Map();

    const collection = database.get<UserOverrideModel>('user_overrides');
    const records = await collection
      .query(Q.where('transaction_id', Q.oneOf(transactionIds)))
      .fetch();

    return new Map(records.map(r => [r.transactionId, toDomain(r)]));
  }

  async upsert(transactionId: string, categoryId: CategoryId): Promise<void> {
    const collection = database.get<UserOverrideModel>('user_overrides');
    const existing = await collection
      .query(Q.where('transaction_id', transactionId), Q.take(1))
      .fetch();

    await database.write(async () => {
      if (existing.length > 0) {
        await existing[0].update(record => {
          record.categoryId = categoryId;
          record.createdAt = Date.now();
        });
      } else {
        await collection.create(record => {
          record.transactionId = transactionId;
          record.categoryId = categoryId;
          record.createdAt = Date.now();
        });
      }
    });
  }
}
