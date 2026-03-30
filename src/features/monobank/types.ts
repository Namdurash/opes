export type MonobankConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface MonobankStoreState {
  token: string;
  status: MonobankConnectionStatus;
  clientName: string | null;
  errorMessage: string | null;
}

export interface MonobankStoreActions {
  setToken(token: string): void;
  connect(): Promise<void>;
  disconnect(): void;
  loadSavedToken(): void;
}
