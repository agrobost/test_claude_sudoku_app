import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const storage = new MMKV({ id: 'sudoku-app' });

/**
 * Unique point d'accès au stockage local (cf. CLAUDE.md).
 * `getJSON` exige un type guard : les données du disque sont des entrées
 * non fiables (corruption, anciennes versions) et se valident à la lecture.
 */
export const kv = {
  getString(key: string): string | null {
    return storage.getString(key) ?? null;
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
  getJSON<T>(key: string, isValid: (value: unknown) => value is T): T | null {
    const raw = storage.getString(key);
    if (raw === undefined) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : null;
    } catch {
      // une valeur corrompue se traite comme absente : l'appelant repart d'un état neuf
      return null;
    }
  },
  setJSON(key: string, value: unknown): void {
    storage.set(key, JSON.stringify(value));
  },
  remove(key: string): void {
    storage.delete(key);
  },
  clearAll(): void {
    storage.clearAll();
  },
};

/** Adaptateur pour zustand/persist. */
export const zustandStorage: StateStorage = {
  getItem: (name) => kv.getString(name),
  setItem: (name, value) => {
    kv.setString(name, value);
  },
  removeItem: (name) => {
    kv.remove(name);
  },
};
