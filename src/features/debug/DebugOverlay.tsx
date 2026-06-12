import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useGameStore } from '@/features/game';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { DebugPanel } from './DebugPanel';
import { debugMenuEnabled } from './enabled';

/**
 * Accès debug GLOBAL : bouton flottant monté dans le layout racine, qui ouvre
 * le panneau en Modal par-dessus l'écran courant (aucune navigation, l'état de
 * l'écran sous-jacent est intact). Rendu nul hors dev build.
 */
export function DebugOverlay() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  if (!debugMenuEnabled) return null;

  const openPanel = (): void => {
    // chrono gelé pendant le debug : les durées de test restent honnêtes
    useGameStore.getState().pauseTimer();
    setOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('debug.entry')}
        onPress={openPanel}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
            opacity: pressed ? 1 : 0.6,
          },
        ]}
      >
        <MaterialCommunityIcons name="bug-outline" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        {/* un Modal natif vit dans sa propre fenêtre : les insets du provider
            racine ne s'y appliquent pas, il faut un SafeAreaProvider dédié */}
        <SafeAreaProvider>
          <SafeAreaView
            style={[styles.modal, { backgroundColor: colors.background }]}
            edges={['top', 'bottom']}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('debug.title')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('debug.common.close')}
                hitSlop={12}
                onPress={() => setOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>
            <DebugPanel />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 4,
    top: '42%',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
  },
});
