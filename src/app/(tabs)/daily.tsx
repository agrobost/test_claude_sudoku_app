import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildMonthGrid,
  computeStreaks,
  monthOf,
  nextMonth,
  previousMonth,
  useLaunchDaily,
} from '@/features/daily';
import { useHistoryStore, wonDailyDates, wonOnTimeDates } from '@/features/history';
import { todayLocalDate } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

export default function DailyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const records = useHistoryStore((s) => s.records);
  const { launchDaily, loadingDate } = useLaunchDaily();

  const today = todayLocalDate();
  const [month, setMonth] = useState(monthOf(today));

  const won = wonDailyDates(records);
  const streaks = computeStreaks(wonOnTimeDates(records), today);
  const weeks = buildMonthGrid(month);
  const isCurrentMonth = month === monthOf(today);
  const weekdayLabels = t('daily.weekdaysShort').split(',');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('tabs.daily')}</Text>

        <View style={styles.streakRow}>
          <StreakChip
            icon="fire"
            label={t('daily.streakCurrent')}
            value={streaks.current}
            color={colors.warning}
          />
          <StreakChip
            icon="trophy-outline"
            label={t('daily.streakLongest')}
            value={streaks.longest}
            color={colors.primary}
          />
        </View>

        <View style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('daily.previousMonth')}
              onPress={() => setMonth(previousMonth(month))}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>{month}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('daily.nextMonth')}
              onPress={() => setMonth(nextMonth(month))}
              disabled={isCurrentMonth}
              hitSlop={10}
              style={{ opacity: isCurrentMonth ? 0.25 : 1 }}
            >
              <MaterialCommunityIcons name="chevron-right" size={26} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((label, i) => (
              <Text key={i} style={[styles.weekday, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day) => {
                const isFuture = day.date > today;
                const isWon = won.has(day.date);
                const isToday = day.date === today;
                const disabled = !day.inMonth || isFuture;
                return (
                  <Pressable
                    key={day.date}
                    accessibilityRole="button"
                    accessibilityLabel={day.date}
                    disabled={disabled || loadingDate !== null}
                    onPress={() => launchDaily(day.date)}
                    style={[
                      styles.dayCell,
                      isWon && day.inMonth ? { backgroundColor: colors.primary } : null,
                      isToday ? { borderColor: colors.primary, borderWidth: 2 } : null,
                    ]}
                  >
                    {loadingDate === day.date ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={{
                          color: !day.inMonth
                            ? 'transparent'
                            : isWon
                              ? colors.onPrimary
                              : isFuture
                                ? colors.border
                                : colors.text,
                          fontWeight: isToday ? '700' : '400',
                        }}
                      >
                        {day.dayOfMonth}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {!won.has(today) ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => launchDaily(today)}
            disabled={loadingDate !== null}
            style={({ pressed }) => [
              styles.todayCta,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="calendar-star" size={22} color={colors.onPrimary} />
            <Text style={[styles.todayCtaLabel, { color: colors.onPrimary }]}>
              {t('daily.todayCta')}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.doneLine, { color: colors.success }]}>{t('daily.todayDone')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StreakChip({
  icon,
  label,
  value,
  color,
}: {
  icon: 'fire' | 'trophy-outline';
  label: string;
  value: number;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surface }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.chipValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color: colors.textMuted }]}>{label}</Text>
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
  streakRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  chipValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  chipLabel: {
    flexShrink: 1,
    fontSize: fontSize.caption,
  },
  calendarCard: {
    borderRadius: 16,
    gap: 6,
    padding: spacing.md,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: fontSize.subtitle,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    margin: 1,
  },
  todayCta: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.md,
  },
  todayCtaLabel: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  doneLine: {
    fontSize: fontSize.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
