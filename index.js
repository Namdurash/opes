/**
 * @format
 *
 * The react-native-get-random-values polyfill is imported first, before
 * react-native and ./App, on purpose: Hermes ships no crypto global of its own,
 * and the secret store's key bootstrap (src/services/secret-storage/cryptoKey.ts)
 * fails closed without one. The very first Monobank save() can reach it, so the
 * global has to exist before any other module gets a chance to run (OPES-58).
 */

import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { migrateMonobankSecrets } from './src/services/monobank';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

/**
 * OPES-63 — move any pre-OPES-58 plaintext Monobank token onto the encrypted store,
 * once per launch. Deliberately not awaited and deliberately after the polyfill above:
 * the key bootstrap it reaches needs crypto, and nothing that blocks first render may
 * wait on it. The migration already swallows every per-key failure and resolves; the
 * terminal .catch is belt-and-braces so an unexpected throw cannot surface here.
 */
migrateMonobankSecrets().catch(() => {});
