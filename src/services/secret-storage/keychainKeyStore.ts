/**
 * OPES-42 — Keychain-backed encryption-key port for the secret store.
 *
 * Wraps a `react-native-keychain`-shaped API into a small port the store depends
 * on: `readKey` resolves the stored base64 key, resolves `null` only when the
 * Keychain reports a genuinely absent entry (`getGenericPassword` === false, D-004),
 * and rejects on any thrown/rejected read (transient — data preserved). `writeKey`
 * stores the key device-only, never synchronized to iCloud (D-005).
 *
 * The real native module is reached only behind a `typeof jest` guard via a lazy
 * `require` (D-012): there is no top-level import, so the uninstalled/unmocked
 * module never loads under Jest — tests inject a fake keychain through
 * constructor-DI instead. If the require itself throws on device (native module
 * missing/unlinked) the error propagates uncaught so bootstrap fails closed
 * (D-014) — there is deliberately no try/catch fallback to an in-memory keychain.
 */

// Stable, module-level Keychain identity (D-009). Not asserted by tests.
const KEYCHAIN_SERVICE = 'com.opes.secret-storage';
const KEYCHAIN_ACCOUNT = 'opes-secret-store-key';

export interface KeychainKeyPort {
  readKey(): Promise<string | null>;
  writeKey(base64: string): Promise<void>;
}

interface KeychainCredentials {
  password: string;
}

interface KeychainOptions {
  service?: string;
  accessible?: string;
}

export interface KeychainApi {
  getGenericPassword(options?: KeychainOptions): Promise<false | KeychainCredentials>;
  setGenericPassword(
    account: string,
    password: string,
    options: KeychainOptions,
  ): Promise<unknown>;
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: string };
}

/**
 * Build the Keychain key port over a `react-native-keychain`-shaped API. Injected
 * with a fake in tests (D-010); the real API is loaded by `resolveKeychainApi`.
 */
export const createKeychainKeyStore = (keychainApi: KeychainApi): KeychainKeyPort => ({
  readKey: async (): Promise<string | null> => {
    // A rejection here propagates as "transient" and preserves stored data (D-004).
    const result = await keychainApi.getGenericPassword({ service: KEYCHAIN_SERVICE });
    if (result === false) {
      return null;
    }
    return result.password;
  },
  writeKey: async (base64: string): Promise<void> => {
    await keychainApi.setGenericPassword(KEYCHAIN_ACCOUNT, base64, {
      service: KEYCHAIN_SERVICE,
      accessible: keychainApi.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
});

const resolveKeychainApi = (): KeychainApi => {
  if (typeof jest !== 'undefined') {
    // The real Keychain is never used under Jest — tests inject a fake keychain via
    // constructor-DI, so this default path must not load the native module.
    throw new Error('react-native-keychain is unavailable under Jest; inject a fake keychain.');
  }
  // No try/catch (D-014): a failed require means no key can be secured, so bootstrap
  // must fail closed rather than fall back to an insecure substitute.
  return require('react-native-keychain') as KeychainApi;
};

/**
 * The default, device-backed Keychain key port used when no fake is injected.
 */
export const createDefaultKeychainKeyStore = (): KeychainKeyPort =>
  createKeychainKeyStore(resolveKeychainApi());
