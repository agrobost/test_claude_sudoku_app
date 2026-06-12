import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { type PurchasesPackage } from 'react-native-purchases';

import { AppButton } from '@/components/AppButton';
import {
  getNoAdsPackage,
  iapConfigured,
  purchaseNoAds,
  restorePurchases,
  useMonetizationStore,
} from '@/features/monetization';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const noAds = useMonetizationStore((s) => s.noAds);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getNoAdsPackage().then((found) => {
      setPkg(found);
      setLoading(false);
    });
  }, []);

  const buy = (): void => {
    if (pkg === null) return;
    setBusy(true);
    void purchaseNoAds(pkg).then((result) => {
      setBusy(false);
      if (result.ok) {
        Alert.alert(t('paywall.thanksTitle'), t('paywall.thanksMessage'), [
          { text: t('common.ok'), onPress: () => router.back() },
        ]);
      } else if (result.reason === 'failed') {
        Alert.alert(t('paywall.errorTitle'), t('paywall.errorMessage'));
      }
    });
  };

  const restore = (): void => {
    setBusy(true);
    void restorePurchases().then((result) => {
      setBusy(false);
      if (result.ok) {
        Alert.alert(t('paywall.restoredTitle'), t('paywall.thanksMessage'), [
          { text: t('common.ok'), onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('paywall.restoreFailedTitle'), t('paywall.restoreFailedMessage'));
      }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: true,
          title: t('paywall.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="movie-off-outline" size={56} color={colors.primary} />
        <Text style={[styles.headline, { color: colors.text }]}>{t('paywall.headline')}</Text>

        <View style={styles.bullets}>
          <Bullet text={t('paywall.bullet1')} />
          <Bullet text={t('paywall.bullet2')} />
          <Bullet text={t('paywall.bullet3')} />
        </View>

        {noAds ? (
          <Text style={[styles.active, { color: colors.success }]}>{t('paywall.alreadyActive')}</Text>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : pkg !== null ? (
          <AppButton
            label={t('paywall.buy', { price: pkg.product.priceString })}
            onPress={buy}
            disabled={busy}
          />
        ) : (
          <Text style={[styles.unavailable, { color: colors.textMuted }]}>
            {iapConfigured() ? t('paywall.offerUnavailable') : t('paywall.notConfigured')}
          </Text>
        )}

        {!noAds ? (
          <AppButton
            label={t('paywall.restore')}
            variant="ghost"
            onPress={restore}
            disabled={busy || loading}
          />
        ) : null}

        <Text style={[styles.fineprint, { color: colors.textMuted }]}>
          {t('paywall.fineprint')}
        </Text>
      </View>
    </>
  );
}

function Bullet({ text }: { text: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.bulletRow}>
      <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
      <Text style={[styles.bulletText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  headline: {
    fontSize: fontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  bullets: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  bulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.body,
  },
  active: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  unavailable: {
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  fineprint: {
    fontSize: fontSize.caption,
    marginTop: 'auto',
    textAlign: 'center',
  },
});
