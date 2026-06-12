import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { logger } from '@/lib/logger';
import { type LocalDate } from '@/lib/dates';

import { useGameStore } from '../game';

import { fetchDailyPuzzle } from './queries';

/** Lance le défi d'une date : confirme l'abandon d'une partie en cours, charge la grille, navigue. */
export function useLaunchDaily(): {
  launchDaily: (date: LocalDate) => void;
  loadingDate: LocalDate | null;
} {
  const { t } = useTranslation();
  const router = useRouter();
  const [loadingDate, setLoadingDate] = useState<LocalDate | null>(null);

  const start = async (date: LocalDate): Promise<void> => {
    setLoadingDate(date);
    try {
      const puzzle = await fetchDailyPuzzle(date);
      const store = useGameStore.getState();
      if (store.game !== null && store.game.status === 'playing') {
        store.abandonGame();
      }
      store.startGame(puzzle, 'daily', date);
      router.push('/game');
    } catch (error) {
      logger.warn(`lancement du daily ${date} impossible`, error);
      Alert.alert(t('daily.unavailableTitle'), t('daily.unavailableMessage'));
    } finally {
      setLoadingDate(null);
    }
  };

  const launchDaily = (date: LocalDate): void => {
    const { game } = useGameStore.getState();
    if (game !== null && game.status === 'playing') {
      Alert.alert(t('home.replace.title'), t('home.replace.message'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('home.replace.confirm'), style: 'destructive', onPress: () => void start(date) },
      ]);
      return;
    }
    void start(date);
  };

  return { launchDaily, loadingDate };
}
