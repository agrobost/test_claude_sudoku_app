import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { i18n } from '@/lib/i18n';
import { logger } from '@/lib/logger';

import { STREAK_ALERT_HOUR, type NotificationPlan } from './logic';

const CHANNEL_ID = 'reminders';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch (error) {
    logger.warn('demande de permission notifications impossible', error);
    return false;
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('notifications.channelName'),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Reprogramme tout : annule puis applique le plan calculé (idempotent). */
export async function applyNotificationPlan(plan: NotificationPlan): Promise<void> {
  try {
    await ensureAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (plan.dailyReminderHour !== null) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.reminderTitle'),
          body: i18n.t('notifications.reminderBody'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: plan.dailyReminderHour,
          minute: 0,
          channelId: CHANNEL_ID,
        },
      });
    }

    if (plan.streakAlertToday) {
      const at = new Date();
      at.setHours(STREAK_ALERT_HOUR, 0, 0, 0);
      if (at.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: i18n.t('notifications.streakTitle'),
            body: i18n.t('notifications.streakBody'),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            channelId: CHANNEL_ID,
          },
        });
      }
    }
  } catch (error) {
    logger.warn('programmation des notifications impossible', error);
  }
}
