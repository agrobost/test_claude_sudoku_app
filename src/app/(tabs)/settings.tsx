import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteAccount,
  linkIdentity,
  signOutToFreshAnonymous,
  useSession,
  type LinkProvider,
} from '@/features/auth';
import { setAnalyticsConsent, useConsentStore } from '@/features/consent';
import { debugMenuEnabled } from '@/features/debug';
import { useGameStore } from '@/features/game';
import { useHistoryStore } from '@/features/history';
import { restorePurchases, useMonetizationStore } from '@/features/monetization';
import { requestNotificationPermission } from '@/features/notifications';
import { usePuzzlesStore } from '@/features/puzzles';
import { REMINDER_HOURS, useSettingsStore, type LanguageOverride } from '@/features/settings';
import { pullServerHistory, writeOutbox } from '@/features/sync';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const languageOverride = useSettingsStore((s) => s.languageOverride);
  const setLanguageOverride = useSettingsStore((s) => s.setLanguageOverride);
  const analyticsConsent = useConsentStore((s) => s.analyticsConsent);
  const noAds = useMonetizationStore((s) => s.noAds);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const reminderHour = useSettingsStore((s) => s.reminderHour);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setReminderHour = useSettingsStore((s) => s.setReminderHour);
  const [busy, setBusy] = useState(false);

  const toggleNotifications = (enabled: boolean): void => {
    if (!enabled) {
      setNotificationsEnabled(false);
      return;
    }
    void requestNotificationPermission().then((granted) => {
      if (granted) {
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          t('settings.notifications.deniedTitle'),
          t('settings.notifications.deniedMessage'),
        );
      }
    });
  };

  const runRestore = (): void => {
    setBusy(true);
    void restorePurchases().then((result) => {
      setBusy(false);
      if (result.ok) {
        Alert.alert(t('paywall.restoredTitle'), t('paywall.thanksMessage'));
      } else {
        Alert.alert(t('paywall.restoreFailedTitle'), t('paywall.restoreFailedMessage'));
      }
    });
  };

  const purgeLocalData = (): void => {
    useGameStore.getState().clearGame();
    useHistoryStore.getState().clearAll();
    usePuzzlesStore.getState().resetAll();
    writeOutbox([]);
    queryClient.clear();
  };

  const runLink = async (provider: LinkProvider): Promise<void> => {
    setBusy(true);
    const result = await linkIdentity(provider);
    if (result.ok) {
      await pullServerHistory();
      Alert.alert(t('settings.account.linkedTitle'), t('settings.account.linkedMessage'));
    } else if (result.reason !== 'cancel' && result.reason !== 'dismiss') {
      Alert.alert(t('settings.account.linkErrorTitle'), result.reason);
    }
    setBusy(false);
  };

  const confirmSignOut = (): void => {
    Alert.alert(t('settings.account.signOutTitle'), t('settings.account.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.account.signOutConfirm'),
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void signOutToFreshAnonymous().then(() => {
            purgeLocalData();
            setBusy(false);
          });
        },
      },
    ]);
  };

  const confirmDelete = (): void => {
    Alert.alert(t('settings.danger.deleteTitle'), t('settings.danger.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.danger.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void deleteAccount().then((result) => {
            setBusy(false);
            if (result.ok) {
              purgeLocalData();
              Alert.alert(t('settings.danger.deletedTitle'), t('settings.danger.deletedMessage'));
            } else {
              Alert.alert(t('settings.danger.deleteErrorTitle'), t('settings.danger.deleteErrorMessage'));
            }
          });
        },
      },
    ]);
  };

  const languages: { value: LanguageOverride; label: string }[] = [
    { value: null, label: t('settings.language.system') },
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.settings')}</Text>

        <Section title={t('settings.account.title')}>
          {session.isAnonymous ? (
            <>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('settings.account.anonymousHint')}
              </Text>
              <Row
                icon="apple"
                label={t('settings.account.linkApple')}
                onPress={() => void runLink('apple')}
                disabled={busy}
              />
              <Row
                icon="google"
                label={t('settings.account.linkGoogle')}
                onPress={() => void runLink('google')}
                disabled={busy}
              />
            </>
          ) : (
            <>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('settings.account.linkedAs', { email: session.email ?? '—' })}
              </Text>
              <Row
                icon="logout"
                label={t('settings.account.signOut')}
                onPress={confirmSignOut}
                disabled={busy}
              />
            </>
          )}
          {busy ? <ActivityIndicator color={colors.primary} /> : null}
        </Section>

        <Section title={t('settings.language.title')}>
          <View style={styles.languageRow}>
            {languages.map((language) => {
              const active = languageOverride === language.value;
              return (
                <Pressable
                  key={String(language.value)}
                  accessibilityRole="button"
                  onPress={() => setLanguageOverride(language.value)}
                  style={[
                    styles.languageChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text style={{ color: active ? colors.onPrimary : colors.text }}>
                    {language.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title={t('settings.premium.title')}>
          {noAds ? (
            <Text style={[styles.hint, { color: colors.text }]}>
              {t('settings.premium.active')}
            </Text>
          ) : (
            <>
              <Row
                icon="movie-off-outline"
                label={t('settings.premium.buy')}
                onPress={() => router.push('/paywall')}
              />
              <Row
                icon="backup-restore"
                label={t('settings.premium.restore')}
                onPress={runRestore}
                disabled={busy}
              />
            </>
          )}
        </Section>

        <Section title={t('settings.notifications.title')}>
          <View style={styles.switchRow}>
            <View style={styles.switchTexts}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t('settings.notifications.toggle')}
              </Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('settings.notifications.hint')}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t('settings.notifications.toggle')}
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          {notificationsEnabled ? (
            <View style={styles.languageRow}>
              {REMINDER_HOURS.map((hour) => {
                const active = reminderHour === hour;
                return (
                  <Pressable
                    key={hour}
                    accessibilityRole="button"
                    onPress={() => setReminderHour(hour)}
                    style={[
                      styles.languageChip,
                      { backgroundColor: active ? colors.primary : colors.surfaceAlt },
                    ]}
                  >
                    <Text style={{ color: active ? colors.onPrimary : colors.text }}>
                      {t('settings.notifications.hourChip', { hour })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Section>

        <Section title={t('settings.privacy.title')}>
          <View style={styles.switchRow}>
            <View style={styles.switchTexts}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t('settings.privacy.analytics')}
              </Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('settings.privacy.analyticsHint')}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t('settings.privacy.analytics')}
              value={analyticsConsent}
              onValueChange={setAnalyticsConsent}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Section>

        <Section title={t('settings.about.title')}>
          <Row
            icon="shield-lock-outline"
            label={t('settings.about.privacy')}
            onPress={() => router.push('/legal/privacy')}
          />
          <Row
            icon="information-outline"
            label={t('settings.about.about')}
            onPress={() => router.push('/legal/about')}
          />
          <Text style={[styles.version, { color: colors.textMuted }]}>
            {t('settings.about.version', { version: Constants.expoConfig?.version ?? '0.0.0' })}
          </Text>
        </Section>

        <Section title={t('settings.danger.title')}>
          <Row
            icon="delete-forever-outline"
            label={t('settings.danger.delete')}
            destructive
            onPress={confirmDelete}
            disabled={busy}
          />
        </Section>

        {debugMenuEnabled ? (
          <Section title={t('debug.title')}>
            <Row icon="bug-outline" label={t('debug.entry')} onPress={() => router.push('/debug')} />
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  disabled = false,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const colors = useThemeColors();
  const color = destructive ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  section: {
    borderRadius: 16,
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: '500',
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchTexts: {
    flex: 1,
    gap: 2,
  },
  languageChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  version: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
});
