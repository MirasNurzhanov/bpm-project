import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, fontFamily } from '../theme/theme';

const TONES = {
  success: { bg: colors.success100, fg: colors.success700 },
  danger: { bg: colors.danger100, fg: colors.danger },
  accent: { bg: colors.accent100, fg: colors.accent700 },
  muted: { bg: colors.line2, fg: colors.muted },
  warning: { bg: colors.warning200, fg: colors.text2 },
};

export default function StatusPill({ label, tone = 'muted', style }) {
  const { bg, fg } = TONES[tone] ?? TONES.muted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.chip,
    paddingHorizontal: 8,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
});
