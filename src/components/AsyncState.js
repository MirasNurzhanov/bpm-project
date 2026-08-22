import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../theme/theme';
import SecondaryButton from './SecondaryButton';

export function LoadingState({ style }) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorState({ message = 'Не удалось загрузить данные', onRetry, style }) {
  return (
    <View style={[styles.center, style]}>
      <Ionicons name="cloud-offline-outline" size={32} color={colors.muted2} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <SecondaryButton label="Повторить" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

export function EmptyState({ message = 'Здесь пока пусто', icon = 'file-tray-outline', style }) {
  return (
    <View style={[styles.center, style]}>
      <Ionicons name={icon} size={32} color={colors.muted2} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  message: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    marginTop: 4,
    paddingHorizontal: 24,
  },
});
