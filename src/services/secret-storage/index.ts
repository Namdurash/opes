/**
 * OPES-42 — secret-storage barrel.
 *
 * Public entry point for the encrypted secret-storage module. Consumers import
 * `SecretStore` (or the default `secretStore` singleton) through this barrel — never
 * the individual backend files. Wiring the Monobank token onto this store is OPES-49
 * and lives elsewhere.
 */

export { SecretStore } from './SecretStore';
export type { SecretStoreDeps, GenerateKey } from './SecretStore';
export type { KeychainKeyPort } from './keychainKeyStore';
export type {
  EncryptedStoreBackend,
  EncryptedStoreInstance,
} from './encryptedStore';
export type { GeneratedKey } from './cryptoKey';

import { SecretStore } from './SecretStore';

/** Default device-backed singleton for app consumers. */
export const secretStore = new SecretStore();
