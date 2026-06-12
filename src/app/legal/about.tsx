import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('legal.about.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.body, { color: colors.text }]}>
          {t('legal.about.body', { version: Constants.expoConfig?.version ?? '0.0.0' })}
        </Text>
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
