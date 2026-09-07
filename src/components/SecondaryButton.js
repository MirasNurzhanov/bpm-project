import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fontFamily } from '../theme/theme';

export default function SecondaryButton({ label, onPress, icon, iconOnly, style, disabled, loading, tone = 'primary' }) {
  const fg = tone === 'danger' ? colors.danger : colors.primary700;
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        tone === 'danger' && { borderColor: colors.danger200 },
        iconOnly && styles.iconOnly,
        { opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          {!iconOnly && label ? <Text style={[styles.label, { color: fg }]}>{label}</Text> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.primary200,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  iconOnly: {
    width: 54,
    height: 54,
    paddingHorizontal: 0,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
});
