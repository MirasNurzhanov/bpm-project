import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../src/hooks/useFetch';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { getProjects } from '../src/api/projects';
import { createTask, getTaskCreateForm, getProjectUsers } from '../src/api/tasks';
import { getTags } from '../src/api/tags';
import { buildNewFiles } from '../src/api/attachments';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PriorityBar from '../src/components/PriorityBar';
import PickerModal from '../src/components/PickerModal';
import PrimaryButton from '../src/components/PrimaryButton';
import SecondaryButton from '../src/components/SecondaryButton';
import { colors, fontFamily } from '../src/theme/theme';
import { parseRuDateTime, formatFileSize } from '../src/utils/format';

export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { data: projects } = useFetch(getProjects, []);
  const { data: createForm } = useFetch(getTaskCreateForm, []);
  const { data: tagsData } = useFetch(getTags, []);
  const availableTags = tagsData ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState(null);
  const [assignee, setAssignee] = useState(null);
  const [dueDateText, setDueDateText] = useState('');
  const [priority, setPriority] = useState(3);
  const [attachments, setAttachments] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [watchersOpen, setWatchersOpen] = useState(false);
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

  useEffect(() => {
    setAssistants([]);
    setSpectators([]);
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

  const onOpenWatchers = () => {
    if (!project) {
      Alert.alert('Выберите проект', 'Сначала выберите проект, чтобы добавить соисполнителей и наблюдателей.');
      return;
    }
    setWatchersOpen(true);
  };

  const clearFieldError = (field) => {
    setFieldErrors((errors) => (errors[field] ? { ...errors, [field]: undefined } : errors));
  };

  const submitTask = async (newFiles) => {
    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        project: project.id,
        assignee: assignee.id,
        deadline: parseRuDateTime(dueDateText) ?? undefined,
        priority,
        tags: selectedTagId ? [selectedTagId] : [],
        assistants,
        spectators,
        newFiles,
      });
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось создать задачу. Проверьте данные и попробуйте снова.'));
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

    if (!attachments.length) {
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

          <TouchableOpacity style={[styles.pickerRow, styles.border]} onPress={onOpenWatchers}>
            <Ionicons name="people-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Соисполнители и наблюдатели</Text>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {assistants.length || spectators.length
                ? `${assistants.length} · ${spectators.length}`
                : 'Не выбраны'}
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

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <SecondaryButton
          icon="attach-outline"
          iconOnly
          style={styles.footerIconButton}
          onPress={pickAttachments}
        />
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

      <Modal
        visible={watchersOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWatchersOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setWatchersOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Соисполнители и наблюдатели</Text>
            <ScrollView style={styles.modalList}>
              <Text style={styles.modalSectionLabel}>СОИСПОЛНИТЕЛИ</Text>
              {projectUsers.map((u) => (
                <TouchableOpacity
                  key={`a-${u.id}`}
                  style={styles.modalRow}
                  onPress={() => toggleAssistant(u.id)}
                >
                  <Text style={styles.modalRowLabel}>{u.label}</Text>
                  {assistants.includes(u.id) ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}

              <Text style={[styles.modalSectionLabel, styles.modalSectionSpacing]}>НАБЛЮДАТЕЛИ</Text>
              {projectUsers.map((u) => (
                <TouchableOpacity
                  key={`s-${u.id}`}
                  style={styles.modalRow}
                  onPress={() => toggleSpectator(u.id)}
                >
                  <Text style={styles.modalRowLabel}>{u.label}</Text>
                  {spectators.includes(u.id) ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}

              {!projectUsers.length ? (
                <Text style={styles.modalEmptyText}>В этом проекте нет доступных пользователей</Text>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setWatchersOpen(false)}>
              <Text style={styles.modalCloseLabel}>Готово</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(22,25,29,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 20,
    maxHeight: '75%',
  },
  modalTitle: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text, marginBottom: 8 },
  modalList: { flexGrow: 0 },
  modalSectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    marginTop: 8,
    marginBottom: 4,
  },
  modalSectionSpacing: { marginTop: 16 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalRowLabel: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  modalEmptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
    paddingVertical: 20,
    textAlign: 'center',
  },
  modalCloseButton: { paddingVertical: 14, alignItems: 'center' },
  modalCloseLabel: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.primary },
});
