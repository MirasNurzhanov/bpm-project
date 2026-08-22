import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

export default function ProgressBar({ progress = 0, color = colors.success, style }) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
