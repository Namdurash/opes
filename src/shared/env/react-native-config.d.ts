import 'react-native-config';

/**
 * Augments react-native-config so every variable declared in `.env` is typed
 * as `string` instead of the default `string | undefined`.
 *
 * Add a key here whenever you add one to `.env` / `.env.example`.
 */
declare module 'react-native-config' {
  export interface NativeConfig {
    CLAUDE_API_KEY: string;

    /**
     * Selects the sandbox build; the only meaningful value is `sandbox`.
     *
     * Deliberately optional, unlike every other key here: the normal build ships
     * without it, and that absence is what `isSandboxBuild()` reads as "not the
     * sandbox". Typing it as `string` would claim a value that is not there.
     */
    OPES_ENV?: string;
  }
}
