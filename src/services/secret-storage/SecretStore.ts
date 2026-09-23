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
 *
 * OPES-67 — `delete` alone leaves the ciphertext recoverable: MMKV is an append-only
 * log in an mmap, so `remove` appends a tombstone that shadows the earlier record and
 * overwrites no byte of it. `purgeDeletedRecords()` is the explicit rebuild that
 * follows — snapshot the survivors, drop the backing file, reopen, write them back —
 * and `MonobankTokenService.clear()` calls it once after both deletes. It is not
 * called from `delete`: that would rebuild twice per disconnect (D-009).
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

  /**
   * The base64 key the last successful `open()` resolved (D-003). The rebuild reopens
   * with this rather than reading the Keychain again: a read that rejected between the
   * wipe and the restore would leave the survivors with no copy anywhere.
   */
  private openedWith: string | null = null;

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

  // A bare delete, on a present key and an absent one alike: no rebuild from here
  // (D-009 / AC-007) — `clear()` issues the one rebuild after both of its deletes.
  async delete(key: string): Promise<void> {
    const store = await this.bootstrap();
    store.delete(key);
  }

  /**
   * Makes the records `delete` tombstoned physically gone: snapshot every surviving
   * secret, drop the backing file, reopen with the same key, write the snapshot back.
   *
   * Fails closed (D-005 / AC-006). A value the snapshot cannot read back as a string is
   * a value the rebuild would destroy, so a single `undefined` abandons the purge before
   * anything is wiped — the residue is left rather than a live secret lost. A throw from
   * the wipe, the reopen or a restore is not caught (D-011): it reaches `clear()`, and a
   * failed erase must not be reported as a clean disconnect.
   */
  async purgeDeletedRecords(): Promise<void> {
    const store = await this.bootstrap();
    // Narrowing, not a precondition: a resolved bootstrap has always recorded its key.
    const base64 = this.openedWith;
    if (base64 === null) return;

    const survivors = new Map<string, string>();
    for (const key of store.getAllKeys()) {
      const value = store.getString(key);
      if (value === undefined) return;
      survivors.set(key, value);
    }

    this.encrypted.wipe();
    // `readiness` memoizes the instance the wipe just killed, and a write through it is
    // silently dropped rather than rejected. Replace it before the restore, and restore
    // through the fresh handle (D-004 / AC-008).
    const rebuilt = this.encrypted.open(base64);
    this.readiness = Promise.resolve(rebuilt);
    for (const [key, value] of survivors) {
      rebuilt.set(key, value);
    }
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
      this.openedWith = existing;
      return this.encrypted.open(existing);
    }
    // Genuine absence: mint a new key, persist it, discard stale ciphertext under
    // the old key, then open. A key-write rejection propagates and no plaintext or
    // keyless store is ever opened (D-006 / D-007).
    const { base64 } = this.generateKey();
    await this.keychain.writeKey(base64);
    this.encrypted.wipe();
    this.openedWith = base64;
    return this.encrypted.open(base64);
  }
}
