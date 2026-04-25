import type {
  Category,
  CategoryId,
  CategorizedTransaction,
} from '../../domain/categorization';
import type { Transaction } from '../../domain/transactions';
import type { MerchantRulesRepositoryContract } from '../../models/merchantRules';
import type { UserOverridesRepositoryContract } from '../../models/userOverrides';
import { getCategoryById } from './categories';
import { resolveCategoryByMcc } from './mccMapping';

const normalizeMerchantName = (name: string): string =>
  name.trim().toLowerCase();

export class CategorizationService {
  private userOverridesRepo: UserOverridesRepositoryContract;
  private merchantRulesRepo: MerchantRulesRepositoryContract;

  constructor(
    userOverridesRepo: UserOverridesRepositoryContract,
    merchantRulesRepo: MerchantRulesRepositoryContract,
  ) {
    this.userOverridesRepo = userOverridesRepo;
    this.merchantRulesRepo = merchantRulesRepo;
  }

  async resolveCategory(transaction: Transaction): Promise<Category> {
    const override = await this.userOverridesRepo.findByTransactionId(
      transaction.id,
    );
    if (override) {
      return getCategoryById(override.categoryId);
    }

    const merchantRule = await this.merchantRulesRepo.findByMerchantName(
      transaction.title,
    );
    if (merchantRule) {
      return getCategoryById(merchantRule.categoryId);
    }

    const categoryId = resolveCategoryByMcc(transaction.mcc);
    return getCategoryById(categoryId);
  }

  async resolveCategories(
    transactions: Transaction[],
  ): Promise<CategorizedTransaction[]> {
    if (transactions.length === 0) return [];

    const transactionIds = transactions.map(t => t.id);
    const merchantNames = [
      ...new Set(transactions.map(t => normalizeMerchantName(t.title))),
    ];

    const [overridesMap, merchantRulesMap] = await Promise.all([
      this.userOverridesRepo.findByTransactionIds(transactionIds),
      this.merchantRulesRepo.findByMerchantNames(merchantNames),
    ]);

    return transactions.map(transaction => {
      const override = overridesMap.get(transaction.id);
      if (override) {
        return {
          transaction,
          category: getCategoryById(override.categoryId),
        };
      }

      const normalized = normalizeMerchantName(transaction.title);
      const merchantRule = merchantRulesMap.get(normalized);
      if (merchantRule) {
        return {
          transaction,
          category: getCategoryById(merchantRule.categoryId),
        };
      }

      const categoryId = resolveCategoryByMcc(transaction.mcc);
      return { transaction, category: getCategoryById(categoryId) };
    });
  }

  async overrideCategory(
    transaction: Transaction,
    categoryId: CategoryId,
    options: { applyToMerchant: boolean },
  ): Promise<void> {
    await this.userOverridesRepo.upsert(transaction.id, categoryId);

    if (options.applyToMerchant) {
      await this.merchantRulesRepo.upsert(transaction.title, categoryId);
    }
  }
}
