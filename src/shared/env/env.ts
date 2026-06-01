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
