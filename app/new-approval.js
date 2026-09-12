import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../src/hooks/useFetch';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import {
  createApproval,
  updateApproval,
  getApproval,
  getApprovalTypesSimple,
} from '../src/api/approvals';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PickerModal from '../src/components/PickerModal';
import PrimaryButton from '../src/components/PrimaryButton';
import { colors, fontFamily } from '../src/theme/theme';
import { stripHtml } from '../src/utils/format';

const toId = (v) => (v && typeof v === 'object' ? (v.id ?? v.pk) : v);

export default function NewApprovalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { id: editId } = useLocalSearchParams();
  const isEdit = Boolean(editId);

  const { data: typesData } = useFetch(getApprovalTypesSimple, []);
  const { data: editProcess } = useFetch(
    () => (editId ? getApproval(editId) : Promise.resolve(null)),
    [editId]
  );
  const types = (typesData ?? []).map((t) => ({ id: t.id ?? t.pk, label: t.name ?? t.title ?? t.str }));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [type, setType] = useState(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const prefilled = useRef(false);
  useEffect(() => {
    if (!editProcess || prefilled.current) return;
    prefilled.current = true;
    setTitle(editProcess.title ?? '');
    setDescription(stripHtml(editProcess.description) || editProcess.description || '');
    if (editProcess.money_amount != null) setMoneyAmount(String(editProcess.money_amount));
    const t = editProcess.type ?? editProcess.document_type;
    if (t) setType({ id: toId(t), label: t.name ?? t.title ?? '' });
  }, [editProcess]);

  const clearFieldError = (field) => {
    setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));
  };

  const onSubmit = async () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Укажите название';
    if (!type) errors.type = 'Выберите тип процесса';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    const body = {
      title: title.trim(),
      description: description.trim(),
      type: type.id,
      money_amount: moneyAmount.trim() ? Number(moneyAmount.trim()) : null,
    };
    try {
      if (isEdit) {
        await updateApproval(editId, body);
      } else {
        await createApproval(body);
      }
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось сохранить процесс. Проверьте данные и попробуйте снова.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Отмена</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Редактирование' : 'Новый процесс'}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Название</Text>
            <TextInput
              value={title}
              onChangeText={(v) => { setTitle(v); clearFieldError('title'); }}
              placeholder="Например, Согласование договора"
              placeholderTextColor={colors.muted3}
              style={styles.input}
            />
            {fieldErrors.title ? <Text style={styles.error}>{fieldErrors.title}</Text> : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Описание</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Кратко опишите процесс"
              placeholderTextColor={colors.muted3}
              style={[styles.input, styles.multiline]}
              multiline
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Сумма</Text>
            <TextInput
              value={moneyAmount}
              onChangeText={setMoneyAmount}
              placeholder="0"
              placeholderTextColor={colors.muted3}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => { setTypePickerOpen(true); clearFieldError('type'); }}
          >
            <Ionicons name="git-network-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Тип процесса</Text>
            <Text style={[styles.pickerValue, fieldErrors.type && styles.pickerValueError]} numberOfLines={1}>
              {type?.label ?? 'Не выбран'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          label={isEdit ? 'Сохранить' : 'Создать процесс'}
          loading={submitting}
          onPress={onSubmit}
          style={styles.footerPrimary}
        />
      </View>

      <PickerModal
        visible={typePickerOpen}
        title="Выберите тип процесса"
        options={types}
        selectedId={type?.id}
        onSelect={(item) => { setType(item); setTypePickerOpen(false); }}
        onClose={() => setTypePickerOpen(false)}
      />
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
  cancel: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.muted },
  headerTitle: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted },
  input: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text, paddingVertical: 4 },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  error: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.danger },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  pickerLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  pickerValue: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted, maxWidth: 150 },
  pickerValueError: { color: colors.danger },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerPrimary: { width: '100%' },
});
