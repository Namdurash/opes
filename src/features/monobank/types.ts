export type MonobankConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface MonobankStoreState {
  status: MonobankConnectionStatus;
  clientName: string | null;
  errorMessage: string | null;
}

export interface MonobankStoreActions {
  connect(userId: string, token: string): Promise<void>;
  disconnect(): void;
  loadSavedToken(): string | null;
}
