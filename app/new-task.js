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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../src/hooks/useFetch';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { getProjects } from '../src/api/projects';
import { createTask, updateTask, getTask, getTaskCreateForm, getProjectUsers } from '../src/api/tasks';
import { getTags } from '../src/api/tags';
import { buildNewFiles } from '../src/api/attachments';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PriorityBar from '../src/components/PriorityBar';
import PickerModal from '../src/components/PickerModal';
import PrimaryButton from '../src/components/PrimaryButton';
import { colors, fontFamily } from '../src/theme/theme';
import { formatFullDateTime, formatFileSize, stripHtml, userDisplayName } from '../src/utils/format';

const toId = (v) => (v && typeof v === 'object' ? (v.id ?? v.pk) : v);

export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { id: editId } = useLocalSearchParams();
  const isEdit = Boolean(editId);

  const { data: projects } = useFetch(getProjects, []);
  const { data: createForm } = useFetch(getTaskCreateForm, []);
  const { data: tagsData } = useFetch(getTags, []);
  const { data: editTask } = useFetch(
    () => (editId ? getTask(editId) : Promise.resolve(null)),
    [editId]
  );
  const availableTags = tagsData ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState(null);
  const [assignee, setAssignee] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [pickerMode, setPickerMode] = useState(null); // 'date' | 'time' | null
  const [pickerTemp, setPickerTemp] = useState(null);
  const [priority, setPriority] = useState(3);
  const [attachments, setAttachments] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [assistantPickerOpen, setAssistantPickerOpen] = useState(false);
  const [spectatorPickerOpen, setSpectatorPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const projectOptions = (projects ?? []).map((p) => ({ id: p.id, label: p.name ?? p.title }));
  const assigneeOptions = (createForm?.form?.fields?.assignee?._choices ?? []).map(([id, label]) => ({
    id,
    label,
  }));

  const { data: projectUsersData } = useFetch(
    () => (project ? getProjectUsers(project.id) : Promise.resolve([])),
    [project?.id]
  );
  const projectUsers = projectUsersData ?? [];

  // Pre-fill from the task being edited (once).
  const prefilled = useRef(false);
  useEffect(() => {
    if (!editTask || prefilled.current) return;
    prefilled.current = true;
    setTitle(editTask.title ?? '');
    setDescription(stripHtml(editTask.description) || editTask.description || '');
    if (editTask.project) {
      setProject({ id: toId(editTask.project), label: editTask.project.name ?? editTask.project.title ?? '' });
    }
    if (editTask.assignee) {
      setAssignee({ id: toId(editTask.assignee), label: userDisplayName(editTask.assignee) || '' });
    }
    if (editTask.deadline) {
      const d = new Date(editTask.deadline);
      if (!Number.isNaN(d.getTime())) setDeadline(d);
    }
    if (editTask.priority != null) {
      const p = Number(editTask.priority);
      if (Number.isFinite(p)) setPriority(p);
    }
    setSelectedTagId(toId((editTask.tags ?? [])[0]) ?? null);
    setAssistants((editTask.assistants ?? []).map(toId).filter((v) => v != null));
    setSpectators((editTask.spectators ?? []).map(toId).filter((v) => v != null));
  }, [editTask]);

  // Clear participants only when the user changes an already-set project.
  const prevProjectId = useRef();
  useEffect(() => {
    const prev = prevProjectId.current;
    prevProjectId.current = project?.id;
    if (prev !== undefined && prev !== project?.id) {
      setAssistants([]);
      setSpectators([]);
    }
  }, [project?.id]);

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

  const toggleTag = (id) => {
    setSelectedTagId((current) => (current === id ? null : id));
  };

  const toggleAssistant = (id) => {
    setAssistants((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const toggleSpectator = (id) => {
    setSpectators((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const openPeoplePicker = (setter) => {
    if (!project) {
      Alert.alert('Выберите проект', 'Сначала выберите проект, чтобы выбрать участников.');
      return;
    }
    setter(true);
  };

  const openDeadlinePicker = () => {
    setPickerTemp(deadline ?? new Date());
    setPickerMode('date');
  };

  const onDeadlineChange = (event, selected) => {
    if (event.type === 'dismissed' || !selected) {
      setPickerMode(null);
      return;
    }
    if (pickerMode === 'date') {
      setPickerTemp(selected);
      setPickerMode('time');
    } else {
      const final = new Date(pickerTemp ?? selected);
      final.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDeadline(final);
      setPickerMode(null);
    }
  };

  const clearFieldError = (field) => {
    setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));
  };

  const submitTask = async (newFiles) => {
    setSubmitting(true);
    try {
      const common = {
        title: title.trim(),
        description: description.trim(),
        project: project.id,
        assignee: assignee.id,
        deadline: deadline ? deadline.toISOString() : undefined,
        priority,
        tags: selectedTagId ? [selectedTagId] : [],
        assistants,
        spectators,
      };
      if (isEdit) {
        await updateTask(editId, {
          ...common,
          position: editTask?.position_id ?? null,
          milestone: editTask?.milestone_id ?? null,
          flag: Boolean(editTask?.flag),
          isRepeating: Boolean(editTask?.is_repeating),
          cronExpression: editTask?.cron_expression ?? '0 0 * * *',
        });
      } else {
        await createTask({ ...common, newFiles });
      }
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось сохранить задачу. Проверьте данные и попробуйте снова.'));
    } finally {
      setSubmitting(false);
    }
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

    if (isEdit || !attachments.length) {
      submitTask([]);
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
        formatApiErrorMessage(e, 'Не удалось прочитать файлы.') + '\n\nСоздать задачу без вложений?',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Создать без вложений', onPress: () => submitTask([]) },
        ]
      );
      return;
    }
    submitTask(newFiles);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Отмена</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Редактирование' : 'Новая задача'}</Text>
        <View style={{ width: 48 }} />
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

          <TouchableOpacity
            style={[styles.pickerRow, styles.border]}
            onPress={() => openPeoplePicker(setAssistantPickerOpen)}
          >
            <Ionicons name="people-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Соисполнители</Text>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {assistants.length ? `Выбрано: ${assistants.length}` : 'Не выбраны'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerRow, styles.border]}
            onPress={() => openPeoplePicker(setSpectatorPickerOpen)}
          >
            <Ionicons name="eye-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Наблюдатели</Text>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {spectators.length ? `Выбрано: ${spectators.length}` : 'Не выбраны'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerRow} onPress={openDeadlinePicker}>
            <Ionicons name="calendar-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Срок исполнения</Text>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {deadline ? formatFullDateTime(deadline) : 'Не задан'}
            </Text>
            {deadline ? (
              <TouchableOpacity onPress={() => setDeadline(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.muted3} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
            )}
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Приоритет</Text>
          <PriorityBar level={priority} onChange={setPriority} style={styles.priorityBar} />
        </Card>

        {availableTags.length ? (
          <Card style={styles.card}>
            <Text style={styles.fieldLabel}>Тэги</Text>
            <View style={styles.tagRow}>
              {availableTags.map((t) => {
                const id = t.id ?? t.pk;
                const on = selectedTagId === id;
                const tagColor = t.color || colors.primary;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => toggleTag(id)}
                    activeOpacity={0.7}
                    style={[
                      styles.tagChip,
                      { borderColor: tagColor },
                      on && { backgroundColor: tagColor },
                    ]}
                  >
                    <View style={[styles.tagDot, { backgroundColor: on ? colors.surface : tagColor }]} />
                    <Text style={[styles.tagChipText, on && styles.tagChipTextOn]} numberOfLines={1}>
                      {t.title ?? t.str}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        ) : null}

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

      {pickerMode ? (
        <DateTimePicker
          value={pickerTemp ?? new Date()}
          mode={pickerMode}
          is24Hour
          onChange={onDeadlineChange}
        />
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          label={isEdit ? 'Сохранить' : 'Создать задачу'}
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

      <PickerModal
        visible={assistantPickerOpen}
        title="Соисполнители"
        options={projectUsers}
        multiple
        selectedIds={assistants}
        onToggle={(item) => toggleAssistant(item.id)}
        onClose={() => setAssistantPickerOpen(false)}
      />

      <PickerModal
        visible={spectatorPickerOpen}
        title="Наблюдатели"
        options={projectUsers}
        multiple
        selectedIds={spectators}
        onToggle={(item) => toggleSpectator(item.id)}
        onClose={() => setSpectatorPickerOpen(false)}
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
  cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted },
  input: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text, paddingVertical: 4 },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  error: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.danger },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  border: { borderTopWidth: 1, borderColor: colors.line },
  pickerLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  pickerValue: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted, maxWidth: 150 },
  pickerValueError: { color: colors.danger },
  priorityBar: { marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    borderWidth: 1.5,
    maxWidth: '100%',
  },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagChipText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  tagChipTextOn: { color: colors.surface },
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
