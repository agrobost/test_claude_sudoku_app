import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useGameStore } from '@/features/game';
import { todayLocalDate } from '@/lib/dates';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { adsReady, showRewardedAd } from '../ads';
import { canOfferRewarded } from '../gates';
import { hintsRemaining, normalizeQuota } from '../hintQuota';
import { useMonetizationStore } from '../store';

/**
 * Bouton « indice » de l'écran de jeu : consomme le quota du jour,
 * puis propose une rewarded video pour en débloquer un de plus.
 */
export function HintButton() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const hintQuota = useMonetizationStore((s) => s.hintQuota);
  const today = todayLocalDate();
  const remaining = hintsRemaining(normalizeQuota(hintQuota, today));
  const gameActive = useGameStore((s) => s.game?.status === 'playing');

  const spendOneHint = (): void => {
    const hint = useGameStore.getState().requestHint();
    if (hint !== null) {
      useMonetizationStore.getState().consumeHintToday(today);
    }
  };

  const offerRewardedHint = (): void => {
    if (!canOfferRewarded(adsReady())) {
      Alert.alert(t('hints.noneLeftTitle'), t('hints.noneLeftNoAds'));
      return;
    }
    Alert.alert(t('hints.noneLeftTitle'), t('hints.rewardedOffer'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('hints.rewardedConfirm'),
        onPress: () => {
          void showRewardedAd().then((outcome) => {
            if (outcome === 'earned') {
              useMonetizationStore.getState().grantBonusHintToday(today);
              spendOneHint();
            } else if (outcome === 'unavailable') {
              Alert.alert(t('hints.noneLeftTitle'), t('hints.rewardedUnavailable'));
            }
          });
        },
      },
    ]);
  };

  const onPress = (): void => {
    if (!gameActive) return;
    if (remaining > 0) {
      spendOneHint();
    } else {
      offerRewardedHint();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('hints.button')}
      onPress={onPress}
      disabled={!gameActive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color={colors.warning} />
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.label, { color: colors.textMuted }]}
      >
        {t('hints.button')} · {remaining}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    flexBasis: 0,
    flexDirection: 'row',
    flexGrow: 1,
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  label: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
});
