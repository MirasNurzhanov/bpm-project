import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { ApiError } from '../../src/api/client';
import { getApiBaseUrl } from '../../src/api/serverUrl';
import GradientHeader from '../../src/components/GradientHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, fontFamily } from '../../src/theme/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 400 || e.status === 401)) {
        setError('Неверный логин или пароль');
      } else if (e instanceof ApiError) {
        setError(`Ошибка сервера (${e.status}). Проверьте адрес сервера.`);
      } else {
        setError('Нет связи с сервером. Проверьте адрес сервера и соединение.');
      }
      if (__DEV__) console.log('[login] failed', e?.status, e?.message, getApiBaseUrl());
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <GradientHeader>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>7</Text>
          </View>
          <Text style={styles.wordmark}>SevenDS</Text>
          <Text style={styles.tagline}>Задачи, проекты и процессы вашей компании — в кармане</Text>
        </GradientHeader>

        <View style={styles.form}>
          <Text style={styles.heading}>Вход в систему</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Логин</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="vitaliy.f"
              placeholderTextColor={colors.muted3}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Пароль</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                placeholderTextColor={colors.muted3}
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember((v) => !v)}>
              <View style={[styles.toggle, remember && styles.toggleOn]}>
                <View style={[styles.thumb, remember && styles.thumbOn]} />
              </View>
              <Text style={styles.rememberLabel}>Запомнить</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Войти"
            icon="arrow-forward"
            loading={loading}
            disabled={!canSubmit}
            onPress={onSubmit}
            style={styles.submit}
          />

          <TouchableOpacity
            style={styles.serverButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <View style={styles.serverIcon}>
              <Ionicons name="server-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.serverTextGroup}>
              <Text style={styles.serverButtonLabel}>Сменить сервер</Text>
              <Text style={styles.serverButtonUrl} numberOfLines={1}>{getApiBaseUrl()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </TouchableOpacity>

          <Text style={styles.footer}>© 2026 SevenDS</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.surface },
  wordmark: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.surface },
  tagline: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.primary200, lineHeight: 20 },
  form: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40, gap: 20 },
  heading: { fontFamily: fontFamily.semiBold, fontSize: 20, color: colors.text },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border2,
    paddingVertical: 10,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 22,
    backgroundColor: colors.control,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.success },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
  thumbOn: { alignSelf: 'flex-end' },
  rememberLabel: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text2 },
  error: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.danger },
  submit: { marginTop: 4 },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.fill,
  },
  serverIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverTextGroup: { flex: 1, gap: 2 },
  serverButtonLabel: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  serverButtonUrl: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  footer: { textAlign: 'center', fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted3, marginTop: 8 },
});
