import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ label, onPress, variant = 'primary', disabled = false, style }: Props) {
  const colors = useThemeColors();
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.surfaceAlt
          : 'transparent';
  const labelColor =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'ghost'
        ? colors.primary
        : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
