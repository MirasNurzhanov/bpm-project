import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../theme/theme';

export default function SettingsRow({ icon, label, value, toggle, onToggle, onPress, last }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} style={[styles.row, !last && styles.border]} activeOpacity={onPress ? 0.6 : 1}>
      <Ionicons name={icon} size={18} color={colors.muted} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      {toggle !== undefined ? (
        <TouchableOpacity onPress={onToggle} style={[styles.toggle, toggle && styles.toggleOn]}>
          <View style={[styles.thumb, toggle && styles.thumbOn]} />
        </TouchableOpacity>
      ) : (
        <>
          {value !== undefined ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
        </>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 6 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.line },
  icon: { marginRight: 6 },
  label: { flex: 1, fontFamily: fontFamily.regular, fontSize: 14, color: colors.text },
  value: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted, maxWidth: 150 },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 22,
    backgroundColor: colors.control,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.success },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface },
  thumbOn: { alignSelf: 'flex-end' },
});
