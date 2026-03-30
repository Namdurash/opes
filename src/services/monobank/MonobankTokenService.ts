const TOKEN_KEY = 'monobank_personal_token';
const CLIENT_NAME_KEY = 'monobank_client_name';

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

function createDefaultStorage(): KeyValueStorage {
  if (typeof jest !== 'undefined') {
    return new InMemoryKeyValueStorage();
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
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
    console.warn('[MonobankTokenService] MMKV unavailable, falling back to in-memory storage.');
    return new InMemoryKeyValueStorage();
  }
}

export interface MonobankCredentials {
  token: string;
  clientName: string;
}

export class MonobankTokenService {
  constructor(private readonly storage: KeyValueStorage = createDefaultStorage()) {}

  save(token: string, clientName: string): void {
    this.storage.set(TOKEN_KEY, token);
    this.storage.set(CLIENT_NAME_KEY, clientName);
  }

  get(): MonobankCredentials | null {
    const token = this.storage.getString(TOKEN_KEY);
    if (!token) return null;
    return { token, clientName: this.storage.getString(CLIENT_NAME_KEY) ?? '' };
  }

  clear(): void {
    this.storage.delete(TOKEN_KEY);
    this.storage.delete(CLIENT_NAME_KEY);
  }
}

export const monobankTokenService = new MonobankTokenService();
