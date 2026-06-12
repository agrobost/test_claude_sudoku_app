import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/tokens';

export default function DailyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <Text style={{ color: colors.textMuted }}>{t('common.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
