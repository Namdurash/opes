/**
 * OPES-42 — encrypted secret storage.
 *
 * `SecretStore` keeps secrets encrypted at rest, keyed by a 32-byte crypto-secure
 * key held in the device Keychain, behind a memoized async bootstrap. It exposes
 * its own async API (D-001): `get` resolves the stored string or `null`, `set`
 * resolves `undefined`, `delete` resolves `undefined` (a silent no-op on an absent
 * key).
 *
 * Bootstrap (one memoized readiness Promise, D-002) runs once and every call awaits
 * it: read the Keychain key; if present, open the encrypted store with it; if
 * genuinely absent (read resolves `null`), generate + write a new key, wipe any
 * stale ciphertext, then open (D-007); if the read or the key write rejects,
 * propagate the rejection and never open a plaintext/keyless store (D-006). A
 * rejected readiness is nulled so the next call retries (AC-010).
 *
 * The three backends are constructor dependencies with real defaults (D-010) so
 * tests inject fakes, mirroring MonobankAccountSelectionService.
 */

import { createDefaultKeychainKeyStore, type KeychainKeyPort } from './keychainKeyStore';
import { createEncryptedStore, type EncryptedStoreBackend, type EncryptedStoreInstance } from './encryptedStore';
import { generateKey as defaultGenerateKey, type GeneratedKey } from './cryptoKey';

export type GenerateKey = () => GeneratedKey;

export interface SecretStoreDeps {
  keychain: KeychainKeyPort;
  encrypted: EncryptedStoreBackend;
  generateKey: GenerateKey;
}

const createDefaultDeps = (): SecretStoreDeps => ({
  keychain: createDefaultKeychainKeyStore(),
  encrypted: createEncryptedStore(),
  generateKey: defaultGenerateKey,
});

export class SecretStore {
  private readonly keychain: KeychainKeyPort;

  private readonly encrypted: EncryptedStoreBackend;

  private readonly generateKey: GenerateKey;

  private readiness: Promise<EncryptedStoreInstance> | null = null;

  constructor(deps: SecretStoreDeps = createDefaultDeps()) {
    this.keychain = deps.keychain;
    this.encrypted = deps.encrypted;
    this.generateKey = deps.generateKey;
  }

  async get(key: string): Promise<string | null> {
    const store = await this.bootstrap();
    return store.getString(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const store = await this.bootstrap();
    store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    const store = await this.bootstrap();
    store.delete(key);
  }

  private bootstrap(): Promise<EncryptedStoreInstance> {
    if (this.readiness) {
      return this.readiness;
    }
    const pending = this.open();
    // On a transient failure, drop the memoized readiness so the next call retries
    // (D-002 / AC-010) rather than being permanently disabled.
    pending.catch(() => {
      if (this.readiness === pending) {
        this.readiness = null;
      }
    });
    this.readiness = pending;
    return pending;
  }

  private async open(): Promise<EncryptedStoreInstance> {
    // A rejection here (transient read) propagates and preserves stored data.
    const existing = await this.keychain.readKey();
    if (existing !== null) {
      return this.encrypted.open(existing);
    }
    // Genuine absence: mint a new key, persist it, discard stale ciphertext under
    // the old key, then open. A key-write rejection propagates and no plaintext or
    // keyless store is ever opened (D-006 / D-007).
    const { base64 } = this.generateKey();
    await this.keychain.writeKey(base64);
    this.encrypted.wipe();
    return this.encrypted.open(base64);
  }
}
