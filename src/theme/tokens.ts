import { useColorScheme } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  caption: 12,
  body: 15,
  subtitle: 17,
  title: 22,
  hero: 28,
  cellValue: 24,
  cellNote: 9,
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  success: string;
  danger: string;
  warning: string;
  border: string;
  boardLine: string;
  boardLineBold: string;
  cellBackground: string;
  cellSelected: string;
  cellPeer: string;
  cellSameDigit: string;
  cellErrorBackground: string;
  givenText: string;
  playerText: string;
  errorText: string;
  noteText: string;
  hintHighlight: string;
  backdrop: string;
};

export const lightColors: ThemeColors = {
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF1F7',
  text: '#1A2433',
  textMuted: '#6B7686',
  primary: '#2C6BED',
  onPrimary: '#FFFFFF',
  success: '#1F9D55',
  danger: '#D64545',
  warning: '#C77B0A',
  border: '#D8DEE8',
  boardLine: '#C3CBD8',
  boardLineBold: '#5B6575',
  cellBackground: '#FFFFFF',
  cellSelected: '#C9DCFF',
  cellPeer: '#E8EFFB',
  cellSameDigit: '#D9E6FF',
  cellErrorBackground: '#FADADA',
  givenText: '#1A2433',
  playerText: '#2C6BED',
  errorText: '#D64545',
  noteText: '#6B7686',
  hintHighlight: '#FFE9B8',
  backdrop: 'rgba(12, 18, 28, 0.55)',
};

export const darkColors: ThemeColors = {
  background: '#0F141C',
  surface: '#1A212C',
  surfaceAlt: '#232C3A',
  text: '#E8EDF5',
  textMuted: '#93A0B4',
  primary: '#5B8DEF',
  onPrimary: '#0F141C',
  success: '#3FBF77',
  danger: '#E2706A',
  warning: '#E0A93E',
  border: '#2E394A',
  boardLine: '#37425A',
  boardLineBold: '#8B98AE',
  cellBackground: '#1A212C',
  cellSelected: '#2E4A7A',
  cellPeer: '#222E42',
  cellSameDigit: '#2A3E63',
  cellErrorBackground: '#56282C',
  givenText: '#E8EDF5',
  playerText: '#8FB3F7',
  errorText: '#E2706A',
  noteText: '#93A0B4',
  hintHighlight: '#5C4A1E',
  backdrop: 'rgba(0, 0, 0, 0.6)',
};

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
