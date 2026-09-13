import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
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
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { useFetch } from '../src/hooks/useFetch';
import { getApprovalTypes, createApprovalType } from '../src/api/approvals';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import SettingsRow from '../src/components/SettingsRow';
import PrimaryButton from '../src/components/PrimaryButton';
import { LoadingState, ErrorState, EmptyState } from '../src/components/AsyncState';
import { colors, fontFamily } from '../src/theme/theme';

export default function ApprovalTypesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { user } = useAuth();

  const { data, loading, error, refetch } = useFetch(getApprovalTypes, []);
  const types = data ?? [];
  const companyId = user?.companies?.[0]?.id ?? user?.company_id ?? null;

  const [name, setName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(false);
  const [subjectRequired, setSubjectRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!companyId) {
      Alert.alert('Ошибка', 'Не удалось определить вашу компанию.');
      return;
    }
    setSaving(true);
    try {
      await createApprovalType({
        name: trimmed,
        company: companyId,
        paymentStatus,
        subjectRequired,
        jobsPositions: [],
      });
      setName('');
      setPaymentStatus(false);
      setSubjectRequired(false);
      await refetch();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось создать тип процесса.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Типы процессов</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.addCard}>
          <Text style={styles.cardTitle}>Новый тип</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Название типа процесса"
            placeholderTextColor={colors.muted3}
            style={styles.input}
          />
          <SettingsRow
            icon="cash-outline"
            label="Требуется сумма (payment_status)"
            toggle={paymentStatus}
            onToggle={() => setPaymentStatus((v) => !v)}
          />
          <SettingsRow
            icon="document-text-outline"
            label="Обязателен предмет (subject_required)"
            toggle={subjectRequired}
            onToggle={() => setSubjectRequired((v) => !v)}
            last
          />
          <PrimaryButton label="Добавить" icon="add" loading={saving} disabled={!name.trim()} onPress={onAdd} />
        </Card>

        <Text style={styles.sectionLabel}>ВСЕ ТИПЫ{types.length ? ` · ${types.length}` : ''}</Text>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message="Не удалось загрузить типы процессов" onRetry={refetch} />
        ) : types.length === 0 ? (
          <EmptyState message="Типов пока нет" icon="git-network-outline" />
        ) : (
          <Card style={styles.listCard}>
            {types.map((t, i) => (
              <View key={t.id ?? t.pk ?? i} style={[styles.typeRow, i > 0 && styles.typeRowBorder]}>
                <Text style={styles.typeName} numberOfLines={1}>{t.name ?? t.str}</Text>
                <View style={styles.typeBadges}>
                  {t.payment_status ? (
                    <View style={styles.badge}><Text style={styles.badgeText}>Сумма</Text></View>
                  ) : null}
                  {t.subject_required ? (
                    <View style={styles.badge}><Text style={styles.badgeText}>Предмет</Text></View>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
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
  body: { padding: 16, gap: 12 },
  addCard: { gap: 12 },
  cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border2,
    paddingVertical: 8,
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    marginTop: 8,
    marginLeft: 4,
  },
  listCard: { paddingVertical: 4 },
  typeRow: { paddingVertical: 12, gap: 8 },
  typeRowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  typeName: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  typeBadges: { flexDirection: 'row', gap: 6 },
  badge: {
    backgroundColor: colors.fill,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fontFamily.medium, fontSize: 11, color: colors.chipText },
});
