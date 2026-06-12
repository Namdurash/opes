import type { Card } from '../../domain/cards';

export type MonobankConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface MonobankStoreState {
  status: MonobankConnectionStatus;
  clientName: string | null;
  errorMessage: string | null;
  /** Linked Monobank accounts (as cards) available to sync. */
  accounts: Card[];
  /** Enabled account ids, or `null` when the user hasn't chosen yet (= sync all). */
  selectedAccountIds: string[] | null;
}

export interface MonobankStoreActions {
  connect(userId: string, token: string): Promise<void>;
  disconnect(): void;
  loadSavedToken(): string | null;
  loadAccounts(userId: string): Promise<void>;
  toggleAccount(accountId: string): void;
}
