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
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { MonobankTokenService } from './MonobankTokenService';
import type { SecretStorePort } from './MonobankTokenService';

// AS-002 — the two storage keys are the storage contract and do not move.
const TOKEN_KEY = 'monobank_personal_token';
const CLIENT_NAME_KEY = 'monobank_client_name';

// AC-007's `given`: the pre-OPES-58 plaintext copy is still sitting in MMKV under
// the very same key. Nothing in the service is supposed to reach it — this mock is
// the trap. Were a fallback read ever added, `createMMKV` would answer with
// 'legacy-tok' and AC-007 would go red, which is the entire point of holding it.
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
  constructor(private readonly failure: { on: 'get' | 'set'; error: Error }) {}

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

  private rejection<T>(): Promise<T> {
    const rejected = Promise.reject<T>(this.failure.error);
    rejected.catch(() => {});
    return rejected;
  }
}

beforeEach(() => {
  mockLegacyPlaintext = new Map([[TOKEN_KEY, 'legacy-tok']]);
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

  it('AC-003 — hands the caller a promise instead of completing synchronously', async () => {
    const store = new RecordingSecretStore();
    const service = new MonobankTokenService(store);

    const saving = service.save('tok-1', 'Ada Lovelace');

    // This is the whole reason every call site in this ticket grows an `await`:
    // without a promise to hold, a caller cannot know the secret store finished.
    expect(saving instanceof Promise).toBe(true);
    await saving;
  });

  it('AC-010 — lets a rejected write reach the caller unchanged', async () => {
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
  it('AC-004 — resolves the token held in the secret store', async () => {
    const store = new RecordingSecretStore()
      .seed(TOKEN_KEY, 'tok-1')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    const credentials = await service.get();

    expect(credentials?.token).toBe('tok-1');
  });

  it('AC-005 — resolves the client name held in the secret store', async () => {
    const store = new RecordingSecretStore()
      .seed(TOKEN_KEY, 'tok-1')
      .seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    const credentials = await service.get();

    expect(credentials?.clientName).toBe('Ada Lovelace');
  });

  it('AC-006 — resolves null when the secret store holds neither key', async () => {
    const store = new RecordingSecretStore();
    const service = new MonobankTokenService(store);

    expect(await service.get()).toBeNull();
  });

  it('AC-007 — resolves null rather than falling back to the plaintext copy', async () => {
    // The secret store is empty; the plaintext MMKV instance is not. AS-005 says
    // there is no fallback branch left to take, so the legacy value must stay
    // invisible — an already-connected user reads as disconnected until OPES-63.
    const store = new RecordingSecretStore();
    const service = new MonobankTokenService(store);

    // Stated rather than assumed: a fallback read would have something to find.
    expect(mockLegacyPlaintext.get(TOKEN_KEY)).toBe('legacy-tok');

    expect(await service.get()).toBeNull();
  });

  it('AC-011 — lets a rejected read reach the caller unchanged', async () => {
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
  it('AC-008 — deletes monobank_personal_token', async () => {
    const store = new RecordingSecretStore().seed(TOKEN_KEY, 'tok-1');
    const service = new MonobankTokenService(store);

    await service.clear();

    expect(store.deleted).toContain(TOKEN_KEY);
  });

  it('AC-009 — deletes monobank_client_name', async () => {
    const store = new RecordingSecretStore().seed(CLIENT_NAME_KEY, 'Ada Lovelace');
    const service = new MonobankTokenService(store);

    await service.clear();

    expect(store.deleted).toContain(CLIENT_NAME_KEY);
  });
});

/**
 * The remaining criteria are about declarations, a compiler and a document — none of
 * which survives to runtime as a value. They are read off the source text and off
 * the compiler's own exit code, from the project root, which is where jest is
 * invoked from.
 */
const declaredReturnType = (member: string): string | null => {
  const source = readFileSync('src/features/monobank/types.ts', 'utf8');
  const declaration = new RegExp(
    `^\\s*${member}\\(\\s*\\):\\s*(.+?);\\s*$`,
    'm',
  ).exec(source);
  return declaration === null ? null : declaration[1];
};

describe('MonobankStoreActions', () => {
  it('AC-012 — declares loadSavedToken as returning Promise<string | null>', () => {
    expect(declaredReturnType('loadSavedToken')).toBe('Promise<string | null>');
  });

  it('AC-013 — declares disconnect as returning Promise<void>', () => {
    expect(declaredReturnType('disconnect')).toBe('Promise<void>');
  });
});

describe('the repository after the await propagation', () => {
  it(
    'AC-014 — type-checks with every awaited call site in place',
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

describe('src/services/monobank/CLAUDE.md', () => {
  it('AC-015 — documents the token as living in secret-storage', () => {
    const doc = readFileSync('src/services/monobank/CLAUDE.md', 'utf8');
    const section = doc
      .split(/^## /m)
      .find(part => part.startsWith('Token storage'));

    expect(section ?? '').toContain('secret-storage');
  });
});
