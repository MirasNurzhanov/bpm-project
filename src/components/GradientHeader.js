import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/theme';

export default function GradientHeader({ children, style }) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primary800]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.header, style]}
    >
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 64,
    paddingHorizontal: 28,
    paddingBottom: 46,
  },
  content: {
    gap: 12,
  },
});
