/**
 * OPES-42 — encrypted-at-rest backend for the secret store.
 *
 * On device the secrets live in a dedicated MMKV instance encrypted with the
 * 32-byte key from the Keychain: `createMMKV({ id, encryptionKey, encryptionType:
 * 'AES-256' })` (D-008). `wipe()` deletes that instance (`deleteMMKV(id)`) so stale
 * ciphertext under a rotated key is discarded rather than read back as garbage
 * (D-007). A `typeof jest` branch backs both with an in-memory `Map`; on device an
 * un-openable encrypted instance surfaces its error and is never degraded to an
 * in-memory or plaintext store (D-008, fail closed).
 *
 * OPES-67 adds `getAllKeys()` — the enumeration `SecretStore.purgeDeletedRecords`
 * needs to snapshot the surviving secrets before it drops the file — and stops the
 * MMKV branch capturing the handle `open()` created (D-006).
 */

// Stable, module-level MMKV instance id for secrets (D-009). Not asserted by tests.
const SECRET_MMKV_ID = 'opes.secret-storage';

export interface EncryptedStoreInstance {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  /**
   * OPES-67 — the enumeration `SecretStore.purgeDeletedRecords` snapshots the
   * surviving secrets with before it drops the backing file (D-001).
   */
  getAllKeys(): string[];
}

export interface EncryptedStoreBackend {
  open(base64: string): EncryptedStoreInstance;
  wipe(): void;
}

// Hand-written because the module is reached through a lazy `require` cast, which tsc
// cannot reconcile against the real package. Mirror react-native-mmkv's actual surface
// exactly: the instance method is `remove`, NOT `delete`. Declaring `delete` compiled
// cleanly and failed on device as "undefined is not a function" — invisible to every
// gate, because the Jest branch never reaches this code.
interface MMKVInstance {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): boolean;
  getAllKeys(): string[];
}

interface MMKVModule {
  createMMKV(config: {
    id: string;
    encryptionKey: string;
    encryptionType: string;
  }): MMKVInstance;
  deleteMMKV(id: string): boolean;
}

const createInMemoryEncryptedStore = (): EncryptedStoreBackend => {
  const data = new Map<string, string>();
  const instance: EncryptedStoreInstance = {
    getString: key => data.get(key),
    set: (key, value) => {
      data.set(key, value);
    },
    delete: key => {
      data.delete(key);
    },
    getAllKeys: () => [...data.keys()],
  };
  return {
    open: () => instance,
    wipe: () => {
      data.clear();
    },
  };
};

const createMMKVEncryptedStore = (): EncryptedStoreBackend => {
  // No try/catch: a failure to open the encrypted instance must reject and never
  // degrade to an in-memory or plaintext store (D-008).
  const { createMMKV, deleteMMKV } = require('react-native-mmkv') as MMKVModule;
  return {
    open: (base64: string): EncryptedStoreInstance => {
      // Resolved per operation, never captured in this closure (OPES-67 / D-006).
      // `wipe()` is `deleteMMKV`, which silently invalidates every handle taken
      // before it — writes through a stale one are dropped rather than rejected, so
      // the rebuild's restore would go nowhere. MMKV caches live instances by id, so
      // this costs a lookup and always yields the current one. Same rule as
      // migrateMonobankSecrets.ts one layer down.
      const instance = (): MMKVInstance =>
        createMMKV({
          id: SECRET_MMKV_ID,
          encryptionKey: base64,
          encryptionType: 'AES-256',
        });
      return {
        getString: key => instance().getString(key),
        set: (key, value) => instance().set(key, value),
        delete: key => {
          instance().remove(key);
        },
        getAllKeys: () => instance().getAllKeys(),
      };
    },
    wipe: () => deleteMMKV(SECRET_MMKV_ID),
  };
};

/**
 * The default encrypted backend: an in-memory Map under Jest, an AES-256 MMKV
 * instance on device.
 */
export const createEncryptedStore = (): EncryptedStoreBackend =>
  typeof jest !== 'undefined' ? createInMemoryEncryptedStore() : createMMKVEncryptedStore();
