import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Difficulty } from '@/engine';
import { computeStreaks } from '@/features/daily';
import { useHistoryStore, wonOnTimeDates } from '@/features/history';
import { aggregateStats } from '@/features/stats';
import { formatClock, todayLocalDate } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export default function StatsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const records = useHistoryStore((s) => s.records);

  const stats = useMemo(() => aggregateStats(records), [records]);
  const streaks = useMemo(
    () => computeStreaks(wonOnTimeDates(records), todayLocalDate()),
    [records],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.stats')}</Text>

        <View style={styles.overviewRow}>
          <OverviewCard label={t('stats.played')} value={String(stats.totalPlayed)} />
          <OverviewCard label={t('stats.won')} value={String(stats.totalWon)} />
          <OverviewCard label={t('stats.winRate')} value={`${stats.winRatePercent} %`} />
        </View>
        <View style={styles.overviewRow}>
          <OverviewCard label={t('daily.streakCurrent')} value={String(streaks.current)} />
          <OverviewCard label={t('daily.streakLongest')} value={String(streaks.longest)} />
        </View>

        <View style={[styles.table, { backgroundColor: colors.surface }]}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, styles.colDifficulty, { color: colors.textMuted }]}>
              {t('stats.difficulty')}
            </Text>
            <Text style={[styles.tableHeader, styles.col, { color: colors.textMuted }]}>
              {t('stats.wonShort')}
            </Text>
            <Text style={[styles.tableHeader, styles.col, { color: colors.textMuted }]}>
              {t('stats.best')}
            </Text>
            <Text style={[styles.tableHeader, styles.col, { color: colors.textMuted }]}>
              {t('stats.average')}
            </Text>
          </View>
          {DIFFICULTIES.map((difficulty) => {
            const row = stats.perDifficulty[difficulty];
            return (
              <View key={difficulty} style={[styles.tableRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.colDifficulty, { color: colors.text }]}>
                  {t(`difficulty.${difficulty}`)}
                </Text>
                <Text style={[styles.col, { color: colors.text }]}>
                  {row.won}/{row.played}
                </Text>
                <Text style={[styles.col, { color: colors.text }]}>
                  {row.bestMs === null ? '—' : formatClock(row.bestMs)}
                </Text>
                <Text style={[styles.col, { color: colors.text }]}>
                  {row.avgMs === null ? '—' : formatClock(row.avgMs)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
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
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    gap: 2,
    paddingVertical: spacing.md,
  },
  cardValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  cardLabel: {
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  table: {
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  tableHeader: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  colDifficulty: {
    flex: 1.4,
  },
  col: {
    flex: 1,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});
