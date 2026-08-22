import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors, fontFamily } from '../src/theme/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Страница не найдена</Text>
      <Link href="/" style={styles.link}>
        На главную
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bg },
  title: { fontFamily: fontFamily.semiBold, fontSize: 17, color: colors.text },
  link: { fontFamily: fontFamily.medium, color: colors.primary },
});
