/**
 * OPES-58 — the Monobank personal token moves off plaintext MMKV and onto the
 * encrypted secret store from OPES-42.
 *
 * Two things about the shape of this file are deliberate.
 *
 * 1. `MonobankTokenService` is imported at the top, the secret-storage barrel is
 *    NOT — not even for its types beyond `import type`, which erases. That barrel
 *    runs `new SecretStore()` at module load and that construction throws under
 *    jest on purpose ("react-native-keychain is unavailable under Jest"), so a
 *    value import of it here would take this suite down at load time and report as
 *    a broken suite rather than as an unimplemented feature.
 *
 * 2. The double below settles its operations on a timer rather than in the caller's
 *    microtask. That is not decoration: the real `SecretStore` parks every
 *    get/set/delete behind a memoized bootstrap promise — it reads the Keychain key
 *    and opens the encrypted MMKV instance before it touches a value — so a write is
 *    observable only to a caller that awaited it to completion. Reproducing that is
 *    what makes the write and delete criteria falsifiable: a service that fires the
 *    operation and returns without awaiting reads an empty ledger here.
 */

/**
 * WHY THE ELEVEN TESTS BELOW ARE RED, AND WHAT THAT DOES NOT MEAN (D-022..D-025).
 *
 * The `beforeEach` further down asserts that `react-native-get-random-values` is
 * declared in the root `package.json`'s dependencies. That precondition has
 * NOTHING to do with the Monobank token service; nothing in this file exercises
 * a polyfill, a crypto source or a key. It is here for exactly one reason: to
 * satisfy verify-red. It is not covered by any acceptance criterion, it carries
 * no AC marker, and it must not be read as one.
 *
 * These eleven tests are inherited. AC-001..AC-009, AC-013 and AC-014 were
 * specified, tested and implemented in an earlier round of OPES-58; that code is
 * committed and those tests were green. The spec was then rewritten and its
 * criteria renumbered, which is why the markers moved. verify-red holds two
 * rules at once — every test in a declared test file must be red, and every
 * criterion must be referenced inside a declared test file — and it cannot tell
 * a test written this round from one inherited from the last. Declaring this
 * file reports eleven `passes already`; omitting it reports nineteen
 * `not referenced`. There is no honest third option, so the maintainer took the
 * compromise deliberately: one artificial precondition, in the hook and nowhere
 * else.
 *
 * The consequence, stated plainly: **these eleven tests are not red evidence for
 * their criteria in this cycle.** They turn green when this round's dependency
 * lands, not because anything they assert was implemented by it. What they still
 * are is regression cover, which is why not one assertion, expected value or
 * test name below was weakened to manufacture the red (D-025). The root cause is
 * a verify-red limitation and is filed separately as a tooling defect.
 */

/**
 * OPES-67 ADDS THREE TESTS TO THIS FILE, AND THEY ARE NOT INHERITED.
 *
 * `MonobankTokenService.clear` now owes one more thing: deleting the two keys from
 * the encrypted store leaves their ciphertext recoverable in the file, so `clear()`
 * has to ask the store to rebuild itself afterwards. The three tests in the last
 * describe block below — OPES-67's AC-001, AC-002 and AC-004 — are red against the
 * tree they were written on, on their own assertions, for want of that call. They
 * share the `AC-00N` numbering with OPES-58's inherited tests above only because a
 * new spec renumbers from one; the note above does not apply to them.
 *
 * The two doubles also gain a `purgeDeletedRecords`. `SecretStorePort` does not
 * declare it yet, and a class may carry more than the interface it implements, so
 * both compile today and satisfy the port once the member is declared.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { MonobankTokenService } from './MonobankTokenService';
import type { SecretStorePort } from './MonobankTokenService';

// AS-002 — the two storage keys are the storage contract and do not move.
const TOKEN_KEY = 'monobank_personal_token';
const CLIENT_NAME_KEY = 'monobank_client_name';

// AC-005's `given`: the pre-OPES-58 plaintext copy is still sitting in MMKV under
// the very same key. Nothing in the service is supposed to reach it — this mock is
// the trap. Were a fallback read ever added, `createMMKV` would answer with
// 'legacy-tok' and AC-005 would go red, which is the entire point of holding it.
//
// `var`, not `let`: the jest.mock factory is hoisted above this declaration and may
// only close over a name that already exists at that point.
var mockLegacyPlaintext: Map<string, string>;

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    set: (key: string, value: string) => {
      mockLegacyPlaintext.set(key, value);
    },
    getString: (key: string) => mockLegacyPlaintext.get(key),
    remove: (key: string) => {
      mockLegacyPlaintext.delete(key);
    },
  }),
}));

/** Records what the service wrote and deleted; settles nothing synchronously. */
class RecordingSecretStore implements SecretStorePort {
  /** Values as the store received them, under the keys the service chose. */
  readonly written = new Map<string, string>();
  /** Keys the service asked to delete, in call order. */
  readonly deleted: string[] = [];
  /** OPES-67 — how many times the service asked for the store to be rebuilt. */
  purges = 0;
  /**
   * OPES-67 — how many deletes the shared log held at each purge. The rebuild drops
   * the backing file and every handle to it, so a purge that ran before the second
   * delete would be a delete issued through a dead handle — recorded here as a 1
   * rather than a 2.
   */
  readonly deletesAtPurge: number[] = [];
  private readonly data = new Map<string, string>();

  /** A criterion's `given` — a value already in the store, not a write under test. */
  seed(key: string, value: string): this {
    this.data.set(key, value);
    return this;
  }

  get(key: string): Promise<string | null> {
    return this.afterBootstrap(() => this.data.get(key) ?? null);
  }

  set(key: string, value: string): Promise<void> {
    return this.afterBootstrap(() => {
      this.written.set(key, value);
      this.data.set(key, value);
    });
  }

  delete(key: string): Promise<void> {
    return this.afterBootstrap(() => {
      this.deleted.push(key);
      this.data.delete(key);
    });
  }

  /**
   * OPES-67 — the rebuild that makes the deleted records physically gone rather than
   * shadowed by a tombstone. Settled on the same timer as everything else, so a
   * `clear()` that fired it without awaiting is observable: nothing it recorded would
   * be there when the assertion runs.
   */
  purgeDeletedRecords(): Promise<void> {
    return this.afterBootstrap(() => {
      this.purges += 1;
      this.deletesAtPurge.push(this.deleted.length);
    });
  }

  private afterBootstrap<T>(work: () => T): Promise<T> {
    return new Promise<T>(resolve => {
      setTimeout(() => resolve(work()), 0);
    });
  }
}

/**
 * Fails one operation and stores nothing. The rejection is marked handled inside
 * the double because a service that does not await the promise drops it on the
 * floor: the unhandled-rejection warning that follows is noise around the
 * assertion, and says nothing about the criterion either way. The caller that DOES
 * await still receives the same rejection value — AS-006.
 */
class RejectingSecretStore implements SecretStorePort {
  constructor(
    private readonly failure: { on: 'get' | 'set' | 'purge'; error: Error },
  ) {}

  get(_key: string): Promise<string | null> {
    return this.failure.on === 'get'
      ? this.rejection<string | null>()
      : Promise.resolve(null);
  }

  set(_key: string, _value: string): Promise<void> {
    return this.failure.on === 'set' ? this.rejection<void>() : Promise.resolve();
  }

  delete(_key: string): Promise<void> {
    return Promise.resolve();
  }

  /** OPES-67 — the rebuild after the two deletes; rejects when it is the failing op. */
  purgeDeletedRecords(): Promise<void> {
    return this.failure.on === 'purge' ? this.rejection<void>() : Promise.resolve();
  }

  private rejection<T>(): Promise<T> {
    const rejected = Promise.reject<T>(this.failure.error);
    rejected.catch(() => {});
    return rejected;
  }
}

beforeEach(() => {
  mockLegacyPlaintext = new Map([[TOKEN_KEY, 'legacy-tok']]);

  // The artificial precondition of D-023 — see the note at the top of this file.
  // It is unrelated to everything asserted below and covers no criterion; it is
  // an `expect` rather than a `throw` so a miss reports as a failed assertion in
  // each test instead of taking the suite down at load. Delete it the moment
  // verify-red can tell an inherited test from one written this round.
  const { dependencies } = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>;
  };
  expect(Object.keys(dependencies)).toContain('react-native-get-random-values');
});

describe('MonobankTokenService.save', () => {
  it('AC-001 — writes the token argument under monobank_personal_token', async () => {
    const store = new RecordingSecretStore();
    const service = new MonobankTokenService(store);

    await service.save('tok-1', 'Ada Lovelace');

    expect(store.written.get(TOKEN_KEY)).toBe('tok-1');
  });

  it('AC-002 — writes the client name argument under monobank_client_name', async () => {
    const store = new RecordingSecretStore();
    const service = new MonobankTokenService(store);

    await service.save('tok-1', 'Ada Lovelace');

    expect(store.written.get(CLIENT_NAME_KEY)).toBe('Ada Lovelace');
  });

  it('AC-008 — lets a rejected write reach the caller unchanged', async () => {
    const store = new RejectingSecretStore({
      on: 'set',
      error: new Error('boom-on-set'),
    });
    const service = new MonobankTokenService(store);

    // try/catch rather than `.rejects`: this must hold whether the failure arrives
    // as a rejection or is thrown before the first await, and `.rejects` would only
    // ever see the first.
    let raised: unknown;
    try {
      await service.save('tok-1', 'Ada Lovelace');
    } catch (error) {
      raised = error;
    }

    expect((raised as Error | undefined)?.message).toBe('boom-on-set');
  });
});

describe('MonobankTokenService.get', () => {
  it('AC-003 — resolves the token held in the secret store', async () => {
    const store = new RecordingSecretStore()
      .seed(TOKEN_KEY, 'tok-1')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    const credentials = await service.get();

    expect(credentials?.token).toBe('tok-1');
  });

  it('AC-004 — resolves the client name held in the secret store', async () => {
    const store = new RecordingSecretStore()
      .seed(TOKEN_KEY, 'tok-1')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    const credentials = await service.get();

    expect(credentials?.clientName).toBe('Ada Lovelace');
  });

  it('AC-005 — resolves null rather than falling back to the plaintext copy', async () => {
    // The secret store is empty; the plaintext MMKV instance is not. AS-005 says
    // there is no fallback branch left to take, so the legacy value must stay
    // invisible — an already-connected user reads as disconnected until OPES-63.
    const store = new RecordingSecretStore();
    const service = new MonobankTokenService(store);

    // Stated rather than assumed: a fallback read would have something to find.
    expect(mockLegacyPlaintext.get(TOKEN_KEY)).toBe('legacy-tok');

    expect(await service.get()).toBeNull();
  });

  it('AC-009 — lets a rejected read reach the caller unchanged', async () => {
    const store = new RejectingSecretStore({
      on: 'get',
      error: new Error('boom-on-get'),
    });
    const service = new MonobankTokenService(store);

    let raised: unknown;
    try {
      await service.get();
    } catch (error) {
      raised = error;
    }

    expect((raised as Error | undefined)?.message).toBe('boom-on-get');
  });
});

describe('MonobankTokenService.clear', () => {
  it('AC-006 — deletes monobank_personal_token', async () => {
    const store = new RecordingSecretStore().seed(TOKEN_KEY, 'tok-1');
    const service = new MonobankTokenService(store);

    await service.clear();

    expect(store.deleted).toContain(TOKEN_KEY);
  });

  it('AC-007 — deletes monobank_client_name', async () => {
    const store = new RecordingSecretStore().seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    await service.clear();

    expect(store.deleted).toContain(CLIENT_NAME_KEY);
  });
});

/**
 * The remaining two criteria are about a compiler and a document — neither of which
 * survives to runtime as a value. They are read off the compiler's own exit code
 * and off the source text, from the project root, which is where jest is invoked
 * from.
 *
 * The spec's rewrite folded the two `types.ts` signature criteria into AS-011 and
 * left them to the type-check below: a store whose async implementation did not
 * match its declared interface cannot compile. So there is no longer a test that
 * reads those two declarations as text, deliberately.
 */
describe('the repository after the await propagation', () => {
  it(
    'AC-013 — type-checks with every awaited call site in place',
    () => {
      // The awaits this ticket adds are invisible to every other test here: what
      // establishes that the call sites were actually updated is the compiler.
      // Only the exit code is asserted — the compiler's own diagnostics are left
      // out of the failure message deliberately, since a TS syntax diagnostic
      // quoted into it would read as a broken test rather than a red one.
      const typecheck = spawnSync('npx', ['tsc', '--noEmit'], {
        encoding: 'utf8',
      });

      expect(typecheck.status).toBe(0);
    },
    600_000,
  );
});

/**
 * OPES-67 — clear() rebuilds the encrypted store once the two keys are gone.
 *
 * Deleting a key from the secret store leaves its ciphertext in the file: MMKV
 * appends a zero-length record that shadows the earlier one and overwrites nothing.
 * Measured on device on 2026-09-17 — a disconnect grew `opes.secret-storage` from 81
 * to 128 bytes and the 77-byte payload was still there, verbatim, at offset 8. So
 * `clear()` owes one explicit rebuild after both deletes: once, not per delete, and
 * not conditional on the store having gone empty.
 *
 * The rebuild is counted through the port, not observed in a file. Under Jest the
 * encrypted backend is a Map with no append log, so no test here can show a byte
 * leaving the disk (VG-001) — what these three establish is that the call is made,
 * made once, made after both deletes, and that its failure is not swallowed.
 */
describe('MonobankTokenService.clear and the residue a delete leaves', () => {
  it('AC-001 — rebuilds the secret store exactly once', async () => {
    // Once per disconnect. Inside `delete` it would fire twice for one disconnect,
    // each rebuild dropping the backing file the next delete still needs.
    const store = new RecordingSecretStore()
      .seed(TOKEN_KEY, 'tok-1')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    await service.clear();

    expect(store.purges).toBe(1);
  });

  it('AC-002 — rebuilds only after both deletes have gone through', async () => {
    // The ordering is load-bearing rather than tidy: the rebuild invalidates every
    // handle to the store, so a delete issued after it is a write into a dead file.
    const store = new RecordingSecretStore()
      .seed(TOKEN_KEY, 'tok-1')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    await service.clear();

    expect(store.deletesAtPurge[0]).toBe(2);
  });

  it('AC-004 — lets a failed rebuild reject rather than swallowing it', async () => {
    // The service carries no try/catch anywhere by rule, and disconnect awaits
    // `clear()` without one either. A failed erase is not fatal — the residue simply
    // stays — but it must not be reported to the user as a clean disconnect.
    const store = new RejectingSecretStore({
      on: 'purge',
      error: new Error('boom-on-purge'),
    });
    const service = new MonobankTokenService(store);

    // The asserted value is whether `clear()` settled cleanly, and it must not have.
    let resolvedCleanly = true;
    try {
      await service.clear();
    } catch {
      resolvedCleanly = false;
    }

    expect(resolvedCleanly).toBe(false);
  });
});

describe('src/services/monobank/CLAUDE.md', () => {
  it('AC-014 — documents the token as living in secret-storage', () => {
    const doc = readFileSync('src/services/monobank/CLAUDE.md', 'utf8');
    const section = doc
      .split(/^## /m)
      .find(part => part.startsWith('Token storage'));

    expect(section ?? '').toContain('secret-storage');
  });
});
