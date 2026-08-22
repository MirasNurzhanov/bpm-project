import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

export default function PriorityDots({ level = 0, max = 5, size = 6, style }) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: max }).map((_, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginRight: 3,
            backgroundColor: i < level ? colors.priority : colors.track,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
