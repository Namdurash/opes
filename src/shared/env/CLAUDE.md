# Environment variables (`src/shared/env`)

Typed wrapper around [react-native-config](https://github.com/lugg/react-native-config). Variables live in the git-ignored `.env` at the repo root (`.env.example` documents the keys).

## Usage

Import variables by name — values are inlined at build time:

```ts
import { CLAUDE_API_KEY } from '../../shared/env';
```

Use `env` for dynamic/optional access when a key may be absent.

## Adding a variable

1. Add the key to `.env` and `.env.example` (root).
2. Add it to the `NativeConfig` interface in [react-native-config.d.ts](react-native-config.d.ts) so it types as `string`.
3. Re-export it from [env.ts](env.ts) for named imports.
4. **Rebuild** the native app — env values are not hot-reloaded. iOS regenerates config via the pod's `Config codegen` build phase; Android via `dotenv.gradle` (wired in `android/app/build.gradle`).

Never commit real secrets — only `.env.example` is tracked.
