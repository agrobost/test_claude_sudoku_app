import { computeStreaks } from '../daily';
import { onGameRecorded, useHistoryStore, wonDailyDates, wonOnTimeDates } from '../history';
import { useSettingsStore } from '../settings';

import { todayLocalDate } from '@/lib/dates';

import { computeNotificationPlan } from './logic';
import { applyNotificationPlan } from './scheduler';

export { computeNotificationPlan, STREAK_ALERT_HOUR, type NotificationPlan } from './logic';
export { requestNotificationPermission } from './scheduler';

/** Recalcule et reprogramme les notifications selon l'état courant. */
export function refreshNotifications(): void {
  const settings = useSettingsStore.getState();
  const records = useHistoryStore.getState().records;
  const today = todayLocalDate();
  const plan = computeNotificationPlan({
    enabled: settings.notificationsEnabled,
    reminderHour: settings.reminderHour,
    todayWon: wonDailyDates(records).has(today),
    currentStreak: computeStreaks(wonOnTimeDates(records), today).current,
    nowHourLocal: new Date().getHours(),
  });
  void applyNotificationPlan(plan);
}

/**
 * Boot : applique le plan, puis le rafraîchit quand les réglages changent
 * ou qu'un daily est gagné (annule l'alerte de série du soir).
 */
export function initNotifications(): () => void {
  refreshNotifications();

  const unsubscribeSettings = useSettingsStore.subscribe((state, previous) => {
    if (
      state.notificationsEnabled !== previous.notificationsEnabled ||
      state.reminderHour !== previous.reminderHour
    ) {
      refreshNotifications();
    }
  });

  onGameRecorded((record) => {
    if (record.mode === 'daily' && record.result === 'won') {
      refreshNotifications();
    }
  });

  return unsubscribeSettings;
}
