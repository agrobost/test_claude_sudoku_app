import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { parseGrid, PEERS, type CellRef } from '@/engine';
import { useThemeColors } from '@/theme/tokens';

import { useGameStore } from '../store';

import { Cell } from './Cell';

type Props = {
  /** Cases mises en avant par l'indice courant (E14). */
  hintCells?: readonly CellRef[];
};

export function Board({ hintCells }: Props) {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const game = useGameStore((s) => s.game);
  const selectCell = useGameStore((s) => s.selectCell);

  const puzzle = game?.puzzle;
  const givens = useMemo(() => (puzzle === undefined ? null : parseGrid(puzzle.givens)), [puzzle]);
  const solution = useMemo(
    () => (puzzle === undefined ? null : parseGrid(puzzle.solution)),
    [puzzle],
  );

  if (game === null || givens === null || solution === null) return null;

  const boardSize = Math.floor(Math.min(width - 16, height * 0.52, 440));
  const cellSize = boardSize / 9;
  const selected = game.selectedCell;
  const selectedValue = selected === null ? 0 : game.play.cells[selected];
  const peers = selected === null ? null : PEERS[selected];
  const hintSet = hintCells === undefined ? null : new Set(hintCells);

  return (
    <View
      style={[
        styles.board,
        { width: boardSize, height: boardSize, borderColor: colors.boardLineBold },
      ]}
    >
      {Array.from({ length: 9 }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: 9 }, (_, col) => {
            const cell = row * 9 + col;
            const value = game.play.cells[cell] ?? 0;
            return (
              <Cell
                key={cell}
                cell={cell}
                size={cellSize}
                value={value}
                noteMask={game.play.notes[cell] ?? 0}
                isGiven={givens[cell] !== 0}
                isSelected={selected === cell}
                isPeer={peers !== null && peers.includes(cell)}
                isSameDigit={value !== 0 && value === selectedValue && selected !== cell}
                isError={value !== 0 && value !== solution[cell]}
                isHintTarget={hintSet !== null && hintSet.has(cell)}
                onPress={selectCell}
              />
            );
          })}
        </View>
      ))}
      {[1, 2].map((i) => (
        <View
          key={`v${i}`}
          pointerEvents="none"
          style={[
            styles.separator,
            {
              backgroundColor: colors.boardLineBold,
              left: (boardSize / 3) * i - 1,
              top: 0,
              width: 2,
              height: boardSize,
            },
          ]}
        />
      ))}
      {[1, 2].map((i) => (
        <View
          key={`h${i}`}
          pointerEvents="none"
          style={[
            styles.separator,
            {
              backgroundColor: colors.boardLineBold,
              top: (boardSize / 3) * i - 1,
              left: 0,
              height: 2,
              width: boardSize,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  separator: {
    position: 'absolute',
  },
});
