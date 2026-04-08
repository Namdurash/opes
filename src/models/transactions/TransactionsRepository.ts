import { Q } from '@nozbe/watermelondb';
import type { Transaction, TransactionType } from '../../domain/transactions';
import { database } from '../../services/database';
import { TransactionModel } from '../../services/database/models';

export interface TransactionsRepositoryContract {
  getByCardId(cardId: string): Promise<Transaction[]>;
  getAll(): Promise<Transaction[]>;
  upsertBatch(transactions: Transaction[]): Promise<void>;
  getLatestOccurredAt(cardId: string): Promise<string | null>;
}

const toDomain = (model: TransactionModel): Transaction => ({
  id: model.id,
  title: model.title,
  amount: model.amount,
  type: model.type as TransactionType,
  occurredAtIso: model.occurredAtIso,
  cardId: model.cardId,
  mcc: model.mcc,
  currencyCode: model.currencyCode,
  currencySymbol: model.currencySymbol,
  balance: model.balance,
  hold: model.hold,
  comment: model.comment ?? null,
});

export class TransactionsRepository implements TransactionsRepositoryContract {
  async getByCardId(cardId: string): Promise<Transaction[]> {
    const collection = database.get<TransactionModel>('transactions');
    const records = await collection
      .query(Q.where('card_id', cardId), Q.sortBy('occurred_at_iso', Q.desc))
      .fetch();

    return records.map(toDomain);
  }

  async getAll(): Promise<Transaction[]> {
    const collection = database.get<TransactionModel>('transactions');
    const records = await collection
      .query(Q.sortBy('occurred_at_iso', Q.desc))
      .fetch();

    return records.map(toDomain);
  }

  async upsertBatch(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;

    const collection = database.get<TransactionModel>('transactions');
    const ids = transactions.map(t => t.id);
    const existing = await collection.query(Q.where('id', Q.oneOf(ids))).fetch();
    const existingMap = new Map(existing.map(r => [r.id, r]));

    await database.write(async () => {
      const batch = transactions.map(tx => {
        const record = existingMap.get(tx.id);

        if (record) {
          return record.prepareUpdate(r => {
            r.title = tx.title;
            r.amount = tx.amount;
            r.type = tx.type;
            r.occurredAtIso = tx.occurredAtIso;
            r.cardId = tx.cardId;
            r.mcc = tx.mcc;
            r.currencyCode = tx.currencyCode;
            r.currencySymbol = tx.currencySymbol;
            r.balance = tx.balance;
            r.hold = tx.hold;
            r.comment = tx.comment;
          });
        }

        return collection.prepareCreate(r => {
          r._raw.id = tx.id;
          r.title = tx.title;
          r.amount = tx.amount;
          r.type = tx.type;
          r.occurredAtIso = tx.occurredAtIso;
          r.cardId = tx.cardId;
          r.mcc = tx.mcc;
          r.currencyCode = tx.currencyCode;
          r.currencySymbol = tx.currencySymbol;
          r.balance = tx.balance;
          r.hold = tx.hold;
          r.comment = tx.comment;
        });
      });

      await database.batch(...batch);
    });
  }

  async getLatestOccurredAt(cardId: string): Promise<string | null> {
    const collection = database.get<TransactionModel>('transactions');
    const records = await collection
      .query(
        Q.where('card_id', cardId),
        Q.sortBy('occurred_at_iso', Q.desc),
        Q.take(1),
      )
      .fetch();

    return records.length > 0 ? records[0].occurredAtIso : null;
  }
}
