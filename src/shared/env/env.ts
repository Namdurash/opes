import Config from 'react-native-config';

/**
 * Typed access to environment variables declared in `.env`.
 *
 * Values are inlined by react-native-config at build time, so import them by
 * name anywhere in the app:
 *
 *   import { CLAUDE_API_KEY } from '../../shared/env';
 *
 * `env` re-exports the whole config object for dynamic/optional access.
 */
export const env = Config;

export const { CLAUDE_API_KEY } = Config;

/**
 * True only in the sandbox build, which is selected by `OPES_ENV=sandbox`.
 *
 * The key is read on every call rather than captured at module load: react-native-config
 * inlines it at build time on device, but under jest it is an ordinary object property
 * a test raises and lowers per case. An absent key, an empty string, `Sandbox` or any
 * other value all mean the normal build.
 */
export const isSandboxBuild = (): boolean => Config.OPES_ENV === 'sandbox';
