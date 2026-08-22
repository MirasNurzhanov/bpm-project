import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme/theme';

export default function SectionHeader({ title, actionLabel, onActionPress, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    color: colors.text,
  },
  action: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.primary,
  },
});
