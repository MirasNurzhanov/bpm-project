import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radii, fontFamily } from '../theme/theme';

export default function FilterChip({ label, active, onPress, style }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.text : colors.fill, borderColor: active ? colors.text : colors.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.surface : colors.chipText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
});
