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

jest.mock('react-native-applovin-max', () => {
  const fullscreen = {
    isAdReady: jest.fn(async () => false),
    loadAd: jest.fn(),
    showAd: jest.fn(),
    addAdLoadedEventListener: jest.fn(),
    addAdLoadFailedEventListener: jest.fn(),
    addAdHiddenEventListener: jest.fn(),
    addAdFailedToDisplayEventListener: jest.fn(),
    removeAdLoadedEventListener: jest.fn(),
    removeAdLoadFailedEventListener: jest.fn(),
    removeAdHiddenEventListener: jest.fn(),
    removeAdFailedToDisplayEventListener: jest.fn(),
  };
  return {
    AppLovinMAX: {
      initialize: jest.fn(async () => ({})),
      isInitialized: jest.fn(async () => false),
      setTermsAndPrivacyPolicyFlowEnabled: jest.fn(),
      setPrivacyPolicyUrl: jest.fn(),
      setTermsOfServiceUrl: jest.fn(),
    },
    InterstitialAd: { ...fullscreen },
    RewardedAd: { ...fullscreen, addAdReceivedRewardEventListener: jest.fn(), removeAdReceivedRewardEventListener: jest.fn() },
    AdView: () => null,
    AdFormat: { BANNER: 'banner', MREC: 'mrec' },
  };
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    logIn: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    getOfferings: jest.fn(async () => ({ current: null })),
    purchasePackage: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(async () => ({ entitlements: { active: {} } })),
  },
}));

jest.mock('expo-tracking-transparency', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  requestTrackingPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));
