import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { formatClock, formatHumanDate, type LocalDate } from '@/lib/dates';
import { logger } from '@/lib/logger';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { useDailyPercentile } from '../queries';

type Props = {
  date: LocalDate;
  durationMs: number;
  currentStreak: number;
};

/** Bloc affiché dans l'overlay de victoire d'un daily : percentile + partage. */
export function DailyResult({ date, durationMs, currentStreak }: Props) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const percentile = useDailyPercentile(date, true);

  const sharedPercent = percentile.data ?? 0;

  const share = (): void => {
    const message =
      sharedPercent > 0
        ? t('daily.shareMessage', {
            date: formatHumanDate(date, i18n.language),
            time: formatClock(durationMs),
            streak: currentStreak,
            percent: sharedPercent,
          })
        : t('daily.shareMessageNoPercentile', {
            date: formatHumanDate(date, i18n.language),
            time: formatClock(durationMs),
            streak: currentStreak,
          });
    Share.share({ message }).catch((error: unknown) => {
      logger.warn('partage du résultat daily impossible', error);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[styles.streak, { color: colors.text }]}>
        {t('daily.streakLine', { count: currentStreak })}
      </Text>
      {typeof percentile.data === 'number' && percentile.data > 0 ? (
        <Text style={[styles.percentile, { color: colors.textMuted }]}>
          {t('daily.percentileLine', { percent: percentile.data })}
        </Text>
      ) : null}
      <AppButton label={t('daily.share')} variant="secondary" onPress={share} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    gap: spacing.sm,
    padding: spacing.md,
  },
  streak: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    textAlign: 'center',
  },
  percentile: {
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
