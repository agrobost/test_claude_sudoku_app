import { useEffect, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

import { formatClock, nowMs } from '@/lib/dates';

import { elapsedMsOf, useGameStore } from '../store';

/** Chrono isolé : seul ce composant se re-rend chaque seconde. */
export function GameClock({ style }: { style?: TextStyle }) {
  const game = useGameStore((s) => s.game);
  const [, forceTick] = useState(0);

  const running = game !== null && game.status === 'playing' && game.runStartedAt !== null;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  if (game === null) return null;
  return (
    <Text allowFontScaling={false} style={style}>
      {formatClock(elapsedMsOf(game, nowMs()))}
    </Text>
  );
}
