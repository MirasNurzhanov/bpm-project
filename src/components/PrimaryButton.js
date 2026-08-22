import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fontFamily } from '../theme/theme';

export default function PrimaryButton({ label, onPress, loading, disabled, icon, style, tone = 'success' }) {
  const bg = tone === 'danger' ? colors.danger : colors.success;
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, { backgroundColor: bg, opacity: isDisabled ? 0.6 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          {icon ? <Ionicons name={icon} size={18} color={colors.surface} style={styles.icon} /> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    color: colors.surface,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
  icon: { marginLeft: 8 },
});
