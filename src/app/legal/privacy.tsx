import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('legal.privacy.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.body, { color: colors.text }]}>{t('legal.privacy.body')}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  body: {
    fontSize: fontSize.body,
    lineHeight: 22,
  },
});
