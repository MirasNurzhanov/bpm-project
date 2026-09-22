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
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../src/hooks/useFetch';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import {
  createApproval,
  updateApproval,
  getApproval,
  getApprovalTypes,
  getApprovalCreateForm,
} from '../src/api/approvals';
import { buildNewFiles } from '../src/api/attachments';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PickerModal from '../src/components/PickerModal';
import PrimaryButton from '../src/components/PrimaryButton';
import { colors, fontFamily } from '../src/theme/theme';
import { stripHtml, formatFileSize } from '../src/utils/format';

const toId = (v) => (v && typeof v === 'object' ? (v.id ?? v.pk) : v);

export default function NewApprovalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { id: editId } = useLocalSearchParams();
  const isEdit = Boolean(editId);

  const { data: typesData } = useFetch(getApprovalTypes, []);
  const { data: createForm } = useFetch(getApprovalCreateForm, []);
  const { data: editProcess } = useFetch(
    () => (editId ? getApproval(editId) : Promise.resolve(null)),
    [editId]
  );
  const types = (typesData ?? []).map((t) => ({ id: t.id ?? t.pk, label: t.name ?? t.title ?? t.str }));
  const currencyOptions = (createForm?.form?.fields?.currency?._choices ?? []).map(([id, label]) => ({
    id,
    label,
  }));
  const subjectOptions = (createForm?.form?.fields?.subject?._choices ?? []).map(([id, label]) => ({
    id,
    label,
  }));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [type, setType] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [subject, setSubject] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // The selected type tells us whether currency/subject are actually needed
  // for this kind of process (payment_status / subject_required flags).
  // String-compare ids: they've come back as different types (number vs
  // string) across endpoints elsewhere in this app.
  const selectedTypeRaw = (typesData ?? []).find(
    (t) => type?.id != null && String(t.id ?? t.pk) === String(type.id)
  );
  const needsCurrency = Boolean(selectedTypeRaw?.payment_status);
  const needsSubject = Boolean(selectedTypeRaw?.subject_required);

  if (__DEV__ && type) {
    console.log(
      '[new-approval] selected type id =', type.id, typeof type.id,
      '| matched =', Boolean(selectedTypeRaw),
      '| payment_status =', selectedTypeRaw?.payment_status,
      '| subject_required =', selectedTypeRaw?.subject_required,
      '| raw type ids =', (typesData ?? []).map((t) => [t.id ?? t.pk, typeof (t.id ?? t.pk)])
    );
  }

  const prefilled = useRef(false);
  useEffect(() => {
    if (!editProcess || prefilled.current) return;
    prefilled.current = true;
    setTitle(editProcess.title ?? '');
    setDescription(stripHtml(editProcess.description) || editProcess.description || '');
    if (editProcess.money_amount != null) setMoneyAmount(String(editProcess.money_amount));
    const t = editProcess.doc_type ?? editProcess.type ?? editProcess.document_type;
    if (t) setType({ id: toId(t), label: t.name ?? t.title ?? '' });
    const c = editProcess.currency;
    if (c) setCurrency({ id: toId(c), label: c.name ?? c.title ?? '' });
    const s = editProcess.subject;
    if (s) setSubject({ id: toId(s), label: s.name ?? s.title ?? '' });
  }, [editProcess]);

  // Only one currency exists right now — pick it automatically once it's
  // needed, instead of making the user open a single-option picker.
  useEffect(() => {
    if (needsCurrency && !currency && currencyOptions.length === 1) {
      setCurrency(currencyOptions[0]);
    }
  }, [needsCurrency, currency, currencyOptions]);

  const clearFieldError = (field) => {
    setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));
  };

  const pickAttachments = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      setAttachments((list) => [
        ...list,
        ...res.assets.map((a) => ({
          key: `${a.name}-${a.size ?? 0}-${a.lastModified ?? Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: a.name,
          size: a.size,
          mimeType: a.mimeType,
          uri: a.uri,
          file: a.file,
        })),
      ]);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть выбор файлов.');
    }
  };

  const removeAttachment = (key) => {
    setAttachments((list) => list.filter((a) => a.key !== key));
  };

  const submitApproval = async (newFiles) => {
    setSubmitting(true);
    const body = {
      title: title.trim(),
      description: description.trim(),
      doc_type: type.id,
      money_amount: moneyAmount.trim() ? Number(moneyAmount.trim()) : null,
      currency: currency?.id ?? null,
      subject: subject?.id ?? null,
      new_files: newFiles,
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

  const onSubmit = async () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Укажите название';
    if (!type) errors.type = 'Выберите тип процесса';
    if (needsCurrency && !currency) errors.currency = 'Выберите валюту';
    if (needsSubject && !subject) errors.subject = 'Выберите контрагента';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (isEdit || !attachments.length) {
      submitApproval(null);
      return;
    }

    setSubmitting(true);
    let newFiles;
    try {
      newFiles = await buildNewFiles(attachments);
    } catch (e) {
      setSubmitting(false);
      Alert.alert(
        'Вложения не загрузились',
        formatApiErrorMessage(e, 'Не удалось прочитать файлы.') + '\n\nСоздать процесс без вложений?',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Создать без вложений', onPress: () => submitApproval(null) },
        ]
      );
      return;
    }
    submitApproval(newFiles);
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

          {needsCurrency ? (
            <TouchableOpacity
              style={[styles.pickerRow, styles.border]}
              onPress={() => { setCurrencyPickerOpen(true); clearFieldError('currency'); }}
            >
              <Ionicons name="cash-outline" size={18} color={colors.muted} />
              <Text style={styles.pickerLabel}>Валюта</Text>
              <Text style={[styles.pickerValue, fieldErrors.currency && styles.pickerValueError]} numberOfLines={1}>
                {currency?.label ?? 'Не выбрана'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
            </TouchableOpacity>
          ) : null}

          {needsSubject ? (
            <TouchableOpacity
              style={[styles.pickerRow, styles.border]}
              onPress={() => { setSubjectPickerOpen(true); clearFieldError('subject'); }}
            >
              <Ionicons name="business-outline" size={18} color={colors.muted} />
              <Text style={styles.pickerLabel}>Контрагент</Text>
              <Text style={[styles.pickerValue, fieldErrors.subject && styles.pickerValueError]} numberOfLines={1}>
                {subject?.label ?? 'Не выбран'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
            </TouchableOpacity>
          ) : null}
        </Card>

        {!isEdit ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>
              Вложения{attachments.length ? ` · ${attachments.length}` : ''}
            </Text>
            {attachments.map((a) => (
              <View key={a.key} style={styles.attachmentRow}>
                <Ionicons name="document-outline" size={18} color={colors.muted} />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>{a.name}</Text>
                  {formatFileSize(a.size) ? (
                    <Text style={styles.attachmentMeta}>{formatFileSize(a.size)}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => removeAttachment(a.key)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.muted3} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.dropzone} onPress={pickAttachments} activeOpacity={0.7}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.muted2} />
              <Text style={styles.dropzoneText}>Прикрепить файл</Text>
            </TouchableOpacity>
          </Card>
        ) : null}
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

      <PickerModal
        visible={currencyPickerOpen}
        title="Выберите валюту"
        options={currencyOptions}
        selectedId={currency?.id}
        onSelect={(item) => { setCurrency(item); setCurrencyPickerOpen(false); }}
        onClose={() => setCurrencyPickerOpen(false)}
      />

      <PickerModal
        visible={subjectPickerOpen}
        title="Выберите контрагента"
        options={subjectOptions}
        selectedId={subject?.id}
        onSelect={(item) => { setSubject(item); setSubjectPickerOpen(false); }}
        onClose={() => setSubjectPickerOpen(false)}
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
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  border: { borderTopWidth: 1, borderColor: colors.line },
  pickerLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  pickerValue: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted, maxWidth: 150 },
  pickerValueError: { color: colors.danger },
  cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dash,
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  dropzoneText: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  attachmentMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerPrimary: { width: '100%' },
});
