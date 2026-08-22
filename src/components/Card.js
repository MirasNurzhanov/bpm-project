import { View, StyleSheet } from 'react-native';
import { colors, radii } from '../theme/theme';

export default function Card({ children, style, leftAccent }) {
  return (
    <View
      style={[
        styles.card,
        leftAccent && { borderLeftWidth: 4, borderLeftColor: leftAccent },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    shadowColor: '#16191d',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
