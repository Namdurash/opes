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
    const mmkv = createMMKV();
    return {
      set: (key, value) => mmkv.set(key, value),
      getString: key => mmkv.getString(key),
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
