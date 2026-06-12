const SELECTED_ACCOUNTS_KEY = 'monobank_selected_account_ids';

interface KeyValueStorage {
  set(key: string, value: string): void;
  getString(key: string): string | undefined;
  delete(key: string): void;
}

class InMemoryKeyValueStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();
  set(key: string, value: string): void { this.data.set(key, value); }
  getString(key: string): string | undefined { return this.data.get(key); }
  delete(key: string): void { this.data.delete(key); }
}

const createDefaultStorage = (): KeyValueStorage => {
  if (typeof jest !== 'undefined') {
    return new InMemoryKeyValueStorage();
  }

  try {
    const { createMMKV } = require('react-native-mmkv') as {
      createMMKV: () => {
        set: (key: string, value: string) => void;
        getString: (key: string) => string | undefined;
        remove: (key: string) => void;
      };
    };
    const mmkv = createMMKV();
    return {
      set: (key, value) => mmkv.set(key, value),
      getString: key => mmkv.getString(key),
      delete: key => mmkv.remove(key),
    };
  } catch {
    console.warn('[MonobankAccountSelectionService] MMKV unavailable, falling back to in-memory storage.');
    return new InMemoryKeyValueStorage();
  }
};

/**
 * Persists which Monobank accounts the user wants to sync. A `null` result means
 * the user has not chosen yet — callers should treat that as "sync every account".
 * An explicit (possibly empty) array is the user's chosen allow-list of account ids.
 */
export class MonobankAccountSelectionService {
  constructor(private readonly storage: KeyValueStorage = createDefaultStorage()) {}

  getSelectedAccountIds(): string[] | null {
    const raw = this.storage.getString(SELECTED_ACCOUNTS_KEY);
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(id => typeof id === 'string')) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  setSelectedAccountIds(ids: string[]): void {
    this.storage.set(SELECTED_ACCOUNTS_KEY, JSON.stringify(ids));
  }

  clear(): void {
    this.storage.delete(SELECTED_ACCOUNTS_KEY);
  }
}

export const monobankAccountSelectionService = new MonobankAccountSelectionService();
