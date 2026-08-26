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
 */

// Stable, module-level MMKV instance id for secrets (D-009). Not asserted by tests.
const SECRET_MMKV_ID = 'opes.secret-storage';

export interface EncryptedStoreInstance {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
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
      const mmkv = createMMKV({
        id: SECRET_MMKV_ID,
        encryptionKey: base64,
        encryptionType: 'AES-256',
      });
      return {
        getString: key => mmkv.getString(key),
        set: (key, value) => mmkv.set(key, value),
        delete: key => {
          mmkv.remove(key);
        },
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
