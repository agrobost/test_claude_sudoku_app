import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Difficulty } from '@/engine';
import { elapsedMsOf, useGameStore } from '@/features/game';
import { usePuzzlesStore } from '@/features/puzzles';
import { formatClock, nowMs } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const startGame = useGameStore((s) => s.startGame);
  const takePuzzle = usePuzzlesStore((s) => s.takePuzzle);

  const hasOngoingGame = game !== null && game.status === 'playing';

  const launchClassic = (difficulty: Difficulty): void => {
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
