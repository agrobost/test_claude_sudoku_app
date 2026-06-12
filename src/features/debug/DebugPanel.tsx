import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useSession } from '@/features/auth';
import { useGameStore } from '@/features/game';
import { useHistoryStore } from '@/features/history';
import {
  AdBanner,
  adsConfigured,
  adsReady,
  debugShowInterstitial,
  hintsRemaining,
  iapConfigured,
  normalizeQuota,
  showRewardedAd,
  useMonetizationStore,
} from '@/features/monetization';
import {
  listScheduledNotifications,
  refreshNotifications,
  requestNotificationPermission,
  sendTestNotification,
} from '@/features/notifications';
import { refillPuzzles, usePuzzlesStore } from '@/features/puzzles';
import { flushOutbox, readOutbox, writeOutbox } from '@/features/sync';
import {
  analyticsActive,
  debugForceCrash,
  debugRecordTestError,
  firebaseAvailable,
  trackEvent,
} from '@/lib/analytics';
import { formatClock, nowMs, todayLocalDate } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import {
  debugClearHistory,
  debugFactoryReset,
  debugFillSolution,
  debugGrantHints,
  debugLoseByMistakes,
  debugMakeInterstitialEligible,
  debugResetHintQuota,
  debugSeedClassicHistory,
  debugSeedDailyStreak,
  debugSetNoAds,
} from './actions';

/** Contenu du menu debug — rendu par la route /debug et par l'overlay global. */
export function DebugPanel() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const session = useSession();
  const [, setTick] = useState(0);

  const gameStatus = useGameStore((s) => s.game?.status ?? null);
  const noAds = useMonetizationStore((s) => s.noAds);
  const hintQuota = useMonetizationStore((s) => s.hintQuota);
  const totalGamesFinished = useMonetizationStore((s) => s.totalGamesFinished);
  const lastInterstitialAt = useMonetizationStore((s) => s.lastInterstitialAt);
  const recordsCount = useHistoryStore((s) => s.records.length);
  const unseenCount = usePuzzlesStore((s) => s.unseenCount);

  const today = todayLocalDate();
  const hintsLeft = hintsRemaining(normalizeQuota(hintQuota, today));
  const outboxCount = readOutbox().length;
  const playing = gameStatus === 'playing';

  const refresh = (): void => setTick((value) => value + 1);
  const run = (action: () => void) => (): void => {
    action();
    refresh();
  };
  const onOff = (value: boolean): string => (value ? t('debug.state.on') : t('debug.state.off'));

  const onShowInterstitial = (): void => {
    void debugShowInterstitial().then((outcome) => {
      if (outcome === 'shown') return;
      Alert.alert(
        t('debug.ads.resultTitle'),
        outcome === 'notReady' ? t('debug.ads.notReady') : t('debug.ads.unconfigured'),
      );
    });
  };

  const onShowRewarded = (): void => {
    void showRewardedAd().then((outcome) => {
      Alert.alert(t('debug.ads.resultTitle'), t('debug.ads.rewardedOutcome', { outcome }));
    });
  };

  const onRequestPermission = (): void => {
    void requestNotificationPermission().then((granted) => {
      Alert.alert(
        t('debug.notifications.title'),
        t('debug.notifications.permissionResult', { granted: onOff(granted) }),
      );
    });
  };

  const onListNotifications = (): void => {
    void listScheduledNotifications().then((lines) => {
      Alert.alert(
        t('debug.notifications.listTitle'),
        lines.length === 0 ? t('debug.notifications.listEmpty') : lines.join('\n\n'),
      );
    });
  };

  const onPing = (): void => {
    trackEvent({ name: 'debug_ping', params: { at: String(nowMs()) } });
    Alert.alert(
      t('debug.analytics.title'),
      analyticsActive() ? t('debug.common.done') : t('debug.analytics.inactive'),
    );
  };

  const onNonFatal = (): void => {
    Alert.alert(
      t('debug.analytics.title'),
      debugRecordTestError() ? t('debug.common.done') : t('debug.analytics.needsFirebase'),
    );
  };

  const onCrash = (): void => {
    Alert.alert(t('debug.analytics.crashTitle'), t('debug.analytics.crashMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('debug.analytics.crashConfirm'),
        style: 'destructive',
        onPress: () => {
          if (!debugForceCrash()) {
            Alert.alert(t('debug.analytics.title'), t('debug.analytics.needsFirebase'));
          }
        },
      },
    ]);
  };

  const onFactoryReset = (): void => {
    Alert.alert(t('debug.data.factoryResetTitle'), t('debug.data.factoryResetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('debug.data.factoryResetConfirm'),
        style: 'destructive',
        onPress: () => {
          debugFactoryReset();
          queryClient.clear();
          refresh();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title={t('debug.state.title')}>
        <StateLine text={t('debug.state.userId', { id: session.userId ?? '—' })} />
        <StateLine text={t('debug.state.today', { date: today })} />
        <StateLine text={t('debug.state.records', { count: recordsCount })} />
        <StateLine text={t('debug.state.outbox', { count: outboxCount })} />
        <StateLine
          text={t('debug.state.unseen', {
            easy: unseenCount('easy'),
            medium: unseenCount('medium'),
            hard: unseenCount('hard'),
            expert: unseenCount('expert'),
          })}
        />
        <StateLine
          text={t('debug.state.games', {
            count: totalGamesFinished,
            last:
              lastInterstitialAt === null
                ? t('debug.state.never')
                : t('debug.state.ago', { duration: formatClock(nowMs() - lastInterstitialAt) }),
          })}
        />
        <StateLine text={t('debug.state.adsConfigured', { value: onOff(adsConfigured()) })} />
        <StateLine text={t('debug.state.adsReady', { value: onOff(adsReady()) })} />
        <StateLine text={t('debug.state.iapConfigured', { value: onOff(iapConfigured()) })} />
        <StateLine text={t('debug.state.firebase', { value: onOff(firebaseAvailable()) })} />
        <StateLine text={t('debug.state.analyticsActive', { value: onOff(analyticsActive()) })} />
      </Section>

      <Section title={t('debug.game.title')}>
        <StateLine text={t('debug.game.status', { status: gameStatus ?? t('debug.game.none') })} />
        <Action
          label={t('debug.game.fill')}
          disabled={!playing}
          onPress={run(() => debugFillSolution(1))}
        />
        <Action
          label={t('debug.game.win')}
          disabled={!playing}
          onPress={run(() => debugFillSolution(0))}
        />
        <Action
          label={t('debug.game.lose')}
          disabled={!playing}
          onPress={run(debugLoseByMistakes)}
        />
      </Section>

      <Section title={t('debug.hints.title')}>
        <StateLine text={t('debug.hints.remaining', { count: hintsLeft })} />
        <Action label={t('debug.hints.grant')} onPress={run(() => debugGrantHints(5))} />
        <Action label={t('debug.hints.reset')} onPress={run(debugResetHintQuota)} />
      </Section>

      <Section title={t('debug.ads.title')}>
        <Action label={t('debug.ads.interstitial')} onPress={onShowInterstitial} />
        <Action label={t('debug.ads.rewarded')} onPress={onShowRewarded} />
        <Action label={t('debug.ads.makeEligible')} onPress={run(debugMakeInterstitialEligible)} />
        <StateLine text={t('debug.ads.bannerHint')} />
        <AdBanner />
      </Section>

      <Section title={t('debug.premium.title')}>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            {t('debug.premium.simulate')}
          </Text>
          <Switch
            accessibilityLabel={t('debug.premium.simulate')}
            value={noAds}
            onValueChange={(value) => debugSetNoAds(value)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        <StateLine text={t('debug.premium.hint')} />
      </Section>

      <Section title={t('debug.notifications.title')}>
        <Action label={t('debug.notifications.permission')} onPress={onRequestPermission} />
        <Action
          label={t('debug.notifications.send')}
          onPress={() => void sendTestNotification(5)}
        />
        <Action label={t('debug.notifications.list')} onPress={onListNotifications} />
        <Action label={t('debug.notifications.refresh')} onPress={run(refreshNotifications)} />
      </Section>

      <Section title={t('debug.data.title')}>
        <Action label={t('debug.data.winToday')} onPress={run(() => debugSeedDailyStreak(1))} />
        <Action label={t('debug.data.seedStreak')} onPress={run(() => debugSeedDailyStreak(7))} />
        <Action
          label={t('debug.data.seedHistory')}
          onPress={run(() => debugSeedClassicHistory(30))}
        />
        <Action label={t('debug.data.clearHistory')} onPress={run(debugClearHistory)} />
        <Action
          label={t('debug.data.flushOutbox')}
          onPress={() => void flushOutbox().then(refresh)}
        />
        <Action label={t('debug.data.clearOutbox')} onPress={run(() => writeOutbox([]))} />
        <Action
          label={t('debug.data.resetPuzzles')}
          onPress={run(() => usePuzzlesStore.getState().resetAll())}
        />
        <Action label={t('debug.data.refill')} onPress={() => void refillPuzzles().then(refresh)} />
        <Action label={t('debug.data.factoryReset')} destructive onPress={onFactoryReset} />
      </Section>

      <Section title={t('debug.analytics.title')}>
        <Action label={t('debug.analytics.ping')} onPress={onPing} />
        <Action label={t('debug.analytics.nonFatal')} onPress={onNonFatal} />
        <Action label={t('debug.analytics.crash')} destructive onPress={onCrash} />
      </Section>
    </ScrollView>
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

function StateLine({ text }: { text: string }) {
  const colors = useThemeColors();
  return <Text style={[styles.stateLine, { color: colors.textMuted }]}>{text}</Text>;
}

function Action({
  label,
  onPress,
  disabled = false,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: colors.surfaceAlt,
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.actionLabel, { color: destructive ? colors.danger : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: 0,
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
  stateLine: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  action: {
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSize.body,
    fontWeight: '500',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchLabel: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: '500',
  },
});
