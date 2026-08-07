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
    const setGenericPassword = jest.fn(async () => true);
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
