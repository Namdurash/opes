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
  }
}
