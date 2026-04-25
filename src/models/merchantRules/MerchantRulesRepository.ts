import { Q } from '@nozbe/watermelondb';
import type { CategoryId, MerchantRule } from '../../domain/categorization';
import { database } from '../../services/database';
import { MerchantRuleModel } from '../../services/database/models';

export interface MerchantRulesRepositoryContract {
  findByMerchantName(merchantName: string): Promise<MerchantRule | null>;
  findByMerchantNames(
    merchantNames: string[],
  ): Promise<Map<string, MerchantRule>>;
  upsert(merchantName: string, categoryId: CategoryId): Promise<void>;
}

const normalizeMerchantName = (name: string): string =>
  name.trim().toLowerCase();

const toDomain = (model: MerchantRuleModel): MerchantRule => ({
  id: model.id,
  merchantName: model.merchantName,
  categoryId: model.categoryId as CategoryId,
  createdAt: model.createdAt,
});

export class MerchantRulesRepository
  implements MerchantRulesRepositoryContract
{
  async findByMerchantName(
    merchantName: string,
  ): Promise<MerchantRule | null> {
    const normalized = normalizeMerchantName(merchantName);
    const collection = database.get<MerchantRuleModel>('merchant_rules');
    const records = await collection
      .query(Q.where('merchant_name', normalized), Q.take(1))
      .fetch();

    return records.length > 0 ? toDomain(records[0]) : null;
  }

  async findByMerchantNames(
    merchantNames: string[],
  ): Promise<Map<string, MerchantRule>> {
    if (merchantNames.length === 0) return new Map();

    const normalized = merchantNames.map(normalizeMerchantName);
    const collection = database.get<MerchantRuleModel>('merchant_rules');
    const records = await collection
      .query(Q.where('merchant_name', Q.oneOf(normalized)))
      .fetch();

    return new Map(records.map(r => [r.merchantName, toDomain(r)]));
  }

  async upsert(merchantName: string, categoryId: CategoryId): Promise<void> {
    const normalized = normalizeMerchantName(merchantName);
    const collection = database.get<MerchantRuleModel>('merchant_rules');
    const existing = await collection
      .query(Q.where('merchant_name', normalized), Q.take(1))
      .fetch();

    await database.write(async () => {
      if (existing.length > 0) {
        await existing[0].update(record => {
          record.categoryId = categoryId;
          record.createdAt = Date.now();
        });
      } else {
        await collection.create(record => {
          record.merchantName = normalized;
          record.categoryId = categoryId;
          record.createdAt = Date.now();
        });
      }
    });
  }
}
