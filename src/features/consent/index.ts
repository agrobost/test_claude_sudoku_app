import {
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

import { applyAnalyticsConsent, trackEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';

import { onGameRecorded } from '../history';

import { useConsentStore } from './store';

export { useConsentStore } from './store';

export type AttStatus = 'granted' | 'denied' | 'unavailable';

/**
 * Prompt ATT (iOS) — à appeler AVANT toute initialisation publicitaire.
 * Sur Android la permission n'existe pas : 'unavailable'.
 */
export async function requestAttIfNeeded(): Promise<AttStatus> {
  try {
    const { status } = await requestTrackingPermissionsAsync();
    if (status === PermissionStatus.GRANTED) return 'granted';
    if (status === PermissionStatus.DENIED) return 'denied';
    return 'unavailable';
  } catch (error) {
    logger.warn('requête ATT impossible', error);
    return 'unavailable';
  }
}

/** Change le consentement analytics (Réglages) et l'applique immédiatement. */
export function setAnalyticsConsent(granted: boolean): void {
  useConsentStore.getState().setAnalyticsConsent(granted);
  void applyAnalyticsConsent(granted).then(() => {
    trackEvent({ name: 'consent_changed', params: { analytics_granted: granted } });
  });
}

/**
 * Boot : applique le consentement persisté et branche l'instrumentation
 * produit (fin de partie, daily) sur l'enregistreur.
 */
export function initConsent(): void {
  void applyAnalyticsConsent(useConsentStore.getState().analyticsConsent);

  onGameRecorded((record) => {
    trackEvent({
      name: 'game_end',
      params: {
        mode: record.mode,
        difficulty: record.difficulty,
        result: record.result,
        duration_ms: record.durationMs,
        mistakes: record.mistakes,
        hints_used: record.hintsUsed,
      },
    });
    if (record.mode === 'daily' && record.result === 'won' && record.dailyDate !== null) {
      trackEvent({
        name: 'daily_completed',
        params: { daily_date: record.dailyDate, duration_ms: record.durationMs },
      });
    }
  });
}
