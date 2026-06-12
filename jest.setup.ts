/**
 * Mocks des modules NATIFS (indisponibles sous Jest).
 * Les tests ne valident jamais ces couches : ils valident la logique au-dessus.
 */

jest.mock('react-native-mmkv', () => {
  class MMKV {
    private readonly map = new Map<string, string | number | boolean>();
    set(key: string, value: string | number | boolean): void {
      this.map.set(key, value);
    }
    getString(key: string): string | undefined {
      const value = this.map.get(key);
      return typeof value === 'string' ? value : undefined;
    }
    getNumber(key: string): number | undefined {
      const value = this.map.get(key);
      return typeof value === 'number' ? value : undefined;
    }
    getBoolean(key: string): boolean | undefined {
      const value = this.map.get(key);
      return typeof value === 'boolean' ? value : undefined;
    }
    delete(key: string): void {
      this.map.delete(key);
    }
    clearAll(): void {
      this.map.clear();
    }
    getAllKeys(): string[] {
      return [...this.map.keys()];
    }
  }
  return { MMKV };
});

jest.mock('expo-crypto', () => {
  let counter = 0;
  return {
    randomUUID: (): string => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
    },
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));
