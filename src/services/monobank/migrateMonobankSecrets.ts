/**
 * OPES-63 — the one-time migration that moves the two Monobank storage keys off the
 * default plaintext MMKV instance and onto the encrypted secret store from OPES-42.
 *
 * OPES-58 sent every new write to the encrypted store but left the copy an older
 * build had already written where it was, so a user who connected before that change
 * reads as disconnected AND still has the token sitting in plaintext. This module is
 * what closes both halves of that, on the startup path, once per launch.
 *
 * The destructive step is gated, and the gate is the whole design:
 *
 * - Per key, the ONLY signal that the work is already done is the plaintext key being
 *   absent. Nothing persists a marker, a flag or a version number (D-014/AS-003), so a
 *   key whose run failed still has its plaintext copy and is simply retried next launch.
 * - The plaintext original is deleted only immediately after a `get` that proves the
 *   value is in the encrypted store — either a pre-write `get` that found an existing
 *   value (the encrypted copy wins outright, no `set` is issued) or the read-back after
 *   the write, compared with strict equality. A read-back that is `null`, or differs by
 *   one character, deletes nothing; the plaintext copy is then the only copy left and
 *   losing it would lose the token.
 * - Each key runs inside its own try/catch and nothing is rethrown. The migration always
 *   resolves `undefined`, because it runs at launch and a broken secret store must not
 *   be able to stop the app starting (AS-008/AS-010).
 *
 * The two keys are named literally. This never enumerates the plaintext instance's keys
 * and never matches by prefix: `monobank_selected_account_ids` and every other plaintext
 * value in the app are none of its business (AS-002/AS-015).
 */
import { createDefaultSecretStore } from './MonobankTokenService';
import type { SecretStorePort } from './MonobankTokenService';

/**
 * The default plaintext MMKV instance, as this migration uses it: read, delete, and
 * rebuild. Deliberately no `set` — the migration never writes plaintext, and a port
 * that could would let an implementation that does compile (D-005).
 */
export interface PlaintextStorePort {
  getString(key: string): string | undefined;
  delete(key: string): void;
  /**
   * Rebuild the backing store from its surviving keys, so the records `delete` removed
   * are physically gone rather than merely shadowed.
   *
   * MMKV is an append-only log in an mmap: `remove` appends a zero-length record that
   * hides the earlier one, and nothing ever overwrites the original bytes. After the
   * deletes above the store honestly reports the key as absent while `strings` on the
   * file still prints the token — which is the whole exposure this migration exists to
   * close, so removing the key is not on its own enough. Verified on device: neither
   * `trim()` nor `clearAll()` erases it; only deleting the file does.
   *
   * Must not reject or throw: a store that cannot be rebuilt leaves the residue behind,
   * which is no worse than not having run, and must not fail the launch.
   */
  purgeDeletedRecords(): void;
}

/** Named ports, so the two stores cannot be handed over in the wrong order (D-002). */
export interface MonobankSecretMigrationPorts {
  plaintext: PlaintextStorePort;
  secret: SecretStorePort;
}

/**
 * AS-002 — exactly these keys, in this order. The token first, so the shared-call-log
 * ordering a test can observe is deterministic; nothing else depends on the order.
 */
const MIGRATED_KEYS = ['monobank_personal_token', 'monobank_client_name'] as const;

// Hand-written because the module is reached through a lazy `require` cast, which tsc
// cannot reconcile against the real package. Mirror react-native-mmkv's actual surface
// exactly: the instance method is `remove`, NOT `delete` — see the same note in
// src/services/secret-storage/encryptedStore.ts, where declaring `delete` compiled
// cleanly and failed on device as "undefined is not a function".
interface MMKVInstance {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): boolean;
  getAllKeys(): string[];
}

/**
 * The id of the unconfigured instance `createMMKV()` returns — the same name the file
 * carries on disk (`Documents/mmkv/mmkv.default`) and the one MMKV logs it under.
 */
const DEFAULT_MMKV_ID = 'mmkv.default';

const createInMemoryPlaintextStore = (): PlaintextStorePort => {
  const data = new Map<string, string>();
  return {
    getString: key => data.get(key),
    delete: key => {
      data.delete(key);
    },
    // A Map has no append log and no residue, so the rebuild is already true of it.
    purgeDeletedRecords: () => {},
  };
};

/**
 * The default plaintext instance: `createMMKV()` with no configuration, which is the
 * same unencrypted store `MonobankAccountSelectionService` writes to and the same one an
 * older build left the token in. The `require` is lazy and the Jest branch never reaches
 * it — a top-level import would load a native module the suite has no business touching.
 */
const createDefaultPlaintextStore = (): PlaintextStorePort => {
  if (typeof jest !== 'undefined') {
    return createInMemoryPlaintextStore();
  }

  const { createMMKV, deleteMMKV } = require('react-native-mmkv') as {
    createMMKV: () => MMKVInstance;
    deleteMMKV: (id: string) => boolean;
  };

  // Resolved per call, never captured in this closure. `purgeDeletedRecords` deletes
  // the backing file, and every handle taken before that point stops working — writes
  // through one are silently dropped, not rejected. MMKV caches live instances by id,
  // so this costs a lookup and always yields the current one.
  const instance = (): MMKVInstance => createMMKV();

  return {
    getString: key => instance().getString(key),
    delete: key => {
      instance().remove(key);
    },
    purgeDeletedRecords: () => {
      const mmkv = instance();
      const survivors = new Map<string, string>();
      for (const key of mmkv.getAllKeys()) {
        const value = mmkv.getString(key);
        // Fail closed. Today every remaining key holds a string (`theme_mode`,
        // `monobank_selected_account_ids`), but a value this cannot read back is a
        // value the rebuild would drop — so leave the residue rather than lose it.
        if (value === undefined) return;
        survivors.set(key, value);
      }

      deleteMMKV(DEFAULT_MMKV_ID);
      const rebuilt = instance();
      for (const [key, value] of survivors) {
        rebuilt.set(key, value);
      }
    },
  };
};

const createDefaultPorts = (): MonobankSecretMigrationPorts => ({
  plaintext: createDefaultPlaintextStore(),
  secret: createDefaultSecretStore(),
});

/**
 * AS-009 — one warning per failed key, naming the key and the fact that the next launch
 * retries it. Neither the plaintext value, the read-back value nor the caught error is
 * interpolated: the two values here are the token and the client name (D-013).
 */
const warnRetryNextLaunch = (key: string): void => {
  console.warn(
    `[migrateMonobankSecrets] "${key}" could not be moved to the encrypted store. ` +
      'The plaintext copy is left in place and the next launch retries it.',
  );
};

/** Resolves `true` when this key's plaintext copy was deleted on this run. */
const migrateKey = async (
  key: string,
  { plaintext, secret }: MonobankSecretMigrationPorts,
): Promise<boolean> => {
  try {
    const value = plaintext.getString(key);
    // The key is absent, which is the one and only "already migrated" signal. The
    // empty string is a present value and migrates like any other (AS-003/AS-004).
    if (value === undefined) return false;

    const existing = await secret.get(key);
    if (existing !== null) {
      // The encrypted copy wins: it is current, the plaintext one is stale. No `set`
      // is issued, and no read-back is needed — the value just read IS the proof the
      // secret survives the delete (AS-006).
      plaintext.delete(key);
      return true;
    }

    await secret.set(key, value);
    // Re-read rather than trusting the write. Nothing may come between this `get` and
    // the `delete` below: that adjacency is what makes a crash mid-migration survivable.
    const readBack = await secret.get(key);
    if (readBack !== value) {
      warnRetryNextLaunch(key);
      return false;
    }
    plaintext.delete(key);
    return true;
  } catch {
    // A rejected get, a rejected set or a throwing plaintext read all land here. No
    // delete was issued on any of those paths, so the plaintext copy survives and the
    // next launch tries again (AS-008/AS-016).
    warnRetryNextLaunch(key);
    return false;
  }
};

/**
 * Moves the Monobank token and client name into the encrypted secret store, deletes the
 * plaintext originals, and rebuilds the plaintext store so the deleted bytes are gone
 * from the file rather than merely shadowed. Safe to call on every launch: it is
 * idempotent, each key is independent of the other, and it never rejects.
 */
export const migrateMonobankSecrets = async (
  ports: MonobankSecretMigrationPorts = createDefaultPorts(),
): Promise<void> => {
  // Sequential and one key at a time, not Promise.all: the keys share a secret store
  // whose operations are ordered, and the call log a test reads must be unambiguous.
  let deletedAny = false;
  for (const key of MIGRATED_KEYS) {
    if (await migrateKey(key, ports)) {
      deletedAny = true;
    }
  }

  // Only when this run actually deleted something. On every later launch there is no
  // residue of ours to clear, and rebuilding the store regardless would delete and
  // recreate the file on each start for no gain.
  if (!deletedAny) return;

  try {
    ports.plaintext.purgeDeletedRecords();
  } catch {
    console.warn(
      '[migrateMonobankSecrets] the plaintext store could not be rebuilt. The keys are ' +
        'deleted, but their bytes may remain in the file until it is next compacted.',
    );
  }
};
