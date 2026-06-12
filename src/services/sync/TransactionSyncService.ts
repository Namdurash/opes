import type { Transaction } from '../../domain/transactions';
import type { Card } from '../../domain/cards';
import type { TransactionsRepositoryContract } from '../../models/transactions';
import type { CardsRepositoryContract } from '../../models/cards';
import type { MonobankService } from '../monobank/api';
import { MonobankError } from '../monobank/types';
import { mapStatementToTransaction } from './mappers';

const HISTORY_DAYS = 30;

export interface SyncResult {
  totalSynced: number;
  accountsSynced: number;
}

const buildFromDate = (latestOccurredAt: string | null): Date => {
  if (latestOccurredAt) {
    return new Date(latestOccurredAt);
  }
  const now = new Date();
  return new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
};

const fetchAccountTransactions = async (
  card: Card,
  monobankService: MonobankService,
  transactionsRepository: TransactionsRepositoryContract,
): Promise<Transaction[]> => {
  const latestOccurredAt = await transactionsRepository.getLatestOccurredAt(card.id);
  const from = buildFromDate(latestOccurredAt);
  const to = new Date();

  const statements = await monobankService.getStatements(card.monobankAccountId!, from, to);
  return statements.map(s => mapStatementToTransaction(s, card.id));
};

export class TransactionSyncService {
  constructor(
    private readonly transactionsRepository: TransactionsRepositoryContract,
    private readonly cardsRepository: CardsRepositoryContract,
  ) {}

  async syncAllAccounts(
    userId: string,
    monobankService: MonobankService,
    selectedAccountIds?: string[] | null,
  ): Promise<SyncResult> {
    const monobankCards = await this.cardsRepository.getMonobankCards(userId);

    // `null`/`undefined` means the user hasn't chosen a subset → sync every
    // account. An explicit list restricts the sync to the selected accounts.
    const cardsToSync =
      selectedAccountIds == null
        ? monobankCards
        : monobankCards.filter(
            card =>
              card.monobankAccountId != null &&
              selectedAccountIds.includes(card.monobankAccountId),
          );

    if (cardsToSync.length === 0) {
      return { totalSynced: 0, accountsSynced: 0 };
    }

    // Fetch all accounts in parallel — each account has its own rate limit key
    const results = await Promise.allSettled(
      cardsToSync.map(card =>
        fetchAccountTransactions(card, monobankService, this.transactionsRepository),
      ),
    );

    // TODO: Revisit rollback strategy after testing -- may allow per-account partial sync
    // If any account fails, abort entirely and don't save partial results
    const allTransactions: Transaction[] = [];
    for (const result of results) {
      if (result.status === 'rejected') {
        const error = result.reason;
        if (error instanceof MonobankError) {
          throw error;
        }
        throw new Error(
          error instanceof Error ? error.message : 'Unknown sync error',
        );
      }
      allTransactions.push(...result.value);
    }

    await this.transactionsRepository.upsertBatch(allTransactions);

    return {
      totalSynced: allTransactions.length,
      accountsSynced: cardsToSync.length,
    };
  }
}
