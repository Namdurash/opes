/**
 * OPES-67 — `EncryptedStoreInstance.getAllKeys()`.
 *
 * The rebuild that erases a deleted secret's bytes has to know what else is in the
 * store before it drops the file, and today the encrypted backend cannot be asked:
 * the interface has `getString`, `set` and `delete`, and nothing that enumerates. So
 * the member below is the first thing this ticket needs, and the snapshot in
 * `SecretStore.purgeDeletedRecords` is built on it.
 *
 * Two things about the shape of this file are deliberate.
 *
 * 1. The module is reached by `require` inside the test, not by a top-level `import`.
 *    `getAllKeys` is not on the exported `EncryptedStoreInstance` yet, so a typed
 *    import would put a compile error in the tree — and `tsc --noEmit` exiting 0 is
 *    itself asserted by this suite (MonobankTokenService.test.ts, AC-013), which
 *    would turn a green repository red for every other ticket. A `require` of a
 *    string literal is not resolved by the compiler, so the type-check stays green
 *    while the test below fails on the absent behaviour. It also mirrors the lazy
 *    require the module itself uses to reach `react-native-mmkv`.
 *
 * 2. `createEncryptedStore()` is called with no mock of `react-native-mmkv` in place,
 *    because under Jest it deliberately returns the in-memory `Map` backend and never
 *    touches the native module. That is also the limit of what this file can say —
 *    VG-001: a Map has no append-only log, so it has no residue and cannot be made to
 *    demonstrate one. What is established here is the enumeration the rebuild needs.
 *    That `mmkv.getAllKeys()` answers the same way on device is established by the
 *    byte comparison on a phone, and by nothing in this suite.
 */

describe('createEncryptedStore instances', () => {
  it('AC-009 — enumerates both keys held in the encrypted store', () => {
    const { createEncryptedStore } = require('./encryptedStore');
    const store = createEncryptedStore().open('some-base64-key');
    store.set('monobank_personal_token', 'tok-1');
    store.set('monobank_client_name', 'Ada Lovelace');

    // Asserted rather than assumed: with no such member the call below would throw
    // "getAllKeys is not a function" mid-test, and an absent member should read as a
    // failed assertion. The criterion's own value is asserted straight after.
    expect(typeof store.getAllKeys).toBe('function');

    expect(store.getAllKeys()).toHaveLength(2);
  });
});
