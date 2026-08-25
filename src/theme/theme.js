export const colors = {
  primary: '#0e9cdb',
  primary700: '#0b86bd',
  primary800: '#0b7fb4',
  primary200: '#d6e6ef',
  primary50: '#e6f4fb',
  accent: '#4cc3d9',
  accent700: '#0d8ba3',
  accent200: '#cfe9f2',
  accent100: '#e6f6fa',

  success: '#2ec46b',
  success700: '#1d9a55',
  success100: '#e8f7ee',
  danger: '#d0453b',
  danger200: '#f0d9d7',
  danger100: '#fdeceb',
  warning: '#f5a623',
  warning200: '#ffd28a',
  priority: '#2563eb',

  text: '#16191d',
  text2: '#3d4753',
  muted: '#6b7684',
  muted2: '#8a95a3',
  muted3: '#9aa4b1',
  chipText: '#5a6572',
  surface: '#ffffff',
  bg: '#f4f7fa',
  fill: '#f7f9fb',
  canvas: '#eceff3',
  line: '#e8edf2',
  line2: '#f0f3f7',
  line3: '#eef2f6',
  border: '#e3e9ef',
  border2: '#d8dee6',
  track: '#dfe4ea',
  control: '#cfd6de',
  chevron: '#c3cbd4',
  dash: '#cfd9e2',
};

export const shadows = {
  card: 'rgba(22,25,29,0.04)',
  success: 'rgba(46,196,107,0.28)',
  successStrong: 'rgba(46,196,107,0.35)',
  focus: 'rgba(14,156,219,0.12)',
};

export const radii = {
  card: 14,
  control: 12,
  chip: 6,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
};

export const toneColors = {
  success: colors.success,
  danger: colors.danger,
  accent: colors.accent,
  warning: colors.warning,
  muted: colors.muted3,
};

export const fontFamily = {
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  semiBold: 'Rubik_600SemiBold',
  bold: 'Rubik_700Bold',
};

const theme = { colors, shadows, radii, spacing, fontFamily, toneColors };
export default theme;
