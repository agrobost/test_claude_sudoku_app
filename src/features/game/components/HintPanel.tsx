import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { colOf, rowOf, type Hint, type Unit } from '@/engine';
import { fontSize, spacing, useThemeColors } from '@/theme/tokens';

import { useGameStore } from '../store';

function cellLabel(cell: number): string {
  return `L${rowOf(cell) + 1}C${colOf(cell) + 1}`;
}

/** Panneau d'explication de l'indice courant (technique, cases, action). */
export function HintPanel() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const hint = useGameStore((s) => s.hint);
  const applyCurrentHint = useGameStore((s) => s.applyCurrentHint);
  const dismissHint = useGameStore((s) => s.dismissHint);

  if (hint === null) return null;

  const { title, body } = describeHint(hint, t);

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>
      <View style={styles.buttons}>
        <AppButton label={t('hints.apply')} onPress={applyCurrentHint} style={styles.grow} />
        <AppButton
          label={t('hints.close')}
          variant="secondary"
          onPress={dismissHint}
          style={styles.grow}
        />
      </View>
    </View>
  );
}

type Translate = ReturnType<typeof useTranslation>['t'];

function unitLabel(unit: Unit | null, t: Translate): string {
  if (unit === null) return '';
  if (unit.kind === 'row') return t('hints.unit.row', { index: unit.index + 1 });
  if (unit.kind === 'col') return t('hints.unit.col', { index: unit.index + 1 });
  return t('hints.unit.box', { index: unit.index + 1 });
}

function describeHint(hint: Hint, t: Translate): { title: string; body: string } {
  if (hint.kind === 'wrongCell') {
    return {
      title: t('hints.wrongCell.title'),
      body: t('hints.wrongCell.body', { cell: cellLabel(hint.cell) }),
    };
  }
  if (hint.kind === 'revealCell') {
    return {
      title: t('hints.revealCell.title'),
      body: t('hints.revealCell.body', { cell: cellLabel(hint.cell), digit: hint.digit }),
    };
  }
  const digits = hint.digits.join(t('hints.digitsSeparator'));
  const cells = hint.cells.map(cellLabel).join(', ');
  const unit = unitLabel(hint.unit, t);
  const params = { digits, cells, unit };
  switch (hint.technique) {
    case 'nakedSingle':
      return { title: t('hints.nakedSingle.title'), body: t('hints.nakedSingle.body', params) };
    case 'hiddenSingle':
      return { title: t('hints.hiddenSingle.title'), body: t('hints.hiddenSingle.body', params) };
    case 'nakedPair':
      return { title: t('hints.nakedPair.title'), body: t('hints.nakedPair.body', params) };
    case 'hiddenPair':
      return { title: t('hints.hiddenPair.title'), body: t('hints.hiddenPair.body', params) };
    case 'pointing':
      return { title: t('hints.pointing.title'), body: t('hints.pointing.body', params) };
    case 'claiming':
      return { title: t('hints.claiming.title'), body: t('hints.claiming.body', params) };
  }
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  body: {
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  grow: {
    flex: 1,
  },
});
