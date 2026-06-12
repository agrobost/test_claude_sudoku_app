import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DIGITS, hasCandidate, type CellValue } from '@/engine';
import { useThemeColors } from '@/theme/tokens';

export type CellVisualState = {
  value: CellValue;
  noteMask: number;
  isGiven: boolean;
  isSelected: boolean;
  isPeer: boolean;
  isSameDigit: boolean;
  isError: boolean;
  isHintTarget: boolean;
};

type Props = CellVisualState & {
  cell: number;
  size: number;
  onPress: (cell: number) => void;
};

function CellComponent({
  cell,
  size,
  value,
  noteMask,
  isGiven,
  isSelected,
  isPeer,
  isSameDigit,
  isError,
  isHintTarget,
  onPress,
}: Props) {
  const colors = useThemeColors();

  const background = isError
    ? colors.cellErrorBackground
    : isSelected
      ? colors.cellSelected
      : isHintTarget
        ? colors.hintHighlight
        : isSameDigit
          ? colors.cellSameDigit
          : isPeer
            ? colors.cellPeer
            : colors.cellBackground;

  const valueColor = isError ? colors.errorText : isGiven ? colors.givenText : colors.playerText;

  const row = Math.floor(cell / 9);
  const col = cell % 9;

  return (
    <Pressable
      accessibilityLabel={`r${row + 1}c${col + 1}`}
      onPress={() => onPress(cell)}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: background,
          borderColor: colors.boardLine,
          borderRightWidth: col === 8 ? 0 : col % 3 === 2 ? 0 : StyleSheet.hairlineWidth,
          borderBottomWidth: row === 8 ? 0 : row % 3 === 2 ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {value !== 0 ? (
        <Text
          allowFontScaling={false}
          style={[styles.value, { color: valueColor, fontSize: size * 0.55 }]}
        >
          {value}
        </Text>
      ) : noteMask !== 0 ? (
        <View style={styles.notesGrid}>
          {DIGITS.map((digit) => (
            <Text
              key={digit}
              allowFontScaling={false}
              style={[
                styles.note,
                {
                  color: colors.noteText,
                  fontSize: Math.max(8, size * 0.22),
                  width: size / 3 - 1,
                  height: size / 3 - 1,
                },
              ]}
            >
              {hasCandidate(noteMask, digit) ? digit : ''}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export const Cell = memo(CellComponent);

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '500',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    textAlign: 'center',
  },
});
