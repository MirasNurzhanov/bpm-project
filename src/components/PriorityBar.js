import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme/theme';
import { PRIORITY_LABELS } from '../utils/priority';

export default function PriorityBar({ level = 0, max = 5, onChange, style }) {
  return (
    <View style={style}>
      <View style={styles.row}>
        {Array.from({ length: max }).map((_, i) => {
          const segLevel = i + 1;
          const filled = segLevel <= level;
          return (
            <TouchableOpacity
              key={i}
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={() => onChange?.(segLevel)}
              style={[
                styles.segment,
                {
                  backgroundColor: filled ? colors.priority : colors.track,
                  marginRight: i === max - 1 ? 0 : 4,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.label}>{PRIORITY_LABELS[level] ?? PRIORITY_LABELS[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  label: { marginTop: 8, fontFamily: fontFamily.medium, fontSize: 13, color: colors.text2 },
});
