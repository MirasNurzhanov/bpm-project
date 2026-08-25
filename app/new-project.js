import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { createProject, getProjectCreateForm } from '../src/api/projects';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PickerModal from '../src/components/PickerModal';
import PrimaryButton from '../src/components/PrimaryButton';
import { colors, fontFamily } from '../src/theme/theme';

export default function NewProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();

  const [form, setForm] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [company, setCompany] = useState(null);
  const [responsible, setResponsible] = useState([]);
  const [members, setMembers] = useState([]);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [responsiblePickerOpen, setResponsiblePickerOpen] = useState(false);
  const [membersPickerOpen, setMembersPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getProjectCreateForm()
      .then((data) => {
        setForm(data);
        const companyChoices = data?.form?.fields?.company?._choices ?? [];
        if (companyChoices.length === 1) {
          setCompany({ id: companyChoices[0][0], label: companyChoices[0][1] });
        }
      })
      .catch(() => {});
  }, []);

  const companyOptions = (form?.form?.fields?.company?._choices ?? []).map(([id, label]) => ({ id, label }));
  const responsibleOptions = (form?.form?.fields?.responsible?._choices ?? []).map(([id, label]) => ({ id, label }));
  const memberOptions = (form?.form?.fields?.members?._choices ?? []).map(([id, label]) => ({ id, label }));

  const clearFieldError = (field) => {
    setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));
  };

  const toggleMember = (item) => {
    setMembers((list) => (list.some((m) => m.id === item.id) ? list.filter((m) => m.id !== item.id) : [...list, item]));
    clearFieldError('members');
  };

  const toggleResponsible = (item) => {
    setResponsible((list) => (list.some((r) => r.id === item.id) ? list.filter((r) => r.id !== item.id) : [...list, item]));
    clearFieldError('responsible');
  };

  const onSlugChange = (v) => {
    setSlug(v.replace(/[^a-zA-Z0-9_-]/g, ''));
    clearFieldError('slug');
  };

  const onSubmit = async () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Укажите название проекта';
    if (!slug.trim()) errors.slug = 'Укажите короткий код проекта';
    if (!company) errors.company = 'Выберите компанию';
    if (!responsible.length) errors.responsible = 'Выберите хотя бы одного ответственного';
    if (!members.length) errors.members = 'Выберите хотя бы одного участника';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await createProject({
        name: name.trim(),
        slug: slug.trim(),
        company: company.id,
        responsible: responsible.map((r) => r.id),
        members: members.map((m) => m.id),
      });
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось создать проект. Проверьте данные и попробуйте снова.'));
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
        <Text style={styles.headerTitle}>Новый проект</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Название</Text>
            <TextInput
              value={name}
              onChangeText={(v) => { setName(v); clearFieldError('name'); }}
              placeholder="Например, Диверсификация бизнеса"
              placeholderTextColor={colors.muted3}
              style={styles.input}
            />
            {fieldErrors.name ? <Text style={styles.error}>{fieldErrors.name}</Text> : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Код проекта</Text>
            <TextInput
              value={slug}
              onChangeText={onSlugChange}
              placeholder="Например, D"
              placeholderTextColor={colors.muted3}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            {fieldErrors.slug ? (
              <Text style={styles.error}>{fieldErrors.slug}</Text>
            ) : (
              <Text style={styles.hint}>Только латинские буквы, цифры, _ и -</Text>
            )}
          </View>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => { setCompanyPickerOpen(true); clearFieldError('company'); }}
          >
            <Ionicons name="business-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Компания</Text>
            <Text style={[styles.pickerValue, fieldErrors.company && styles.pickerValueError]} numberOfLines={1}>
              {company?.label ?? 'Не выбрана'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerRow, styles.border]}
            onPress={() => setResponsiblePickerOpen(true)}
          >
            <Ionicons name="person-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Ответственные</Text>
            <Text style={[styles.pickerValue, fieldErrors.responsible && styles.pickerValueError]} numberOfLines={1}>
              {responsible.length ? responsible.map((r) => r.label).join(', ') : 'Не выбраны'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>
          {fieldErrors.responsible ? <Text style={styles.error}>{fieldErrors.responsible}</Text> : null}

          <TouchableOpacity style={[styles.pickerRow, styles.border]} onPress={() => setMembersPickerOpen(true)}>
            <Ionicons name="people-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Участники</Text>
            <Text style={[styles.pickerValue, fieldErrors.members && styles.pickerValueError]} numberOfLines={1}>
              {members.length ? members.map((m) => m.label).join(', ') : 'Не выбраны'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>
          {fieldErrors.members ? <Text style={styles.error}>{fieldErrors.members}</Text> : null}
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton label="Создать проект" loading={submitting} onPress={onSubmit} style={styles.footerPrimary} />
      </View>

      <PickerModal
        visible={companyPickerOpen}
        title="Выберите компанию"
        options={companyOptions}
        selectedId={company?.id}
        onSelect={(item) => { setCompany(item); setCompanyPickerOpen(false); }}
        onClose={() => setCompanyPickerOpen(false)}
      />

      <PickerModal
        visible={responsiblePickerOpen}
        title="Выберите ответственных"
        options={responsibleOptions}
        multiple
        selectedIds={responsible.map((r) => r.id)}
        onToggle={toggleResponsible}
        onClose={() => setResponsiblePickerOpen(false)}
      />

      <PickerModal
        visible={membersPickerOpen}
        title="Выберите участников"
        options={memberOptions}
        multiple
        selectedIds={members.map((m) => m.id)}
        onToggle={toggleMember}
        onClose={() => setMembersPickerOpen(false)}
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
  error: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.danger },
  hint: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted3 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  pickerLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  pickerValue: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted, maxWidth: 160 },
  pickerValueError: { color: colors.danger },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerPrimary: {},
});
