import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { computeStreaks, DailyResult } from '@/features/daily';
import {
  Board,
  GameClock,
  GameOverOverlay,
  MAX_MISTAKES,
  NumberPad,
  useGameStore,
} from '@/features/game';
import { useHistoryStore, wonOnTimeDates } from '@/features/history';
import { usePuzzlesStore } from '@/features/puzzles';
import { todayLocalDate } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

export default function GameScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const game = useGameStore((s) => s.game);
  const startGame = useGameStore((s) => s.startGame);
  const pauseTimer = useGameStore((s) => s.pauseTimer);
  const resumeTimer = useGameStore((s) => s.resumeTimer);
  const clearGame = useGameStore((s) => s.clearGame);
  const takePuzzle = usePuzzlesStore((s) => s.takePuzzle);
  const records = useHistoryStore((s) => s.records);

  // passage en arrière-plan = chrono en pause
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        useGameStore.getState().pauseTimer();
      }
    });
    return () => subscription.remove();
  }, []);

  // streak affichée sur la victoire d'un daily : historique + la victoire en cours
  const dailyStreak = useMemo(() => {
    if (game === null || game.status !== 'won' || game.mode !== 'daily') return 0;
    const today = todayLocalDate();
    const dates = new Set(wonOnTimeDates(records));
    if (game.dailyDate === today) dates.add(today);
    return computeStreaks(dates, today).current;
  }, [game, records]);

  if (game === null) {
    return <Redirect href="/" />;
  }

  const isPausedOverlayVisible = game.status === 'playing' && game.runStartedAt === null;
  const won = game.status === 'won';

  const handleExitToHome = (): void => {
    clearGame();
    router.back();
  };

  const handleNewGameFromOverlay = (): void => {
    if (game.status === 'lost' || game.mode === 'daily') {
      // rejouer la même grille (défaite) ou le même défi du jour
      startGame(game.puzzle, game.mode, game.dailyDate);
      return;
    }
    startGame(takePuzzle(game.puzzle.difficulty), 'classic', null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => {
            pauseTimer();
            router.back();
          }}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {game.mode === 'daily' && game.dailyDate !== null
            ? t('game.daily', { date: game.dailyDate })
            : t(`difficulty.${game.puzzle.difficulty}`)}
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.headerInfo, { color: colors.textMuted }]}>
            {t('game.header.mistakes', { count: game.play.mistakes, max: MAX_MISTAKES })}
          </Text>
          <GameClock style={{ ...styles.headerInfo, color: colors.textMuted }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('game.header.pause')}
            onPress={pauseTimer}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="pause-circle-outline" size={26} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.boardArea}>
        <Board />
      </View>
      <NumberPad />

      {isPausedOverlayVisible ? (
        <View style={[styles.pauseBackdrop, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.pauseCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pauseTitle, { color: colors.text }]}>{t('game.pause.title')}</Text>
            <AppButton label={t('game.pause.resume')} onPress={resumeTimer} />
            <AppButton label={t('game.over.backHome')} variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      ) : null}

      <GameOverOverlay
        onNewGame={won && game.mode === 'daily' ? null : handleNewGameFromOverlay}
        onExit={handleExitToHome}
        dailyResultSlot={
          won && game.mode === 'daily' && game.dailyDate !== null ? (
            <DailyResult
              date={game.dailyDate}
              durationMs={game.elapsedMs}
              currentStreak={dailyStreak}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerInfo: {
    fontSize: fontSize.caption,
    fontVariant: ['tabular-nums'],
  },
  boardArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pauseCard: {
    borderRadius: 20,
    gap: spacing.sm,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  pauseTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    textAlign: 'center',
  },
});
