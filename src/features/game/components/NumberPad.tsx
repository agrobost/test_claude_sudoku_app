import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DIGITS } from '@/engine';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { digitCounts } from '../logic';
import { useGameStore } from '../store';

type ActionProps = {
  icon: 'undo' | 'eraser' | 'pencil-outline' | 'pencil';
  label: string;
  active?: boolean;
  onPress: () => void;
};

function ActionButton({ icon, label, active = false, onPress }: ActionProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: active ? colors.primary : colors.surfaceAlt, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={active ? colors.onPrimary : colors.text}
      />
      <Text style={[styles.actionLabel, { color: active ? colors.onPrimary : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function NumberPad() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const cells = useGameStore((s) => s.game?.play.cells);
  const notesMode = useGameStore((s) => s.game?.notesMode ?? false);
  const inputDigit = useGameStore((s) => s.inputDigit);
  const erase = useGameStore((s) => s.erase);
  const undo = useGameStore((s) => s.undo);
  const toggleNotesMode = useGameStore((s) => s.toggleNotesMode);

  const counts = cells === undefined ? null : digitCounts(cells);

  return (
    <View style={styles.container}>
      <View style={styles.digitsRow}>
        {DIGITS.map((digit) => {
          const exhausted = (counts?.get(digit) ?? 0) >= 9;
          return (
            <Pressable
              key={digit}
              accessibilityRole="button"
              accessibilityLabel={t('game.pad.digit', { digit })}
              onPress={() => inputDigit(digit)}
              disabled={exhausted}
              style={({ pressed }) => [
                styles.digit,
                { backgroundColor: colors.surfaceAlt, opacity: exhausted ? 0.3 : pressed ? 0.6 : 1 },
              ]}
            >
              <Text allowFontScaling={false} style={[styles.digitText, { color: colors.primary }]}>
                {digit}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actionsRow}>
        <ActionButton icon="undo" label={t('game.pad.undo')} onPress={undo} />
        <ActionButton icon="eraser" label={t('game.pad.erase')} onPress={erase} />
        <ActionButton
          icon={notesMode ? 'pencil' : 'pencil-outline'}
          label={t('game.pad.notes')}
          active={notesMode}
          onPress={toggleNotesMode}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  digitsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  digit: {
    alignItems: 'center',
    borderRadius: 10,
    flexGrow: 1,
    flexBasis: 0,
    justifyContent: 'center',
    maxWidth: 52,
    paddingVertical: 10,
  },
  digitText: {
    fontSize: 26,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  action: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
});
