/**
 * OPES-63 — the one-time migration of the two Monobank storage keys off plaintext
 * MMKV and onto the encrypted secret store, with the plaintext original deleted
 * only after the encrypted write has been read back equal.
 *
 * Four things about the shape of this file are deliberate.
 *
 * 1. The module under test is reached by `require` inside a helper, NOT by a
 *    top-level `import`. It does not exist yet, and a static ES import of it
 *    would take this whole file down while jest was still loading it — reported
 *    as an unusable suite rather than as an absent feature, with no per-test
 *    result at all. It would also break `tsc --noEmit`, which this suite itself
 *    asserts elsewhere (MonobankTokenService.test.ts), turning a green repo red
 *    for every other ticket. A `require` of a string literal is not resolved by
 *    the compiler, so the type-check stays green while every test below fails on
 *    a missing module until the implementation lands. The port types declared
 *    here are the contract this file is written against; when the module
 *    appears, the cast in `loadMigration` is what holds it to that shape.
 *
 * 2. The secret-store double settles its operations on a timer rather than in the
 *    caller's microtask, and it appends to the shared call log INSIDE that timer.
 *    The real `SecretStore` parks every get/set/delete behind a memoized bootstrap
 *    (Keychain key, then encrypted MMKV instance), so an operation that was fired
 *    but not awaited is observable to nobody. Reproducing that is what makes
 *    AC-006 falsifiable: a migration that issued the read-back and deleted the
 *    plaintext copy without awaiting it would log the delete BEFORE the read-back,
 *    and the adjacency assertion would go red — which is the whole point of it.
 *
 * 3. The plaintext double is synchronous, because the real default MMKV instance
 *    is. It carries no `set`: this migration never writes plaintext (D-005), and a
 *    double that could would let an implementation that does compile.
 *
 * 4. Assertions read the doubles through `peek`, which does not touch the log.
 *    Only the code under test writes to the log, so AC-006's ordering describes
 *    the migration and nothing else.
 */

import { readFileSync } from 'node:fs';
import type { SecretStorePort } from './MonobankTokenService';

// AS-002 — the migration touches exactly these two keys, by literal name.
const TOKEN_KEY = 'monobank_personal_token';
const CLIENT_NAME_KEY = 'monobank_client_name';
// AS-015 — a neighbouring plaintext key that is not a secret and must not move.
const SELECTED_ACCOUNTS_KEY = 'monobank_selected_account_ids';

/** D-005 — the plaintext port: read, delete and rebuild, never write. */
interface PlaintextStorePort {
  getString(key: string): string | undefined;
  delete(key: string): void;
  /**
   * AC-017/AC-018 — rebuilds the store so deleted records are physically gone.
   * MMKV's `remove` only appends a record that shadows the earlier one, so without
   * this the token is still readable in the file after a "successful" migration.
   */
  purgeDeletedRecords(): void;
}

/** D-002 — named ports, so a test cannot pass the two stores in the wrong order. */
interface MonobankSecretMigrationPorts {
  plaintext: PlaintextStorePort;
  secret: SecretStorePort;
}

type MigrateMonobankSecrets = (
  ports?: MonobankSecretMigrationPorts,
) => Promise<void>;

/** See note 1 in the file header — resolved per test, not at load. */
const loadMigration = (): MigrateMonobankSecrets => {
  const { migrateMonobankSecrets } = require('./migrateMonobankSecrets') as {
    migrateMonobankSecrets: MigrateMonobankSecrets;
  };
  return migrateMonobankSecrets;
};

/** The default plaintext MMKV instance's stand-in. Synchronous, like the real one. */
class RecordingPlaintextStore implements PlaintextStorePort {
  /** Keys the migration asked to delete, in call order. */
  readonly deleted: string[] = [];
  private readonly data = new Map<string, string>();

  constructor(private readonly log: string[] = []) {}

  /** A criterion's `given` — a value already on disk, not a write under test. */
  seed(key: string, value: string): this {
    this.data.set(key, value);
    return this;
  }

  /** Reads the double's state for an assertion, without logging a call. */
  peek(key: string): string | undefined {
    return this.data.get(key);
  }

  getString(key: string): string | undefined {
    this.log.push(`plaintext:getString:${key}`);
    return this.data.get(key);
  }

  delete(key: string): void {
    this.log.push(`plaintext:delete:${key}`);
    this.deleted.push(key);
    this.data.delete(key);
  }

  purgeDeletedRecords(): void {
    this.log.push('plaintext:purgeDeletedRecords');
    this.purges += 1;
  }

  /** How many times the migration asked for the store to be rebuilt. */
  purges = 0;
}

interface SecretStoreOptions {
  /** Keys whose `set` rejects with `new Error('boom')`. */
  readonly rejectSetFor?: readonly string[];
  /** Keys whose `get` rejects with `new Error('boom')`. */
  readonly rejectGetFor?: readonly string[];
  /**
   * What the store actually keeps when asked to write. The identity by default;
   * AC-007 hands in a function that keeps something else, so that the read-back
   * cannot equal the value written.
   */
  readonly persistAs?: (value: string) => string;
}

/** The encrypted `SecretStore`'s stand-in — see note 2 in the file header. */
class RecordingSecretStore implements SecretStorePort {
  /** Keys passed to `set`, in call order; its length is the set call count. */
  readonly sets: string[] = [];
  private readonly data = new Map<string, string>();
  private rejectSetFor: readonly string[];
  private readonly rejectGetFor: readonly string[];
  private readonly persistAs: (value: string) => string;

  constructor(
    private readonly log: string[] = [],
    options: SecretStoreOptions = {},
  ) {
    this.rejectSetFor = options.rejectSetFor ?? [];
    this.rejectGetFor = options.rejectGetFor ?? [];
    this.persistAs = options.persistAs ?? (value => value);
  }

  /** A criterion's `given` — a value the encrypted store already holds. */
  seed(key: string, value: string): this {
    this.data.set(key, value);
    return this;
  }

  /** Reads the double's state for an assertion, without logging a call. */
  peek(key: string): string | undefined {
    return this.data.get(key);
  }

  /** AC-013 — the second run meets the same store, now able to write. */
  acceptWrites(): this {
    this.rejectSetFor = [];
    return this;
  }

  get(key: string): Promise<string | null> {
    return this.settle(() => {
      this.log.push(`secret:get:${key}`);
      if (this.rejectGetFor.includes(key)) throw new Error('boom');
      return this.data.get(key) ?? null;
    });
  }

  set(key: string, value: string): Promise<void> {
    return this.settle(() => {
      this.log.push(`secret:set:${key}`);
      this.sets.push(key);
      if (this.rejectSetFor.includes(key)) throw new Error('boom');
      this.data.set(key, this.persistAs(value));
    });
  }

  delete(key: string): Promise<void> {
    return this.settle(() => {
      this.log.push(`secret:delete:${key}`);
      this.data.delete(key);
    });
  }

  private settle<T>(work: () => T): Promise<T> {
    const pending = new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(work());
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
    // Marked handled inside the double: an implementation that fires an operation
    // without awaiting it drops the promise on the floor, and the unhandled-rejection
    // warning that follows is noise around the assertion rather than evidence either
    // way. A caller that DOES await still receives the same rejection.
    pending.catch(() => {});
    return pending;
  }
}

beforeEach(() => {
  // AS-009 — a per-key failure is reported by a console warning. Several criteria
  // below drive failure branches on purpose; the warning itself is asserted by no
  // criterion (VG-006), it is silenced here only to keep the reporter readable.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('migrateMonobankSecrets on a fresh install', () => {
  it('AC-001 — writes nothing to the encrypted store when no plaintext copy exists', async () => {
    // A fresh install: nothing was ever written in plaintext, so there is nothing
    // to move and the encrypted store must not be touched at all.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log);
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(secret.sets.length).toBe(0);
  });
});

describe('migrateMonobankSecrets with a legacy plaintext copy', () => {
  it('AC-002 — copies the plaintext token into the encrypted store', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(secret.peek(TOKEN_KEY)).toBe('legacy-tok');
  });

  it('AC-003 — copies the plaintext client name into the encrypted store', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(secret.peek(CLIENT_NAME_KEY)).toBe('Ada Lovelace');
  });

  it('AC-004 — deletes the plaintext token once it is safely across', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(plaintext.deleted).toContain('monobank_personal_token');
  });

  it('AC-005 — deletes the plaintext client name once it is safely across', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(plaintext.deleted).toContain('monobank_client_name');
  });
});

describe('migrateMonobankSecrets — the read-back gate before the destructive step', () => {
  it('AC-006 — deletes the plaintext token immediately after reading it back', async () => {
    // The one ordering property that makes a crash mid-migration survivable: the
    // entry before the delete is the read-back, so nothing can sit between the two
    // and no other branch may reach a delete of a value it has not re-read.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    const deleteIndex = log.indexOf(`plaintext:delete:${TOKEN_KEY}`);
    expect(log[deleteIndex - 1]).toBe('secret:get:monobank_personal_token');
  });

  it('AC-007 — deletes nothing when the read-back differs from what was written', async () => {
    // The encrypted store answers `null` before the write and a one-character
    // different string after it, so the write did not survive intact. Deleting the
    // plaintext original here would lose the token outright.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    const secret = new RecordingSecretStore(log, { persistAs: () => 'legacy-t0k' });

    await loadMigration()({ plaintext, secret });

    expect(plaintext.deleted.length).toBe(0);
  });
});

describe('migrateMonobankSecrets when the encrypted store already holds a value', () => {
  it('AC-008 — leaves the encrypted token untouched rather than overwriting it', async () => {
    // A user who reconnected after OPES-58 has a current encrypted token and a
    // stale plaintext one. The encrypted value wins; no `set` is issued for it.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    const secret = new RecordingSecretStore(log).seed(TOKEN_KEY, 'encrypted-tok');

    await loadMigration()({ plaintext, secret });

    expect(secret.peek(TOKEN_KEY)).toBe('encrypted-tok');
  });

  it('AC-009 — still deletes the stale plaintext token', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    const secret = new RecordingSecretStore(log).seed(TOKEN_KEY, 'encrypted-tok');

    await loadMigration()({ plaintext, secret });

    expect(plaintext.deleted).toContain('monobank_personal_token');
  });
});

describe('migrateMonobankSecrets when one key fails', () => {
  it('AC-010 — migrates the token even though the client name write rejects', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log, {
      rejectSetFor: [CLIENT_NAME_KEY],
    });

    await loadMigration()({ plaintext, secret });

    expect(plaintext.deleted).toContain('monobank_personal_token');
  });

  it('AC-011 — leaves the plaintext copy of the failed key where it is', async () => {
    // Nothing reached the encrypted store for this key, so the plaintext copy is
    // the only copy left; deleting it would be the data loss the gate exists to
    // prevent, and the next launch retries it.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log, {
      rejectSetFor: [CLIENT_NAME_KEY],
    });

    await loadMigration()({ plaintext, secret });

    expect(plaintext.peek(CLIENT_NAME_KEY)).toBe('Ada Lovelace');
  });

  it('AC-012 — resolves rather than rejecting when the encrypted store is unusable', async () => {
    // AS-008/AS-010 — the migration runs on the startup path. Every per-key failure
    // is swallowed, so a broken secret store cannot stop the app launching: awaiting
    // it here must yield undefined and must not throw.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log, {
      rejectGetFor: [TOKEN_KEY, CLIENT_NAME_KEY],
      rejectSetFor: [TOKEN_KEY, CLIENT_NAME_KEY],
    });

    const result: unknown = await loadMigration()({ plaintext, secret });

    expect(result).toBeUndefined();
  });
});

describe('migrateMonobankSecrets run more than once', () => {
  it('AC-013 — retries a key whose earlier run failed', async () => {
    // Absence of the plaintext key is the whole idempotency mechanism (AS-003): a
    // key that failed still has its plaintext copy, so the next launch picks it up.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    const secret = new RecordingSecretStore(log, { rejectSetFor: [TOKEN_KEY] });

    await loadMigration()({ plaintext, secret });
    await loadMigration()({ plaintext, secret: secret.acceptWrites() });

    expect(secret.peek(TOKEN_KEY)).toBe('legacy-tok');
  });

  it('AC-014 — writes each key exactly once across two runs', async () => {
    // The second run finds both plaintext keys gone and must write nothing, with no
    // marker key, flag or version number anywhere to tell it so.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });
    await loadMigration()({ plaintext, secret });

    expect(secret.sets.length).toBe(2);
  });
});

describe('migrateMonobankSecrets and its plaintext neighbours', () => {
  it('AC-015 — leaves the selected-account ids in plaintext untouched', async () => {
    // AS-015 — the account selection is not a secret and this ticket does not move
    // it. The migration names its two keys; it never enumerates or prefix-matches.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(SELECTED_ACCOUNTS_KEY, '["acc-1"]');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(plaintext.peek(SELECTED_ACCOUNTS_KEY)).toBe('["acc-1"]');
  });
});

describe('migrateMonobankSecrets and the bytes left behind by a delete', () => {
  // Deleting a key from MMKV appends a zero-length record that shadows the earlier
  // one; the original bytes are never overwritten. Verified on device: after a
  // migration that passed every other criterion, `strings mmkv.default` still
  // printed the token. Neither trim() nor clearAll() erases it. So a delete is only
  // half the job, and these two criteria pin the other half.

  it('AC-017 — rebuilds the plaintext store once it has deleted something', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Legacy User');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(plaintext.purges).toBe(1);
  });

  it('AC-017 — rebuilds only after the last delete, never between the two keys', async () => {
    // The rebuild drops the backing file and recreates it. Doing that between the
    // two keys would invalidate the handle the second delete still needs.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log)
      .seed(TOKEN_KEY, 'legacy-tok')
      .seed(CLIENT_NAME_KEY, 'Legacy User');
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    const purgeAt = log.indexOf('plaintext:purgeDeletedRecords');
    const lastDeleteAt = log.lastIndexOf(`plaintext:delete:${CLIENT_NAME_KEY}`);
    expect(purgeAt).toBeGreaterThan(lastDeleteAt);
  });

  it('AC-018 — rebuilds nothing on a fresh install, where it deleted nothing', async () => {
    // No residue of ours to clear. Rebuilding regardless would delete and recreate
    // the file on every single launch, for no gain.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log);
    const secret = new RecordingSecretStore(log);

    await loadMigration()({ plaintext, secret });

    expect(plaintext.purges).toBe(0);
  });

  it('AC-018 — rebuilds nothing when the read-back failed and nothing was deleted', async () => {
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    const secret = new RecordingSecretStore(log, {
      persistAs: value => `${value}-corrupted`,
    });

    await loadMigration()({ plaintext, secret });

    expect(plaintext.deleted).toEqual([]);
    expect(plaintext.purges).toBe(0);
  });

  it('AC-019 — a rebuild that throws does not fail the migration', async () => {
    // It runs at launch. A store that cannot be rebuilt leaves the residue behind,
    // which is no worse than not having run, and must not stop the app starting.
    const log: string[] = [];
    const plaintext = new RecordingPlaintextStore(log).seed(TOKEN_KEY, 'legacy-tok');
    plaintext.purgeDeletedRecords = () => {
      throw new Error('boom');
    };
    const secret = new RecordingSecretStore(log);

    await expect(loadMigration()({ plaintext, secret })).resolves.toBeUndefined();
    expect(plaintext.deleted).toEqual([TOKEN_KEY]);
  });
});

describe('src/services/monobank/CLAUDE.md', () => {
  it('AC-016 — documents the legacy plaintext migration', () => {
    // Read from the project root, which is where jest is invoked from.
    const doc = readFileSync('src/services/monobank/CLAUDE.md', 'utf8');

    expect(doc).toContain('one-time migration');
  });
});
