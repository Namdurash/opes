/**
 * OPES-58 — the key bootstrap stops freezing its random source at module load.
 *
 * `cryptoKey.ts` reads `globalThis.crypto` once, at module scope. On Hermes that
 * global does not exist, so the binding is `undefined` forever and the very first
 * `save()` throws — which is how a green suite shipped a Monobank connect that
 * cannot work on device. The fix is a call-time lookup plus the
 * `react-native-get-random-values` polyfill imported first in `index.js`.
 *
 * Three things about the shape of this file are deliberate.
 *
 * 1. **The ordering is the test.** Under Jest, Node supplies `globalThis.crypto`
 *    on its own, so a test that calls `generateKey()` and watches it succeed
 *    passes identically before and after the fix and establishes nothing. Both
 *    crypto criteria therefore replace the global *after* the module under test
 *    has already been imported — the static import at the top of this file is
 *    what loads it, with Node's crypto in place. A source installed after load
 *    that is nonetheless the one drawn from is a fact only a call-time lookup can
 *    produce, and it is the fact these two criteria pin.
 *
 * 2. **The given is asserted, not assumed.** If the environment had no crypto
 *    global at load time, AC-011 would pass against today's code for entirely the
 *    wrong reason — the captured binding would already be `undefined`. So each
 *    crypto test states that precondition first.
 *
 * 3. **AC-012, AC-015 and AC-016 live here** rather than beside `index.js`,
 *    `package.json` or the layer document, none of which has a test sibling and
 *    none of which the test-convention guard would let one be created for. They
 *    belong to this file's subject: where the random bytes come from on device.
 *    They are read off the files as text, from the project root, which is where
 *    jest is invoked from.
 */
import { readFileSync } from 'node:fs';
import { generateKey } from './cryptoKey';

// Read AFTER the import above, so this is the state cryptoKey.ts saw at load.
const cryptoAtModuleLoad: unknown = Reflect.get(globalThis, 'crypto');
const CRYPTO_PRESENT_AT_MODULE_LOAD = cryptoAtModuleLoad !== undefined;

const installCryptoSource = (value: unknown): void => {
  Object.defineProperty(globalThis, 'crypto', {
    value,
    configurable: true,
    writable: true,
    enumerable: false,
  });
};

const removeCryptoSource = (): void => {
  Reflect.deleteProperty(globalThis, 'crypto');
};

/**
 * A random source that fills the array it is handed — so `generateKey` can finish
 * and base64-encode the result — and counts how often it was asked. The count is
 * the whole point: it is 0 against a module-scope capture and 1 against a
 * call-time lookup.
 */
const createCountingRandomSource = () => {
  const state = { calls: 0 };
  const getRandomValues = <T extends Uint8Array>(array: T): T => {
    state.calls += 1;
    array.fill(7);
    return array;
  };
  return { source: { getRandomValues }, state };
};

// Leave the environment exactly as it was found: other suites get their own
// global, but a leaked stub here would poison every later test in this file.
afterEach(() => {
  if (CRYPTO_PRESENT_AT_MODULE_LOAD) {
    installCryptoSource(cryptoAtModuleLoad);
  } else {
    removeCryptoSource();
  }
});

describe('cryptoKey.generateKey resolves its random source at call time', () => {
  it('AC-010 — draws from the source installed after the module was loaded', () => {
    // The `given`: the module was imported while a crypto global was present.
    expect(CRYPTO_PRESENT_AT_MODULE_LOAD).toBe(true);

    const { source, state } = createCountingRandomSource();
    installCryptoSource(source);

    generateKey();

    expect(state.calls).toBe(1);
  });

  it('AC-011 — throws when the source is gone by the time it is called', () => {
    // Same `given`: a source was there at import time. Removing it afterwards is
    // what a load-time capture cannot notice.
    expect(CRYPTO_PRESENT_AT_MODULE_LOAD).toBe(true);

    removeCryptoSource();

    // Fail closed (AS-015): no source means no key, never a Math.random draw.
    expect(() => generateKey()).toThrow('random source');
  });
});

/**
 * The polyfill only helps if it runs before anything can reach the secret store,
 * which on this app means before `react-native` and `./App`. Read as text: nothing
 * here executes `index.js` (VG-002).
 */
const firstImportSpecifier = (source: string): string | null => {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const importLine = withoutComments
    .split('\n')
    .map(line => line.trim())
    .find(line => /^import\b/.test(line));
  if (importLine === undefined) return null;
  return /['"]([^'"]+)['"]/.exec(importLine)?.[1] ?? null;
};

describe('index.js', () => {
  it('AC-012 — imports the random-values polyfill before anything else', () => {
    const specifier = firstImportSpecifier(readFileSync('index.js', 'utf8'));

    expect(specifier).toBe('react-native-get-random-values');
  });
});

describe('src/services/secret-storage/CLAUDE.md', () => {
  it('AC-015 — records where the random bytes come from on device', () => {
    const doc = readFileSync('src/services/secret-storage/CLAUDE.md', 'utf8');

    expect(doc).toContain('react-native-get-random-values');
  });
});

describe('package.json', () => {
  it('AC-016 — declares the polyfill as a runtime dependency', () => {
    // Runtime, not dev: it ships in the app bundle and carries a native module.
    // A criterion reading the file as text (AC-012) would have gone green with
    // the package missing entirely — that is exactly how this defect reached the
    // simulator. This one pins the declaration; that it is installed, linked and
    // podded is VG-003 and stays on the manual checklist.
    const manifest: unknown = JSON.parse(readFileSync('package.json', 'utf8'));
    const { dependencies } = manifest as {
      dependencies: Record<string, string>;
    };

    expect(Object.keys(dependencies)).toContain(
      'react-native-get-random-values',
    );
  });
});
