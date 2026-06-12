import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { DebugPanel } from './DebugPanel';

/** Route /debug : le panneau avec un en-tête de navigation classique. */
export function DebugScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={12}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('debug.title')}</Text>
      </View>
      <DebugPanel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '800',
  },
});
