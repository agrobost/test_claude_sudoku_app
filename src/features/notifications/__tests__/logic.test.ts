import { computeNotificationPlan, STREAK_ALERT_HOUR } from '../logic';

const base = {
  enabled: true,
  reminderHour: 9,
  todayWon: false,
  currentStreak: 4,
  nowHourLocal: 10,
};

describe('computeNotificationPlan', () => {
  it('ne programme rien quand les notifications sont désactivées', () => {
    expect(computeNotificationPlan({ ...base, enabled: false })).toEqual({
      dailyReminderHour: null,
      streakAlertToday: false,
    });
  });

  it('programme le rappel quotidien à l’heure choisie', () => {
    expect(computeNotificationPlan(base).dailyReminderHour).toBe(9);
    expect(computeNotificationPlan({ ...base, reminderHour: 19 }).dailyReminderHour).toBe(19);
  });

  it('protège la série seulement si elle existe et que le défi n’est pas gagné', () => {
    expect(computeNotificationPlan(base).streakAlertToday).toBe(true);
    expect(computeNotificationPlan({ ...base, todayWon: true }).streakAlertToday).toBe(false);
    expect(computeNotificationPlan({ ...base, currentStreak: 0 }).streakAlertToday).toBe(false);
  });

  it('ne programme pas une alerte déjà passée', () => {
    expect(
      computeNotificationPlan({ ...base, nowHourLocal: STREAK_ALERT_HOUR }).streakAlertToday,
    ).toBe(false);
    expect(
      computeNotificationPlan({ ...base, nowHourLocal: STREAK_ALERT_HOUR - 1 }).streakAlertToday,
    ).toBe(true);
  });
});
