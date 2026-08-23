import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_API_BASE_URL } from '../src/api/serverUrl';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { colors, fontFamily } from '../src/theme/theme';

const URL_PATTERN = /^https?:\/\/.+/i;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!URL_PATTERN.test(url.trim())) {
      setError('Введите корректный адрес, начинающийся с http:// или https://');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setApiBaseUrl(url);
      // The current session cookie belongs to the old server and is
      // meaningless on a new one — force a fresh login rather than leaving
      // the app in a half-authenticated state against the wrong backend.
      // logout() itself swallows network failures (e.g. new URL unreachable),
      // so it always resolves and this just always proceeds to the login screen.
      await logout();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки сервера.');
    } finally {
      setSaving(false);
    }
  };

  const onResetDefault = () => {
    setUrl(DEFAULT_API_BASE_URL);
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Базовый URL сервера</Text>
          <TextInput
            value={url}
            onChangeText={(v) => { setUrl(v); if (error) setError(null); }}
            placeholder={DEFAULT_API_BASE_URL}
            placeholderTextColor={colors.muted3}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={onResetDefault}>
            <Text style={styles.resetLink}>Сбросить по умолчанию</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.hint}>
          Смена сервера потребует повторного входа — текущая сессия привязана к предыдущему адресу.
        </Text>

        <PrimaryButton label="Сохранить настройки" loading={saving} onPress={onSave} style={styles.saveButton} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text },
  body: { padding: 16, gap: 16 },
  card: { gap: 8 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border2,
    paddingVertical: 8,
  },
  error: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.danger },
  resetLink: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary, marginTop: 4 },
  hint: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted, lineHeight: 18 },
  saveButton: { marginTop: 4 },
});
