/** Alerte de protection de série : 20 h locale (PRD §4 U14). */
export const STREAK_ALERT_HOUR = 20;

export type NotificationPlan = {
  /** Heure du rappel quotidien répétitif, ou null si désactivé. */
  readonly dailyReminderHour: number | null;
  /** Programmer l'alerte « ta série expire ce soir » à 20 h aujourd'hui. */
  readonly streakAlertToday: boolean;
};

export type NotificationInput = {
  readonly enabled: boolean;
  readonly reminderHour: number;
  readonly todayWon: boolean;
  readonly currentStreak: number;
  /** Heure locale courante (0-23) : on ne programme pas une alerte déjà passée. */
  readonly nowHourLocal: number;
};

export function computeNotificationPlan(input: NotificationInput): NotificationPlan {
  if (!input.enabled) {
    return { dailyReminderHour: null, streakAlertToday: false };
  }
  return {
    dailyReminderHour: input.reminderHour,
    streakAlertToday:
      !input.todayWon && input.currentStreak > 0 && input.nowHourLocal < STREAK_ALERT_HOUR,
  };
}
