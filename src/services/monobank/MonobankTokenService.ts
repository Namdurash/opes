/**
 * OPES-58 — the Monobank personal token and client name live in the encrypted
 * secret store from OPES-42, never in plaintext MMKV.
 *
 * The storage seam is `SecretStorePort`, which is `SecretStore`'s public API
 * structurally, so the device singleton assigns to it without a cast and a test
 * hands in a double. All three public methods are promise-returning and carry no
 * try/catch: a rejection from the store reaches the caller as the same value.
 *
 * The secret-storage barrel is reached by a lazy `require` inside the non-Jest
 * branch and by `import type` for the compile-time check — never a top-level value
 * import. That barrel evaluates `new SecretStore()` at module load, and under Jest
 * that construction throws on purpose ("react-native-keychain is unavailable under
 * Jest"); this module is imported by both Monobank stores, by
 * `resetSandboxEnvironment` and by the monobank barrel, so a top-level import would
 * take a large part of the suite down at import time.
 */
import type { SecretStore } from '../secret-storage';

const TOKEN_KEY = 'monobank_personal_token';
const CLIENT_NAME_KEY = 'monobank_client_name';

/** The slice of the encrypted `SecretStore` this service depends on. */
export interface SecretStorePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Jest-only stand-in: the suite never reaches the Keychain or MMKV. */
class InMemorySecretStore implements SecretStorePort {
  private readonly data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
}

export const createDefaultSecretStore = (): SecretStorePort => {
  if (typeof jest !== 'undefined') {
    return new InMemorySecretStore();
  }

  // Lazy on purpose (see the file header) — and the app-wide singleton, not a
  // second `new SecretStore()`.
  const { secretStore } = require('../secret-storage') as { secretStore: SecretStore };
  return secretStore;
};

export interface MonobankCredentials {
  token: string;
  clientName: string;
}

export class MonobankTokenService {
  constructor(private readonly storage: SecretStorePort = createDefaultSecretStore()) {}

  async save(token: string, clientName: string): Promise<void> {
    await this.storage.set(TOKEN_KEY, token);
    await this.storage.set(CLIENT_NAME_KEY, clientName);
  }

  async get(): Promise<MonobankCredentials | null> {
    // Presence is decided by the token key alone, and there is no fallback branch
    // to the plaintext copy left on disk — until OPES-63 migrates it, a previously
    // connected user simply reads as disconnected.
    const token = await this.storage.get(TOKEN_KEY);
    if (!token) return null;
    return { token, clientName: (await this.storage.get(CLIENT_NAME_KEY)) ?? '' };
  }

  async clear(): Promise<void> {
    await this.storage.delete(TOKEN_KEY);
    await this.storage.delete(CLIENT_NAME_KEY);
  }
}

export const monobankTokenService = new MonobankTokenService();
