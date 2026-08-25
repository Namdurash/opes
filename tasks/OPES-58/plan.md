<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-58",
  "spec_sha256": "5ba2c7551b726ee16a2cce7ef010860e3fef4dcb185a2755f5a40c0f1d5e639f",
  "risk": "high",
  "files": {
    "create": [],
    "change": [
      "src/services/secret-storage/cryptoKey.ts",
      "src/services/secret-storage/CLAUDE.md",
      "index.js",
      "package.json",
      "yarn.lock",
      "src/services/monobank/MonobankTokenService.ts",
      "src/services/monobank/CLAUDE.md"
    ],
    "tests": [
      "src/services/secret-storage/cryptoKey.test.ts"
    ] },
  "decisions": [
    { "id": "D-001",
      "statement": "Delete the module-scope `const cryptoSource = (globalThis as { crypto?: CryptoLike }).crypto;` from cryptoKey.ts line 45.",
      "because": "that load-time capture is the defect — the binding is undefined forever on Hermes" },

    { "id": "D-002",
      "statement": "Read the global inline as generateKey's first statement: `const cryptoSource = (globalThis as { crypto?: CryptoLike }).crypto;`, then the existing guard and draw.",
      "because": "AS-014 — every call resolves the source afresh" },

    { "id": "D-003",
      "statement": "Add no module-level cache, no memoized resolver and no lazily-initialised binding for the crypto source.",
      "because": "any cache reinstates exactly the load-time capture AC-010 exists to forbid",
      "rejected": "Do not extract a `getCryptoSource()` helper that stores its result." },

    { "id": "D-004",
      "statement": "Keep generateKey exported as `(): GeneratedKey` returning `{ raw, base64 }`, and keep the GeneratedKey interface unchanged.",
      "because": "AS-014 — SecretStore's `GenerateKey` DI seam and its default binding must not move",
      "rejected": "Do not add a parameter or an injectable random source to generateKey." },

    { "id": "D-005",
      "statement": "Keep the thrown message byte for byte: 'No cryptographically secure random source is available.'",
      "because": "AS-015 keeps the text unchanged and AC-011 reads it for the substring `random source`" },

    { "id": "D-006",
      "statement": "Leave KEY_BYTE_LENGTH, BASE64_ALPHABET, the CryptoLike interface, toBase64 and its eslint no-bitwise pragmas exactly as they are.",
      "because": "the only change in this file is where the random source is resolved" },

    { "id": "D-007",
      "statement": "Edit no other file in src/services/secret-storage/ — SecretStore.ts, keychainKeyStore.ts, encryptedStore.ts and index.ts are untouched.",
      "because": "a declared non-goal: only the random-source resolution is in scope",
      "rejected": "Do not add key rotation, and do not make the barrel's `secretStore` singleton lazy." },

    { "id": "D-008",
      "statement": "Make `import 'react-native-get-random-values';` the first statement of index.js, above the react-native, ./App and ./app.json imports, which keep their present order.",
      "because": "AS-013 / AC-012" },

    { "id": "D-009",
      "statement": "Put the rationale in index.js's existing top docblock and write the string react-native-get-random-values in quotes nowhere in index.js except that one import statement.",
      "because": "AC-012 reads the file as text and a second quoted occurrence could be matched first" },

    { "id": "D-010",
      "statement": "Install the dependency with `yarn add react-native-get-random-values` from the project root and let yarn resolve the version.",
      "because": "the build runs through yarn — `lint` in .aif/project.json is `yarn lint`",
      "rejected": "Do not hand-write a version range into package.json instead of installing." },

    { "id": "D-011",
      "statement": "Commit the resulting yarn.lock; run no `npm install` and leave package-lock.json byte-identical.",
      "because": "both lockfiles are tracked, which is a pre-existing inconsistency this ticket does not resolve",
      "rejected": "Do not regenerate or delete package-lock.json." },

    { "id": "D-012",
      "statement": "Land the package in the `dependencies` map, not `devDependencies`.",
      "because": "AC-016 — it is a runtime polyfill with a native module, shipped in the app bundle" },

    { "id": "D-013",
      "statement": "Do not run `pod install`, `bundle exec pod install` or any Gemfile command, and do not modify ios/Podfile.lock, ios/Podfile or ios/Pods.",
      "because": "AS-012's pod reinstall belongs to the maintainer's manual device verification (VG-001, VG-003); no criterion covers it and a regenerated lock would blow the scope and diff gates",
      "rejected": "Do not add the pod to the Podfile by hand — autolinking picks it up at the maintainer's next install." },

    { "id": "D-014",
      "statement": "In src/services/secret-storage/CLAUDE.md's `Key generation` bullet, say the 32 bytes come from `globalThis.crypto.getRandomValues`, resolved on every call.",
      "because": "AC-015" },

    { "id": "D-015",
      "statement": "Say in that bullet that on device the global comes from react-native-get-random-values.",
      "because": "Hermes on RN 0.84 ships no crypto global of its own, and AC-015 reads the file for that literal package name" },

    { "id": "D-016",
      "statement": "Say in that bullet that the polyfill must be index.js's first import so the global exists before any secret-store call.",
      "because": "the key bootstrap can run from the very first save()" },

    { "id": "D-017",
      "statement": "Say in that bullet that under Jest the source is Node's own globalThis.crypto, so a green suite establishes nothing about a device.",
      "because": "VG-001 — this is the circumstance in which the crypto criteria pass vacuously" },

    { "id": "D-018",
      "statement": "Keep the fail-closed sentence in that document: with no source at call time generateKey throws and never falls back to Math.random.",
      "because": "AS-015" },

    { "id": "D-019",
      "statement": "Leave src/services/monobank/MonobankTokenService.ts and src/services/monobank/CLAUDE.md exactly as the previous round committed them.",
      "because": "they already satisfy AC-001 through AC-009 and AC-014; they are in the manifest to carry that coverage, not to be edited",
      "rejected": "Do not re-derive the SecretStorePort seam, the lazy require or the Token storage section." },

    { "id": "D-020",
      "statement": "Add no polyfill entry to test/setup.js and mock react-native-get-random-values nowhere.",
      "because": "AS-016 — under Jest the source stays Node's own globalThis.crypto",
      "rejected": "Do not import the polyfill from any test or from any file under src/." },

    { "id": "D-021",
      "statement": "Touch no call site of save/get/clear, no file under src/features/, and no plaintext-token migration.",
      "because": "the await propagation landed in the previous round and the migration is OPES-63" },

    { "id": "D-022",
      "statement": "Keep src/services/monobank/MonobankTokenService.test.ts out of files.tests and out of this round's red oracle.",
      "because": "it covers behaviour round one already implemented, so it cannot honestly go red — a limit of verify-red, which cannot tell a test written this round from an inherited one" },

    { "id": "D-023",
      "statement": "Keep that suite running as part of the ordinary jest run, since the green gate still requires the whole suite to pass.",
      "because": "excluding it from the red oracle costs nothing in regression cover" },

    { "id": "D-024",
      "statement": "Leave the criterion-id renumbering the tests station already applied to MonobankTokenService.test.ts exactly as it stands.",
      "because": "the spec renumbered its criteria and those markers are now correct",
      "rejected": "Do not revert the markers and do not restore the four criteria the spec cut." } ],
  "ac_coverage": {
    "AC-001": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-002": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-003": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-004": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-005": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-006": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-007": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-008": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-009": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-010": ["src/services/secret-storage/cryptoKey.ts"],
    "AC-011": ["src/services/secret-storage/cryptoKey.ts"],
    "AC-012": ["index.js"],
    "AC-013": ["src/services/secret-storage/cryptoKey.ts", "src/services/monobank/MonobankTokenService.ts"],
    "AC-014": ["src/services/monobank/CLAUDE.md"],
    "AC-015": ["src/services/secret-storage/CLAUDE.md"],
    "AC-016": ["package.json", "yarn.lock"] },
  "uncovered": [],
  "surface_map": {
    "MonobankTokenService.save": ["src/services/monobank/MonobankTokenService.ts"],
    "MonobankTokenService.get": ["src/services/monobank/MonobankTokenService.ts"],
    "MonobankTokenService.clear": ["src/services/monobank/MonobankTokenService.ts"],
    "src/services/secret-storage/cryptoKey.ts": ["src/services/secret-storage/cryptoKey.ts"],
    "index.js": ["index.js"],
    "package.json": ["package.json", "yarn.lock"],
    "src/services/monobank/CLAUDE.md": ["src/services/monobank/CLAUDE.md"],
    "src/services/secret-storage/CLAUDE.md": ["src/services/secret-storage/CLAUDE.md"],
    "npx tsc --noEmit": ["src/services/secret-storage/cryptoKey.ts", "src/services/monobank/MonobankTokenService.ts"] },
  "external": [
    { "name": "globalThis.crypto.getRandomValues — the Web Crypto global cryptoKey.ts draws its 32 raw bytes from, now resolved inside generateKey on every call",
      "ac": "AC-010" },
    { "name": "react-native-get-random-values — bare side-effect import in index.js; installs global.crypto.getRandomValues on Hermes and carries a native module that iOS links through pods" },
    { "name": "react-native — AppRegistry.registerComponent in index.js, whose import moves down one line and is never executed by this suite" } ] }
-->

# OPES-58 — plan

Round one is committed: `MonobankTokenService` already persists through the encrypted
`SecretStore`, the call sites already `await`, and both layer documents are already updated.
This round fixes the defect device verification exposed underneath it. Three edits and an
install:

1. `cryptoKey.ts` stops capturing `globalThis.crypto` at module load and reads it inside
   `generateKey` instead.
2. `index.js` imports `react-native-get-random-values` first, so that global exists on Hermes
   by the time anything can call `generateKey`.
3. `react-native-get-random-values` lands in `dependencies`.
4. `src/services/secret-storage/CLAUDE.md` records where the randomness comes from.

## cryptoKey.ts

Line 45 today is `const cryptoSource = (globalThis as { crypto?: CryptoLike }).crypto;` at module
scope. Delete it and make the identical expression the first statement inside `generateKey`;
the existing guard (`if (!cryptoSource?.getRandomValues) throw …`) and the existing draw follow
unchanged. Nothing else in the file moves — same message text, same 32-byte length, same
hand-rolled base64 encoder, same exported `(): GeneratedKey` signature. That last point is the
constraint that matters: `SecretStore` takes `generateKey` as a constructor dependency typed
`GenerateKey = () => GeneratedKey`, and `SecretStore.test.ts` injects a fake through it. Widening
the signature would break the seam this ticket is explicitly told not to touch.

**Do not reintroduce the capture in a nicer shape.** A `let cached` or a resolver that stores its
first answer is the same bug with a better haircut, and AC-010 — which installs a counting stub
*after* the module is loaded and demands one call on it — is written precisely to catch it.

## index.js

The polyfill's whole job is to run before anything else, so it goes above `react-native`. AC-012
reads the file as text and takes the specifier of the first import statement, so the docblock may
explain the ordering but must not put the package name in quotes; the only quoted occurrence in
the file is the import itself.

## The dependency, the lockfile and the pods

The package manager here is **yarn**, not npm, even though both `yarn.lock` and
`package-lock.json` are tracked — the configured check is `yarn lint`. Run
`yarn add react-native-get-random-values`, which writes both `package.json` (into `dependencies`,
where AC-016 looks) and `yarn.lock`. Both are in the manifest. `package-lock.json` is not, and must
come out of this byte-identical; resolving that duplication is somebody else's ticket.

**iOS pods are deliberately out of the diff.** AS-012 has the pods reinstalled as part of this
change, and they do have to be — the polyfill has a native module. But no criterion covers it,
VG-003 already declares the install unestablished, and a regenerated `ios/Podfile.lock` is both
outside the manifest and liable to drag unrelated checksum churn past the diff limit. So the
implementer runs no pod command at all; the reinstall is part of the maintainer's device
verification, alongside the simulator check VG-001 already schedules.

## What is already done, and stays done

`src/services/monobank/MonobankTokenService.ts` and `src/services/monobank/CLAUDE.md` appear in
`change` only because AC-001 through AC-009 and AC-014 are theirs and every criterion must point at
a file. Both already satisfy their criteria. Do not edit them — in particular do not touch the lazy
`require` of the secret-storage barrel, which is load-bearing: that barrel constructs
`new SecretStore()` at module load and that construction throws under Jest on purpose.

`MonobankTokenService.test.ts` is deliberately **not** in `files.tests`. The spec renumbered its
criteria, so the tests station has already repointed its markers and dropped the four cases the
rewrite cut — the "returns a Promise" case, the plain empty-store null case, and the two `types.ts`
signature cases. Leave that renumbering alone. The file stays out of this round's red oracle for a
structural reason rather than a defect in it: the eleven criteria it carries were implemented in
round one, so they pass already and cannot honestly go red, and `verify-red` cannot tell a test
written this round from an inherited one. It still runs in the ordinary jest invocation, and the
green gate still demands the whole suite pass, so nothing about regression cover changes.

`AC-013` is a whole-repository `tsc --noEmit`, and it is mapped to the two type-checked files this
round can break. The `await` propagation in its `given` is already in the tree from round one, and
`index.js` is outside `tsconfig`'s `include` altogether — nothing type-checks it.

## What none of this establishes

Under Jest, Node supplies `globalThis.crypto` on its own, so the suite cannot tell you the polyfill
works — only that the module no longer freezes its source at load time. That the package installs,
links natively and actually supplies `getRandomValues` on device is VG-001, VG-002 and VG-003, and
lands on the manual checklist. AC-016 pins a line in `package.json`; it does not pin a working app.
