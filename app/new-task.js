import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../src/hooks/useFetch';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { getProjects } from '../src/api/projects';
import { createTask, getTaskCreateForm } from '../src/api/tasks';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PriorityBar from '../src/components/PriorityBar';
import PickerModal from '../src/components/PickerModal';
import PrimaryButton from '../src/components/PrimaryButton';
import SecondaryButton from '../src/components/SecondaryButton';
import { colors, fontFamily } from '../src/theme/theme';
import { parseRuDateTime } from '../src/utils/format';

// Confirmed via a real 400 response: required fields are title, description,
// project, priority (int 1-5, default 3 "Средний"), and either assignee or
// position. Assignee/position are dropdowns of real users/roles, sourced live
// from the create-form's own field metadata (this API embeds choices there).
export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { data: projects } = useFetch(getProjects, []);
  const { data: createForm } = useFetch(getTaskCreateForm, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState(null);
  const [assignee, setAssignee] = useState(null);
  const [dueDateText, setDueDateText] = useState('');
  const [priority, setPriority] = useState(3);
  const [checklist, setChecklist] = useState([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const projectOptions = (projects ?? []).map((p) => ({ id: p.id, label: p.name ?? p.title }));
  const assigneeOptions = (createForm?.form?.fields?.assignee?._choices ?? []).map(([id, label]) => ({
    id,
    label,
  }));

  const addChecklistItem = () => {
    const text = checklistDraft.trim();
    if (!text) return;
    setChecklist((list) => [...list, { id: Date.now(), text, done: false }]);
    setChecklistDraft('');
  };

  const toggleChecklistItem = (id) => {
    setChecklist((list) => list.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const clearFieldError = (field) => {
    setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));
  };

  const onSubmit = async () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Укажите название задачи';
    if (!description.trim()) errors.description = 'Добавьте описание';
    if (!project) errors.project = 'Выберите проект';
    if (!assignee) errors.assignee = 'Выберите исполнителя';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        project: project.id,
        assignee: assignee.id,
        deadline: parseRuDateTime(dueDateText) ?? undefined,
        priority,
      });
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось создать задачу. Проверьте данные и попробуйте снова.'));
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
        <Text style={styles.headerTitle}>Новая задача</Text>
        <Text style={styles.draft}>Черновик</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Название</Text>
            <TextInput
              value={title}
              onChangeText={(v) => { setTitle(v); clearFieldError('title'); }}
              placeholder="Например, Согласовать план"
              placeholderTextColor={colors.muted3}
              style={styles.input}
            />
            {fieldErrors.title ? <Text style={styles.error}>{fieldErrors.title}</Text> : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Описание</Text>
            <TextInput
              value={description}
              onChangeText={(v) => { setDescription(v); clearFieldError('description'); }}
              placeholder="Кратко опишите задачу"
              placeholderTextColor={colors.muted3}
              style={[styles.input, styles.multiline]}
              multiline
            />
            {fieldErrors.description ? <Text style={styles.error}>{fieldErrors.description}</Text> : null}
          </View>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => { setProjectPickerOpen(true); clearFieldError('project'); }}
          >
            <Ionicons name="folder-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Проект</Text>
            <Text style={[styles.pickerValue, fieldErrors.project && styles.pickerValueError]} numberOfLines={1}>
              {project?.label ?? 'Не выбран'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerRow, styles.border]}
            onPress={() => { setAssigneePickerOpen(true); clearFieldError('assignee'); }}
          >
            <Ionicons name="person-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Исполнитель</Text>
            <Text style={[styles.pickerValue, fieldErrors.assignee && styles.pickerValueError]} numberOfLines={1}>
              {assignee?.label ?? 'Не выбран'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>

          <View style={styles.pickerRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Срок исполнения</Text>
            <TextInput
              value={dueDateText}
              onChangeText={setDueDateText}
              placeholder="ДД.ММ.ГГГГ ЧЧ:ММ"
              placeholderTextColor={colors.muted3}
              style={styles.pickerInput}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Приоритет</Text>
          <PriorityBar level={priority} onChange={setPriority} style={styles.priorityBar} />
        </Card>

        <Card style={styles.card}>
          <View style={styles.checklistHeader}>
            <Text style={styles.cardTitle}>Чеклист</Text>
          </View>
          {checklist.map((item) => (
            <TouchableOpacity key={item.id} style={styles.checklistItem} onPress={() => toggleChecklistItem(item.id)}>
              <Ionicons
                name={item.done ? 'checkbox' : 'square-outline'}
                size={18}
                color={item.done ? colors.success : colors.control}
              />
              <Text style={[styles.checklistText, item.done && styles.checklistTextDone]}>{item.text}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.checklistAddRow}>
            <TextInput
              value={checklistDraft}
              onChangeText={setChecklistDraft}
              placeholder="Добавить пункт"
              placeholderTextColor={colors.muted3}
              style={styles.checklistInput}
              onSubmitEditing={addChecklistItem}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={addChecklistItem} hitSlop={8}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Вложения</Text>
          <View style={styles.dropzone}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.muted2} />
            <Text style={styles.dropzoneText}>Прикрепить файл или фото</Text>
          </View>
        </Card>

        <TouchableOpacity style={styles.watchersRow}>
          <Text style={styles.watchersLabel}>Соисполнители и наблюдатели</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <SecondaryButton icon="attach-outline" iconOnly style={styles.footerIconButton} />
        <PrimaryButton
          label="Создать задачу"
          loading={submitting}
          onPress={onSubmit}
          style={styles.footerPrimary}
        />
      </View>

      <PickerModal
        visible={projectPickerOpen}
        title="Выберите проект"
        options={projectOptions}
        selectedId={project?.id}
        onSelect={(item) => { setProject(item); setProjectPickerOpen(false); }}
        onClose={() => setProjectPickerOpen(false)}
      />

      <PickerModal
        visible={assigneePickerOpen}
        title="Выберите исполнителя"
        options={assigneeOptions}
        selectedId={assignee?.id}
        onSelect={(item) => { setAssignee(item); setAssigneePickerOpen(false); }}
        onClose={() => setAssigneePickerOpen(false)}
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
  draft: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.success },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { gap: 14 },
  cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted },
  input: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text, paddingVertical: 4 },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  error: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.danger },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  border: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  pickerLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  pickerValue: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted, maxWidth: 140 },
  pickerValueError: { color: colors.danger },
  pickerInput: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
    minWidth: 140,
  },
  priorityBar: { marginTop: 4 },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checklistText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  checklistTextDone: { textDecorationLine: 'line-through', color: colors.muted },
  checklistAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  checklistInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 14, color: colors.text },
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
  watchersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  watchersLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerIconButton: { width: 54 },
  footerPrimary: { flex: 1 },
});
