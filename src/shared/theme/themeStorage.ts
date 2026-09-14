import type { ThemeMode } from './theme';

const THEME_MODE_KEY = 'theme_mode';

interface KeyValueStorage {
  set(key: string, value: string): void;
  getString(key: string): string | undefined;
}

class InMemoryKeyValueStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();
  set(key: string, value: string): void { this.data.set(key, value); }
  getString(key: string): string | undefined { return this.data.get(key); }
}

const createDefaultStorage = (): KeyValueStorage => {
  if (typeof jest !== 'undefined') {
    return new InMemoryKeyValueStorage();
  }

  try {
    const { createMMKV } = require('react-native-mmkv') as {
      createMMKV: () => {
        set: (key: string, value: string) => void;
        getString: (key: string) => string | undefined;
      };
    };
    // Resolved per call, never held: the OPES-63 Monobank migration deletes and
    // recreates the default MMKV file on the first launch after an upgrade, and a
    // handle taken before that point stops working — writes through one are silently
    // dropped rather than rejected, so the theme would quietly stop persisting. MMKV
    // caches live instances by id, so this is a lookup, not a reopen.
    return {
      set: (key, value) => createMMKV().set(key, value),
      getString: key => createMMKV().getString(key),
    };
  } catch {
    console.warn('[themeStorage] MMKV unavailable, falling back to in-memory storage.');
    return new InMemoryKeyValueStorage();
  }
};

const storage = createDefaultStorage();

export const getStoredThemeMode = (): ThemeMode | null => {
  const value = storage.getString(THEME_MODE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
};

export const setStoredThemeMode = (mode: ThemeMode): void => {
  storage.set(THEME_MODE_KEY, mode);
};
