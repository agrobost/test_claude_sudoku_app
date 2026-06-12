import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { useGameStore } from '@/features/game';

import { adsReady, showRewardedAd } from '../ads';
import { canOfferRewarded } from '../gates';

/**
 * « Continuer (pub) » sur l'overlay de défaite : une rewarded video remet
 * le compteur d'erreurs à 2/3, une seule fois par partie (PRD §6).
 */
export function ReviveButton() {
  const { t } = useTranslation();
  const game = useGameStore((s) => s.game);

  const visible =
    game !== null && game.status === 'lost' && !game.continueUsed && canOfferRewarded(adsReady());
  if (!visible) return null;

  const onPress = (): void => {
    void showRewardedAd().then((outcome) => {
      if (outcome === 'earned') {
        useGameStore.getState().reviveAfterDefeat();
      } else if (outcome === 'unavailable') {
        Alert.alert(t('revive.unavailableTitle'), t('revive.unavailableMessage'));
      }
    });
  };

  return <AppButton label={t('revive.button')} onPress={onPress} />;
}
