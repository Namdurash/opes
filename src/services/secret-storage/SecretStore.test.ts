/**
 * OPES-42 — Encrypted secret-storage module.
 *
 * These tests are the executable oracle for the `secret-storage` primitive. They
 * are written before the implementation and must fail red against its absence.
 *
 * The modules under test do not exist yet, so they are pulled in with `require`
 * INSIDE each test (never a top-level `import`). That keeps this suite
 * collectible: every test runs and fails on its own — on a missing-module error
 * now, on an assertion once a stub exists — rather than the whole suite failing
 * to load. It also mirrors the lazy-require shape the module itself uses.
 *
 * Assumed contract (the shape the build station must satisfy to make these pass):
 *
 *   new SecretStore({ keychain, encrypted, generateKey })   // constructor-DI, D-010
 *     .get(key)    : Promise<string | null>
 *     .set(key, v) : Promise<void>
 *     .delete(key) : Promise<void>
 *
 *   keychain (port)      : { readKey(): Promise<string | null>,
 *                            writeKey(base64: string): Promise<void> }
 *   encrypted (backend)  : { open(base64: string): {
 *                              getString(k): string | undefined,
 *                              set(k, v): void,
 *                              delete(k): void },
 *                            wipe(): void }
 *   generateKey          : () => { raw: Uint8Array, base64: string }
 *
 *   keychainKeyStore.ts  : createKeychainKeyStore(keychainApi) => { readKey, writeKey }
 *   cryptoKey.ts         : generateKey() => { raw: Uint8Array, base64: string }
 *
 * The fakes below follow the constructor-DI injection style of
 * src/services/monobank/MonobankAccountSelectionService.test.ts.
 */

const makeKeychain = ({ read, write }: { read?: () => Promise<string | null>; write?: (base64: string) => Promise<void> } = {}) => ({
  readKey: read ? jest.fn(read) : jest.fn(async () => null),
  writeKey: write ? jest.fn(write) : jest.fn(async () => undefined),
});

const makeEncrypted = (initial: Record<string, string> = {}) => {
  const data = new Map<string, string>(Object.entries(initial));
  const instance = {
    getString: jest.fn((key: string) => data.get(key)),
    set: jest.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    delete: jest.fn((key: string) => {
      data.delete(key);
    }),
  };
  return {
    open: jest.fn(() => instance),
    wipe: jest.fn(() => {
      data.clear();
    }),
    instance,
    data,
  };
};

const makeGenerateKey = (base64 = 'generated-key-base64') =>
  jest.fn(() => ({ raw: new Uint8Array(32), base64 }));

const makeStore = (
  overrides: {
    keychain?: ReturnType<typeof makeKeychain>;
    encrypted?: ReturnType<typeof makeEncrypted>;
    generateKey?: ReturnType<typeof makeGenerateKey>;
  } = {},
) => {
  const { SecretStore } = require('./SecretStore');
  const keychain = overrides.keychain ?? makeKeychain();
  const encrypted = overrides.encrypted ?? makeEncrypted();
  const generateKey = overrides.generateKey ?? makeGenerateKey();
  const store = new SecretStore({ keychain, encrypted, generateKey });
  return { store, keychain, encrypted, generateKey };
};

describe('SecretStore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves null when nothing is stored under the key', async () => {
    // AC-001 — get on a bootstrapped store with no value under 'k' yields null.
    const { store } = makeStore();
    expect(await store.get('k')).toBeNull();
  });

  it('round-trips a value through set then get', async () => {
    // AC-002 — after set('token', 'abc'), get('token') resolves 'abc'.
    const { store } = makeStore();
    await store.set('token', 'abc');
    expect(await store.get('token')).toBe('abc');
  });

  it('removes a stored value on delete', async () => {
    // AC-003 — after set then delete, get('token') resolves null.
    const { store } = makeStore();
    await store.set('token', 'abc');
    await store.delete('token');
    expect(await store.get('token')).toBeNull();
  });

  it('is a silent no-op deleting an absent key', async () => {
    // AC-004 — delete('missing') resolves undefined.
    const { store } = makeStore();
    expect(await store.delete('missing')).toBeUndefined();
  });

  it('rejects get when the Keychain read fails transiently', async () => {
    // AC-005 — a transient Keychain read rejection makes get reject (fail closed).
    const keychain = makeKeychain({
      read: async () => {
        throw new Error('transient keychain failure');
      },
    });
    const encrypted = makeEncrypted({ token: 'abc' });
    const { store } = makeStore({ keychain, encrypted });
    await expect(store.get('token')).rejects.toThrow();
  });

  it('generates the encryption key exactly once for concurrent first callers', async () => {
    // AC-006 — two concurrent first get() calls share one bootstrap => one key gen.
    const keychain = makeKeychain({ read: async () => null });
    const generateKey = makeGenerateKey();
    const { store } = makeStore({ keychain, generateKey });
    await Promise.all([store.get('k'), store.get('k')]);
    expect(generateKey).toHaveBeenCalledTimes(1);
  });

  it('retries bootstrap and resolves after a transient failure recovers', async () => {
    // AC-010 — first bootstrap read rejects; the next read returns an entry and
    // the recovered get('k') resolves null (retry, not permanent disable).
    let call = 0;
    const keychain = makeKeychain({
      read: async () => {
        call += 1;
        if (call === 1) {
          throw new Error('transient bootstrap failure');
        }
        return 'existing-key-base64';
      },
    });
    const { store } = makeStore({ keychain });
    await expect(store.get('k')).rejects.toThrow();
    expect(await store.get('k')).toBeNull();
  });

  it('rejects set when the encryption-key write fails', async () => {
    // AC-011 — a failed Keychain key write makes set reject (fail closed).
    const keychain = makeKeychain({
      read: async () => null,
      write: async () => {
        throw new Error('key write failed');
      },
    });
    const { store } = makeStore({ keychain });
    await expect(store.set('token', 'abc')).rejects.toThrow();
  });

  it('never writes plaintext when the encryption-key write fails', async () => {
    // AC-012 — on a failed key write, zero writes reach the storage backend.
    // SecretStore has no separate plaintext store; verifying zero writes to its
    // sole (encrypted) backend proves it never degrades to a keyless/plaintext write.
    const keychain = makeKeychain({
      read: async () => null,
      write: async () => {
        throw new Error('key write failed');
      },
    });
    const encrypted = makeEncrypted();
    const { store } = makeStore({ keychain, encrypted });
    await expect(store.set('token', 'abc')).rejects.toThrow();
    const plaintextWriteCount = encrypted.instance.set.mock.calls.length;
    expect(plaintextWriteCount).toBe(0);
  });

  it('regenerates the key and wipes stale ciphertext on a genuinely absent entry', async () => {
    // AC-013 — Keychain read resolves null (genuine absence) with stale ciphertext
    // left under a prior key; bootstrap regenerates + wipes, so get resolves null.
    const keychain = makeKeychain({ read: async () => null });
    const generateKey = makeGenerateKey('new-key-base64');
    const encrypted = makeEncrypted({ token: 'stale-ciphertext' });
    const { store } = makeStore({ keychain, encrypted, generateKey });
    expect(await store.get('token')).toBeNull();
    expect(encrypted.wipe).toHaveBeenCalled();
  });

  it('preserves the stored value across a transient Keychain read failure', async () => {
    // AC-014 — a transient read rejection then the same entry returning must not
    // wipe; the recovered get('token') still resolves 'abc'.
    let call = 0;
    const keychain = makeKeychain({
      read: async () => {
        call += 1;
        if (call === 1) {
          throw new Error('transient keychain failure');
        }
        return 'existing-key-base64';
      },
    });
    const encrypted = makeEncrypted({ token: 'abc' });
    const { store } = makeStore({ keychain, encrypted });
    await expect(store.get('token')).rejects.toThrow();
    expect(await store.get('token')).toBe('abc');
    expect(encrypted.wipe).not.toHaveBeenCalled();
  });
});

describe('cryptoKey.generateKey', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('produces a 32-byte raw key before base64 encoding', () => {
    // AC-007 — the raw generated key measures 32 bytes (before base64 encoding).
    const { generateKey } = require('./cryptoKey');
    const { raw } = generateKey();
    expect(raw).toHaveLength(32);
  });

  it('never draws key material from Math.random', () => {
    // AC-008 — key generation uses a crypto-secure source, never Math.random.
    const randomSpy = jest.spyOn(Math, 'random');
    const { generateKey } = require('./cryptoKey');
    generateKey();
    expect(randomSpy).toHaveBeenCalledTimes(0);
  });
});

describe('keychainKeyStore.writeKey', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes the key device-only, not synchronizable to iCloud', async () => {
    // AC-009 — setGenericPassword receives accessible WHEN_UNLOCKED_THIS_DEVICE_ONLY.
    const { createKeychainKeyStore } = require('./keychainKeyStore');
    const setGenericPassword = jest.fn(
      async (_service: string, _account: string, _options: { accessible: string }) => true,
    );
    const keychainApi = {
      getGenericPassword: jest.fn(async () => false),
      setGenericPassword,
      ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
    };
    const keyStore = createKeychainKeyStore(keychainApi);
    await keyStore.writeKey('some-base64-key');
    const options = setGenericPassword.mock.calls[0][2];
    expect(options.accessible).toBe('AccessibleWhenUnlockedThisDeviceOnly');
  });
});

describe('package.json', () => {
  it('declares react-native-keychain as a dependency', () => {
    // AC-015 — dependencies map contains react-native-keychain.
    const pkg = require('../../../package.json');
    expect(Object.keys(pkg.dependencies)).toContain('react-native-keychain');
  });
});

/**
 * OPES-67 — `SecretStore.purgeDeletedRecords()`: the rebuild that makes a deleted
 * secret's bytes gone from the file rather than merely shadowed by a tombstone.
 *
 * Three things about the shape of the section below are deliberate.
 *
 * 1. `makeEncrypted` above is not reused. Its `open` hands back the same instance
 *    forever and its `wipe` only empties a Map, so an implementation that kept the
 *    handle it opened before the wipe would pass every test written against it —
 *    and that handle is exactly the trap the ticket names. `makeRebuildableEncrypted`
 *    models what MMKV actually does: `wipe()` drops the backing file, every handle
 *    taken before it goes stale, and a write through a stale handle is SILENTLY
 *    DROPPED rather than rejected. So a store that restores the survivors through
 *    the pre-wipe instance loses them here, which is the point.
 *
 * 2. Each test asserts that the method it exercises is a function before calling it.
 *    That is the criterion's own surface — `purgeDeletedRecords` does not exist yet —
 *    and asserting it keeps the red an assertion failure instead of a TypeError
 *    thrown mid-test. It is not a precondition borrowed from elsewhere, and nothing
 *    below is weakened by it: the criterion's own expected value is asserted straight
 *    after, and stays falsifiable once the method lands.
 *
 * 3. AC-003 and AC-005 reach `MonobankTokenService.clear()`, because that is the
 *    caller the criteria name, but what they exercise is this store's rebuild — a
 *    survivor sitting beside the two Monobank keys must still be readable after it.
 *    Both `require` the service rather than importing it: that module's only import
 *    is an `import type` of the secret-storage barrel, which erases, so requiring it
 *    never evaluates the barrel's `new SecretStore()` (which throws under Jest).
 *
 * What none of this establishes — VG-001 — is that any byte left the disk. Under
 * Jest the encrypted backend is a Map with no append log, so there is no residue in
 * it to erase by construction. These tests prove the rebuild is invoked, invoked
 * once, invoked in the right order, and survived by the neighbouring secrets. That
 * the file on an iPhone actually shrinks back is settled by a byte comparison on a
 * device, and by nothing here.
 */

/** AS — the two Monobank keys, by the literal names that are the storage contract. */
const MONOBANK_TOKEN_KEY = 'monobank_personal_token';
const MONOBANK_CLIENT_NAME_KEY = 'monobank_client_name';
/** A secret belonging to nobody in this ticket. It must survive the rebuild. */
const THIRD_PARTY_KEY = 'third_party_secret';

const makeRebuildableEncrypted = (initial: Record<string, string> = {}) => {
  const data = new Map<string, string>(Object.entries(initial));
  // Which generation of the backing file is live. `wipe()` deletes the file, so every
  // instance opened before it is dead from that moment: reads answer `undefined` and
  // writes go nowhere, without raising anything.
  let generation = 0;
  const unreadable = new Set<string>();

  const openInstance = () => {
    const mine = generation;
    const live = () => mine === generation;
    return {
      getString: jest.fn((key: string) =>
        live() && !unreadable.has(key) ? data.get(key) : undefined,
      ),
      set: jest.fn((key: string, value: string) => {
        if (live()) data.set(key, value);
      }),
      delete: jest.fn((key: string) => {
        if (live()) data.delete(key);
      }),
      getAllKeys: jest.fn(() => (live() ? [...data.keys()] : [])),
    };
  };

  return {
    open: jest.fn(() => openInstance()),
    wipe: jest.fn(() => {
      data.clear();
      generation += 1;
    }),
    /** AC-006's `given` — a key the enumeration lists but whose value won't read. */
    hide: (key: string): void => {
      unreadable.add(key);
    },
  };
};

/**
 * A store over the rebuildable backend, opened with an existing Keychain key so that
 * bootstrap itself never wipes (the genuine-absence branch does, and a wipe from
 * there would be indistinguishable from the purge's).
 */
const makeRebuildStore = (encrypted: ReturnType<typeof makeRebuildableEncrypted>) => {
  const { SecretStore } = require('./SecretStore');
  const keychain = makeKeychain({ read: async () => 'existing-key-base64' });
  const store = new SecretStore({
    keychain,
    encrypted,
    generateKey: makeGenerateKey('never-used-key-base64'),
  });
  return { store, keychain, encrypted };
};

/** See note 3 — required, never imported. */
const makeTokenService = (storage: unknown) => {
  const { MonobankTokenService } = require('../monobank/MonobankTokenService');
  return new MonobankTokenService(storage);
};

describe('SecretStore.purgeDeletedRecords', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-006 — wipes nothing when a surviving value cannot be read for the snapshot', async () => {
    // Fail closed, exactly as OPES-63 does one layer down: a value the rebuild could
    // not write back is a value the rebuild would destroy, so the residue stays and
    // the file is left alone. The enumeration still lists the key — it is the value
    // that will not come back, which is the case a device can actually produce.
    const encrypted = makeRebuildableEncrypted({
      [THIRD_PARTY_KEY]: 'survivor',
      unreadable_secret: 'unreadable',
    });
    encrypted.hide('unreadable_secret');
    const { store } = makeRebuildStore(encrypted);

    expect(typeof store.purgeDeletedRecords).toBe('function');
    await store.purgeDeletedRecords();

    expect(encrypted.wipe).toHaveBeenCalledTimes(0);
  });

  it('AC-007 — is not reached by delete on an absent key', async () => {
    // A rebuild inside `delete` would run twice per disconnect, which is the option
    // the ticket rules out. `delete` stays a bare delete — on an absent key and on a
    // present one alike.
    const encrypted = makeRebuildableEncrypted();
    const { store } = makeRebuildStore(encrypted);

    expect(typeof store.purgeDeletedRecords).toBe('function');
    const purge = jest.spyOn(store, 'purgeDeletedRecords');

    await store.delete('missing');

    expect(purge).toHaveBeenCalledTimes(0);
  });

  it('AC-008 — reads back a value written after the rebuild', async () => {
    // The trap from the ticket: `readiness` memoizes the instance the wipe just
    // killed. Write through that one and MMKV drops it on the floor — no throw, no
    // rejection, just a value that is not there afterwards. So the read-back is the
    // only thing that catches it.
    const encrypted = makeRebuildableEncrypted({ [THIRD_PARTY_KEY]: 'survivor' });
    const { store } = makeRebuildStore(encrypted);

    expect(typeof store.purgeDeletedRecords).toBe('function');
    await store.purgeDeletedRecords();
    await store.set('written_after', 'after-purge');

    expect(await store.get('written_after')).toBe('after-purge');
  });
});

describe('SecretStore rebuilt by MonobankTokenService.clear', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-003 — keeps a third-party secret readable across a purging clear()', async () => {
    // "Erase the whole store on any delete" is not an acceptable fix: the neighbour
    // is somebody else's secret and has to come out the other side intact.
    const encrypted = makeRebuildableEncrypted({
      [MONOBANK_TOKEN_KEY]: 'tok-1',
      [MONOBANK_CLIENT_NAME_KEY]: 'Ada Lovelace',
      [THIRD_PARTY_KEY]: 'survivor',
    });
    const { store } = makeRebuildStore(encrypted);
    const service = makeTokenService(store);

    await service.clear();

    // The criterion's `when`, stated rather than assumed: clear() must actually have
    // rebuilt the store. Without the rebuild the survivor was never in any danger and
    // the assertion below would describe nothing this ticket changed.
    expect(encrypted.wipe).toHaveBeenCalledTimes(1);
    expect(await store.get(THIRD_PARTY_KEY)).toBe('survivor');
  });

  it('AC-005 — keeps a third-party secret readable when the rebuild throws', async () => {
    // A failed erase is not fatal and not silent: the rejection reaches the caller,
    // the residue stays, and the neighbouring secret is still there to be read. The
    // one unacceptable outcome is a survivor that exists in no copy anywhere.
    const encrypted = makeRebuildableEncrypted({
      [MONOBANK_TOKEN_KEY]: 'tok-1',
      [MONOBANK_CLIENT_NAME_KEY]: 'Ada Lovelace',
      [THIRD_PARTY_KEY]: 'survivor',
    });
    encrypted.wipe.mockImplementation(() => {
      throw new Error('the backing file could not be deleted');
    });
    const { store } = makeRebuildStore(encrypted);
    const service = makeTokenService(store);

    // The criterion's `given` — the purge really did throw inside clear(). Asserted
    // for the same reason as in AC-003: it is what makes the survivor's readability
    // a statement about the rebuild rather than about an untouched store.
    let resolvedCleanly = true;
    try {
      await service.clear();
    } catch {
      resolvedCleanly = false;
    }
    expect(resolvedCleanly).toBe(false);

    expect(await store.get(THIRD_PARTY_KEY)).toBe('survivor');
  });
});
