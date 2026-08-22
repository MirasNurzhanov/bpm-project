import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme/theme';

export default function StatRow({ stats, style }) {
  return (
    <View style={[styles.row, style]}>
      {stats.map((s, i) => (
        <View key={i} style={styles.box}>
          <Text style={[styles.count, s.color && { color: s.color }]}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  box: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  count: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.surface },
  label: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.primary200, textAlign: 'center' },
});
