import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { formatClock } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { MAX_MISTAKES } from '../logic';
import { useGameStore } from '../store';

type Props = {
  /** Slot pour le bloc daily (percentile + partage), branché par l'écran. */
  dailyResultSlot?: React.ReactNode;
  /** Slot pour le bouton « continuer » rewarded (E14). */
  reviveSlot?: React.ReactNode;
  /** Slot bas de carte (lien « Supprimer les pubs », E15). */
  footerSlot?: React.ReactNode;
  /** null = pas de relance proposée (ex. : daily gagné). */
  onNewGame: (() => void) | null;
  onExit: () => void;
};

export function GameOverOverlay({ dailyResultSlot, reviveSlot, footerSlot, onNewGame, onExit }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const game = useGameStore((s) => s.game);

  if (game === null || game.status === 'playing') return null;
  const won = game.status === 'won';

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: won ? colors.success : colors.danger }]}>
          {won ? t('game.over.wonTitle') : t('game.over.lostTitle')}
        </Text>
        {won ? (
          <View style={styles.statsRow}>
            <Stat label={t('game.over.time')} value={formatClock(game.elapsedMs)} />
            <Stat
              label={t('game.over.mistakes')}
              value={`${game.play.mistakes}/${MAX_MISTAKES}`}
            />
            <Stat label={t('game.over.hints')} value={String(game.hintsUsed)} />
          </View>
        ) : (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('game.over.lostSubtitle', { count: MAX_MISTAKES })}
          </Text>
        )}
        {dailyResultSlot}
        <View style={styles.buttons}>
          {!won && reviveSlot}
          {onNewGame !== null ? (
            <AppButton
              label={won ? t('game.over.newGame') : t('game.over.retry')}
              onPress={onNewGame}
            />
          ) : null}
          <AppButton label={t('game.over.backHome')} variant="ghost" onPress={onExit} />
          {footerSlot}
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: 20,
    gap: spacing.md,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 380,
  },
  title: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.caption,
  },
  buttons: {
    gap: spacing.sm,
  },
});
