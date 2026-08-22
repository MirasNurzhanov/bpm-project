import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily } from '../theme/theme';

export default function SolidHeader({ left, right, title, subtitle, children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }, style]}>
      <View style={styles.topRow}>
        <View style={styles.side}>{left}</View>
        <View style={styles.titleWrap}>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    minWidth: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    color: colors.surface,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.primary200,
    marginTop: 2,
  },
});
