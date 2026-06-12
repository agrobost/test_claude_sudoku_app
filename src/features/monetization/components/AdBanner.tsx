import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdFormat, AdView } from 'react-native-applovin-max';

import { adsReady } from '../ads';
import { BANNER_AD_UNIT_ID } from '../env';
import { canShowBanner } from '../gates';
import { useMonetizationStore } from '../store';

/**
 * Bannière de l'écran de jeu. Rendue uniquement si la pub est configurée,
 * initialisée, et que le joueur n'a pas acheté « Sans pub ».
 */
export function AdBanner() {
  const noAds = useMonetizationStore((s) => s.noAds);
  const [loaded, setLoaded] = useState(false);

  if (BANNER_AD_UNIT_ID === null || !canShowBanner({ noAds, adsReady: adsReady() })) {
    return null;
  }

  return (
    <View style={[styles.container, { height: loaded ? undefined : 0 }]}>
      <AdView
        adUnitId={BANNER_AD_UNIT_ID}
        adFormat={AdFormat.BANNER}
        adaptiveBannerEnabled
        style={styles.banner}
        onAdLoaded={() => setLoaded(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  banner: {
    height: 50,
    width: '100%',
  },
});
