import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../theme/theme';

export default function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <Ionicons name={icon} size={16} color={colors.muted} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.line },
  icon: { marginRight: 10 },
  label: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted, flex: 1 },
  value: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
});
