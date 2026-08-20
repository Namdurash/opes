# Environment variables (`src/shared/env`)

Typed wrapper around [react-native-config](https://github.com/lugg/react-native-config).

**Which file is read depends on the build**, not on anything at runtime:

| Build | env file | Selected by |
|---|---|---|
| Normal | `.env` | Android `standard` flavor · iOS `Debug`/`Release` |
| Sandbox | `.env.sandbox` | Android `sandbox` flavor · iOS `Debug-Sandbox`/`Release-Sandbox` |

Both are git-ignored; `.env.example` is tracked and documents the keys of both.

## Usage

Import variables by name — values are inlined at build time:

```ts
import { CLAUDE_API_KEY } from '../../shared/env';
```

Use `env` for dynamic/optional access when a key may be absent.

`isSandboxBuild()` in [env.ts](env.ts) is the one reader of `OPES_ENV`, and the only
sanctioned way to ask which build this is. It returns true for exactly the string
`sandbox`; an absent key, an empty string, `Sandbox` or anything else all mean the
normal build.

## Adding a variable

1. Add the key to `.env`, to `.env.sandbox` if the sandbox build needs it, and to
   `.env.example` (root).
2. Add it to the `NativeConfig` interface in [react-native-config.d.ts](react-native-config.d.ts).
   Type it as `string` when every build ships it. Type it **optional** when a build may
   legitimately omit it — `OPES_ENV` is optional for exactly that reason, and claiming
   `string` there would assert a value that is not present in the normal build.
3. Re-export it from [env.ts](env.ts) for named imports.
4. **Rebuild the native app** — values are inlined at build time and Metro will not pick
   up a change. A `.env` edit without a rebuild silently keeps the old value.

Never commit real secrets — only `.env.example` is tracked. Note that the iOS codegen
writes the resolved values in plaintext to
`node_modules/react-native-config/ios/ReactNativeConfig/GeneratedDotEnv.m`; it is outside
git, but it is on disk.

## Two traps when the flag crosses into the runtime

Both of these shipped as bugs in OPES-59 and were invisible to the whole test suite: the
build produced the value correctly and the runtime never saw it, so `isSandboxBuild()`
returned false and the sandbox build opened the **real** database name. Read this before
adding a flavor, a build configuration, or an identifier suffix.

**iOS — the codegen runs on the pod target, not on the app target.** react-native-config
resolves the env file from `ENV['ENVFILE']` inside a `Config codegen` script phase that
belongs to the `react-native-config` **pod** target. An `ENVFILE` set on the app target's
build configuration never reaches it, and the codegen silently falls back to `.env`. The
mapping therefore lives in the Podfile's `post_install`, which sets `ENVFILE` per
configuration on that pod target — see [ios/Podfile](../../../ios/Podfile). Do not move it
onto the app target; it will look right and do nothing.

**Android — `applicationIdSuffix` moves the package away from `BuildConfig`.** The module
finds its values with `Class.forName(getPackageName() + ".BuildConfig")`, i.e. by the
**runtime** package, which is the applicationId. `BuildConfig` is generated into the
**namespace** (`com.opes`), and a suffix does not move it — so the sandbox build asked for
`com.opes.sandbox.BuildConfig`, the lookup threw, and every value came back empty. The
`build_config_package` string resource in
[android/app/src/main/res/values/strings.xml](../../../android/app/src/main/res/values/strings.xml)
pins the lookup to the namespace. Any new flavor that carries a suffix relies on it.

## Verifying that the flag arrived

Neither trap is reachable from jest: a test injects `Config` in memory, so it exercises
the logic *behind* the flag, never its delivery. The only instrument is to build, install
and look at a consequence from outside the process — **on each platform separately**, since
these two broke by different mechanisms and fixing one did nothing for the other.

The database file name is the cheapest such consequence: it is derived from the flag and
readable without a debugger.

```sh
xcrun simctl get_app_container booted org.reactjs.native.example.opes.sandbox data
adb shell run-as com.opes.sandbox find . -name '*opes*'
```

The sandbox build must show `opes_sandbox`. If it shows `opes`, the flag did not arrive —
whatever the build logs said.
