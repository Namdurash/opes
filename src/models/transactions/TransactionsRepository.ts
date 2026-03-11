import { Transaction } from '../../domain/transactions';
import { StorageGateway } from '../../services/storage';

const TRANSACTIONS_KEY = 'transactions';

export class TransactionsRepository {
  constructor(private readonly storage: StorageGateway) {}

  async getAll(): Promise<Transaction[]> {
    const rawValue = await this.storage.getItem(TRANSACTIONS_KEY);
    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue) as Transaction[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async saveAll(transactions: Transaction[]): Promise<void> {
    await this.storage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
}
