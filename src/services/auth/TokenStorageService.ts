interface TokenPayload {
  token: string;
  expiresAt: number;
}

interface KeyValueStorage {
  set(key: string, value: string | number | boolean): void;
  getString(key: string): string | undefined;
  delete(key: string): void;
}

export interface TokenStorageServiceContract {
  saveToken(token: string | undefined, ttlMs: number): Promise<TokenPayload>;
  getValidToken(): Promise<TokenPayload | null>;
  clear(): Promise<void>;
}

const TOKEN_KEY = 'auth_token';
const EXPIRES_AT_KEY = 'auth_token_expires_at';
const isJestEnvironment = typeof jest !== 'undefined';

class InMemoryKeyValueStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();

  set(key: string, value: string | number | boolean): void {
    this.data.set(key, String(value));
  }

  getString(key: string): string | undefined {
    return this.data.get(key);
  }

  delete(key: string): void {
    this.data.delete(key);
  }
}

function createDefaultStorage(): KeyValueStorage {
  if (isJestEnvironment) {
    return new InMemoryKeyValueStorage();
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
    const { createMMKV } = require('react-native-mmkv') as {
      createMMKV: () => {
        set: (key: string, value: string | number | boolean) => void;
        getString: (key: string) => string | undefined;
        remove: (key: string) => boolean;
      };
    };
    const mmkv = createMMKV();

    return {
      set: (key, value) => {
        mmkv.set(key, value);
      },
      getString: key => mmkv.getString(key),
      delete: key => {
        mmkv.remove(key);
      },
    };
  } catch (error) {
    // App should not crash if MMKV native module is unavailable.
    // This fallback is non-persistent and intended only as a safe runtime guard.
    console.warn('[TokenStorageService] MMKV unavailable, falling back to in-memory storage.', error);
    return new InMemoryKeyValueStorage();
  }
}

function makeToken(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export class TokenStorageService implements TokenStorageServiceContract {
  constructor(private readonly storage: KeyValueStorage = createDefaultStorage()) {}

  async saveToken(token: string | undefined, ttlMs: number): Promise<TokenPayload> {
    const tokenValue = token ?? makeToken();
    const expiresAt = Date.now() + ttlMs;

    this.storage.set(TOKEN_KEY, tokenValue);
    this.storage.set(EXPIRES_AT_KEY, String(expiresAt));

    return { token: tokenValue, expiresAt };
  }

  async getValidToken(): Promise<TokenPayload | null> {
    const token = this.storage.getString(TOKEN_KEY);
    const expiresAtRaw = this.storage.getString(EXPIRES_AT_KEY);

    if (!token || !expiresAtRaw) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      await this.clear();
      return null;
    }

    return { token, expiresAt };
  }

  async clear(): Promise<void> {
    this.storage.delete(TOKEN_KEY);
    this.storage.delete(EXPIRES_AT_KEY);
  }
}
