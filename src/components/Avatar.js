import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme/theme';

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

export default function Avatar({ name, size = 28, color = colors.primary, background = colors.primary50, style }) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, borderColor: color },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4, color }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  initials: {
    fontFamily: fontFamily.semiBold,
  },
});
