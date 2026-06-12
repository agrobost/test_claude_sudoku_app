/**
 * Façade analytics typée (cf. CLAUDE.md : aucun appel Firebase direct ailleurs).
 * Sans consentement OU sans app Firebase configurée : no-op silencieux.
 */
import { logger, setLoggerSink } from '@/lib/logger';

export type AnalyticsEvent =
  | { name: 'game_start'; params: { mode: string; difficulty: string } }
  | {
      name: 'game_end';
      params: {
        mode: string;
        difficulty: string;
        result: string;
        duration_ms: number;
        mistakes: number;
        hints_used: number;
      };
    }
  | { name: 'daily_completed'; params: { daily_date: string; duration_ms: number } }
  | { name: 'hint_used'; params: { technique: string } }
  | { name: 'ad_shown'; params: { format: 'banner' | 'interstitial' | 'rewarded' } }
  | { name: 'purchase_no_ads'; params: { restored: boolean } }
  | { name: 'consent_changed'; params: { analytics_granted: boolean } };

type FirebaseHandles = {
  logEvent: (name: string, params: Record<string, unknown>) => Promise<unknown>;
  setAnalyticsEnabled: (enabled: boolean) => Promise<unknown>;
  setCrashlyticsEnabled: (enabled: boolean) => Promise<unknown>;
  recordError: (error: Error) => void;
  crashLog: (message: string) => void;
};

let handles: FirebaseHandles | null = null;
let consentGranted = false;

function loadFirebase(): FirebaseHandles | null {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const appModule: typeof import('@react-native-firebase/app') = require('@react-native-firebase/app');
    const analyticsModule: typeof import('@react-native-firebase/analytics') = require('@react-native-firebase/analytics');
    const crashlyticsModule: typeof import('@react-native-firebase/crashlytics') = require('@react-native-firebase/crashlytics');
    /* eslint-enable @typescript-eslint/no-require-imports */

    const app = appModule.getApp(); // jette si aucune app [DEFAULT] (config absente)
    const analytics = analyticsModule.getAnalytics(app);
    const crashlytics = crashlyticsModule.getCrashlytics();
    return {
      logEvent: (name, params) => analyticsModule.logEvent(analytics, name, params),
      setAnalyticsEnabled: (enabled) =>
        analyticsModule.setAnalyticsCollectionEnabled(analytics, enabled),
      setCrashlyticsEnabled: (enabled) =>
        crashlyticsModule.setCrashlyticsCollectionEnabled(crashlytics, enabled),
      recordError: (error) => crashlyticsModule.recordError(crashlytics, error),
      crashLog: (message) => crashlyticsModule.log(crashlytics, message),
    };
  } catch {
    // Firebase absent du build (pas de google-services) : analytics désactivée
    return null;
  }
}

/** À appeler au boot et à chaque changement du consentement (Réglages). */
export async function applyAnalyticsConsent(granted: boolean): Promise<void> {
  consentGranted = granted;
  if (handles === null) handles = loadFirebase();
  if (handles === null) return;

  const firebase = handles;
  try {
    await firebase.setAnalyticsEnabled(granted);
    await firebase.setCrashlyticsEnabled(granted);
    if (granted) {
      // les erreurs inattendues remontent à Crashlytics (cf. CLAUDE.md)
      setLoggerSink((level, message, error) => {
        firebase.crashLog(`[${level}] ${message}`);
        if (error instanceof Error) firebase.recordError(error);
      });
    }
  } catch (error) {
    logger.warn('applyAnalyticsConsent a échoué', error);
  }
}

/** Émet un événement produit (no-op sans consentement ou sans Firebase). */
export function trackEvent(event: AnalyticsEvent): void {
  if (!consentGranted || handles === null) return;
  handles.logEvent(event.name, event.params).catch((error: unknown) => {
    logger.warn(`trackEvent ${event.name} a échoué`, error);
  });
}
