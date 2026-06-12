import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Difficulty } from '@/engine';
import { computeStreaks, useLaunchDaily } from '@/features/daily';
import { elapsedMsOf, useGameStore } from '@/features/game';
import { useHistoryStore, wonDailyDates, wonOnTimeDates } from '@/features/history';
import { usePuzzlesStore } from '@/features/puzzles';
import { formatClock, formatHumanDate, nowMs, todayLocalDate } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const startGame = useGameStore((s) => s.startGame);
  const takePuzzle = usePuzzlesStore((s) => s.takePuzzle);
  const records = useHistoryStore((s) => s.records);
  const { launchDaily, loadingDate } = useLaunchDaily();

  const today = todayLocalDate();
  const dailyDone = wonDailyDates(records).has(today);
  const streak = computeStreaks(wonOnTimeDates(records), today).current;
  const hasOngoingGame = game !== null && game.status === 'playing';

  const launchClassic = (difficulty: Difficulty): void => {
    const store = useGameStore.getState();
    if (store.game !== null && store.game.status === 'playing') {
      store.abandonGame(); // l'abandon confirmé devient une défaite enregistrée
    }
    startGame(takePuzzle(difficulty), 'classic', null);
    router.push('/game');
  };

  const startNewGame = (difficulty: Difficulty): void => {
    if (hasOngoingGame) {
      Alert.alert(t('home.replace.title'), t('home.replace.message'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.replace.confirm'),
          style: 'destructive',
          onPress: () => launchClassic(difficulty),
        },
      ]);
      return;
    }
    launchClassic(difficulty);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('app.name')}</Text>

        <View style={[styles.dailyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyHeader}>
            <MaterialCommunityIcons name="calendar-star" size={26} color={colors.primary} />
            <View style={styles.dailyTitles}>
              <Text style={[styles.dailyTitle, { color: colors.text }]}>
                {t('home.dailyTitle')}
              </Text>
              <Text style={[styles.dailySubtitle, { color: colors.textMuted }]}>
                {formatHumanDate(today, i18n.language)}
              </Text>
            </View>
            {streak > 0 ? (
              <View style={styles.dailyStreak}>
                <MaterialCommunityIcons name="fire" size={20} color={colors.warning} />
                <Text style={[styles.dailyStreakValue, { color: colors.text }]}>{streak}</Text>
              </View>
            ) : null}
          </View>
          {dailyDone ? (
            <Text style={[styles.dailyDone, { color: colors.success }]}>
              {t('daily.todayDone')}
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => launchDaily(today)}
              disabled={loadingDate !== null}
              style={({ pressed }) => [
                styles.dailyCta,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {loadingDate !== null ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.dailyCtaLabel, { color: colors.onPrimary }]}>
                  {t('home.dailyPlay')}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {hasOngoingGame && game !== null ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/game')}
            style={({ pressed }) => [
              styles.continueCard,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.continueTitle, { color: colors.onPrimary }]}>
              {t('home.continueGame')}
            </Text>
            <Text style={[styles.continueSubtitle, { color: colors.onPrimary }]}>
              {t('home.continueSubtitle', {
                difficulty: t(`difficulty.${game.puzzle.difficulty}`),
                time: formatClock(elapsedMsOf(game, nowMs())),
              })}
            </Text>
          </Pressable>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('home.newGame')}</Text>
        <View style={styles.difficultyGrid}>
          {DIFFICULTIES.map((difficulty) => (
            <Pressable
              key={difficulty}
              accessibilityRole="button"
              onPress={() => startNewGame(difficulty)}
              style={({ pressed }) => [
                styles.difficultyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.difficultyLabel, { color: colors.text }]}>
                {t(`difficulty.${difficulty}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  dailyCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  dailyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dailyTitles: {
    flex: 1,
  },
  dailyTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  dailySubtitle: {
    fontSize: fontSize.caption,
  },
  dailyStreak: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  dailyStreakValue: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  dailyDone: {
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  dailyCta: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  dailyCtaLabel: {
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  continueCard: {
    borderRadius: 16,
    gap: spacing.xs,
    padding: spacing.md,
  },
  continueTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  continueSubtitle: {
    fontSize: fontSize.body,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  difficultyCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: spacing.lg,
  },
  difficultyLabel: {
    fontSize: fontSize.subtitle,
    fontWeight: '600',
  },
});
