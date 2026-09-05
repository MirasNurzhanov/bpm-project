import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../../src/hooks/useFetch';
import { useAuth } from '../../src/hooks/useAuth';
import { useRequireAuth } from '../../src/hooks/useRequireAuth';
import {
  getTask,
  getTaskAttachments,
  updateTaskStatus,
  createComment,
  getComments,
  toggleTaskFavorite,
  getProjectUsers,
} from '../../src/api/tasks';
import { getTags } from '../../src/api/tags';
import { ApiError, formatApiErrorMessage } from '../../src/api/client';
import SolidHeader from '../../src/components/SolidHeader';
import Card from '../../src/components/Card';
import StatusPill from '../../src/components/StatusPill';
import PriorityDots from '../../src/components/PriorityDots';
import Avatar from '../../src/components/Avatar';
import InfoRow from '../../src/components/InfoRow';
import ProgressBar from '../../src/components/ProgressBar';
import PrimaryButton from '../../src/components/PrimaryButton';
import SecondaryButton from '../../src/components/SecondaryButton';
import { LoadingState, ErrorState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';
import { taskStatusInfo, nextStatusAction } from '../../src/utils/taskStatus';
import { taskPriorityLevel, priorityLabel } from '../../src/utils/priority';
import { formatDateTime, formatRelative, formatFileSize, userDisplayName, stripHtml } from '../../src/utils/format';

function attachmentUrl(a) {
  return (
    a?.file?.url ??
    (typeof a?.file === 'string' ? a.file : null) ??
    a?.url ??
    a?.file_url ??
    a?.download_url ??
    a?.link ??
    a?.href ??
    null
  );
}

function attachmentName(a) {
  return a?.file?.name ?? a?.name ?? a?.file_name ?? a?.title ?? 'Файл';
}

function attachmentThumb(a) {
  return a?.thumbnail?.url ?? null;
}

// `assistants`/`spectators`/`tags` may come back as full objects or bare ids
// depending on the serializer; resolve ids against a lookup map either way.
function resolveLabel(item, byId, fallbackLabel) {
  if (item && typeof item === 'object') return fallbackLabel(item);
  const found = byId.get(item) ?? byId.get(Number(item));
  return found ? fallbackLabel(found) : `#${item}`;
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  useRequireAuth();
  const { data: task, loading, error, refetch } = useFetch(() => getTask(id), [id]);
  const { data: commentsData, refetch: refetchComments } = useFetch(() => getComments(id), [id]);
  const { data: attachmentsData } = useFetch(() => getTaskAttachments(id), [id]);
  const taskProjectId = task?.project_id ?? task?.project?.id ?? null;
  const { data: projectUsersData } = useFetch(
    () => (taskProjectId ? getProjectUsers(taskProjectId) : Promise.resolve([])),
    [taskProjectId]
  );
  const { data: tagsData } = useFetch(getTags, []);

  const [statusPending, setStatusPending] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [pendingComments, setPendingComments] = useState([]);
  const [favOverride, setFavOverride] = useState(null);
  const [favPending, setFavPending] = useState(false);

  if (loading) return <LoadingState style={{ flex: 1 }} />;
  if (error || !task) {
    return (
      <View style={styles.flex}>
        <ErrorState message="Не удалось загрузить задачу" onRetry={refetch} style={{ flex: 1 }} />
      </View>
    );
  }

  const usersById = new Map((projectUsersData ?? []).map((u) => [u.id, u]));
  const tagsById = new Map((tagsData ?? []).map((t) => [t.id ?? t.pk, t]));
  const assistantsList = (task.assistants ?? []).map((p) =>
    resolveLabel(p, usersById, (o) => userDisplayName(o) || o.label || o.username || `#${o.id ?? o.pk}`)
  );
  const spectatorsList = (task.spectators ?? []).map((p) =>
    resolveLabel(p, usersById, (o) => userDisplayName(o) || o.label || o.username || `#${o.id ?? o.pk}`)
  );
  const taskTags = (task.tags ?? []).map((t) => {
    if (t && typeof t === 'object') return t;
    return tagsById.get(t) ?? tagsById.get(Number(t)) ?? { id: t, title: `#${t}` };
  });

  if (__DEV__) {
    console.log(
      '[task] assistants/spectators/tags raw ->',
      JSON.stringify({ assistants: task.assistants, spectators: task.spectators, tags: task.tags })
    );
  }

  const status = taskStatusInfo(task);
  const code = task.slug ?? `#${task.id}`;
  const projectName = task.project?.name ?? '';
  const authorName = userDisplayName(task.initiator) || '—';
  const assigneeName = userDisplayName(task.assignee) || '—';
  const checklist = task.checklist ?? task.checklist_items ?? [];
  const checklistDone = checklist.filter((c) => c.done ?? c.is_done ?? c.completed).length;
  const attachments = attachmentsData ?? [];
  const comments = [...(commentsData ?? []), ...pendingComments];
  const action = nextStatusAction(task);
  const isAssignee = typeof task.assignee === 'object' && task.assignee?.id === user?.id;
  const canTransition = Boolean(action) && isAssignee;
  const isFav = favOverride === null ? Boolean(task.is_favs) : favOverride;

  const onToggleFav = async () => {
    if (favPending || !user?.id) return;
    const next = !isFav;
    setFavOverride(next);
    setFavPending(true);
    try {
      await toggleTaskFavorite(task.id, user.id);
    } catch (e) {
      setFavOverride(!next);
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось изменить избранное.'));
    } finally {
      setFavPending(false);
    }
  };

  const onTakeAction = async () => {
    if (!action) return;
    setStatusPending(true);
    try {
      await updateTaskStatus(task.id, action.next);
      await refetch();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось изменить статус задачи. Попробуйте ещё раз.'));
    } finally {
      setStatusPending(false);
    }
  };

  const onOpenAttachment = async (a) => {
    const url = attachmentUrl(a);
    if (!url) {
      Alert.alert('Файл недоступен', 'Для этого вложения не пришла ссылка на файл.');
      return;
    }
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('cannot open');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть файл.');
    }
  };

  const onSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText('');

    const pendingId = `pending-${Date.now()}`;
    setPendingComments((list) => [
      ...list,
      { id: pendingId, author: user, text: `<p>${text}</p>`, created_at: new Date().toISOString() },
    ]);

    const clearPending = () => setPendingComments((list) => list.filter((c) => c.id !== pendingId));

    try {
      await createComment(task.id, text);
      await refetchComments();
      clearPending();
    } catch (e) {
      if (e instanceof ApiError && e.status === 500) {
        await refetchComments();
        clearPending();
      } else {
        clearPending();
        Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось отправить комментарий.'));
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SolidHeader
        left={
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </TouchableOpacity>
        }
        right={
          <>
            <TouchableOpacity hitSlop={8} onPress={onToggleFav} disabled={favPending}>
              <Ionicons
                name={isFav ? 'star' : 'star-outline'}
                size={20}
                color={isFav ? colors.warning200 : colors.surface}
              />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.surface} />
            </TouchableOpacity>
          </>
        }
      >
        <View style={styles.codeRow}>
          <Text style={styles.code}>{code}</Text>
          <StatusPill label={status.label} tone={status.tone} />
        </View>
        <Text style={styles.title}>{task.title}</Text>
        {(projectName || task.deadline) ? (
          <Text style={styles.subtitle}>
            {projectName}
            {projectName && task.deadline ? ' · ' : ''}
            {task.deadline ? formatDateTime(task.deadline) : ''}
          </Text>
        ) : null}
      </SolidHeader>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body}>
        {task.description ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Описание</Text>
            <Text style={styles.description}>{stripHtml(task.description)}</Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <InfoRow icon="person-outline" label="Автор" value={authorName} />
          <InfoRow icon="person-circle-outline" label="Исполнитель" value={assigneeName} />
          <InfoRow icon="calendar-outline" label="Создано" value={formatDateTime(task.create_date)} />
          <View style={[styles.row, styles.priorityRow]}>
            <Ionicons name="flag-outline" size={16} color={colors.muted} style={{ marginRight: 10 }} />
            <Text style={styles.label}>Приоритет</Text>
            <View style={styles.priorityValue}>
              <PriorityDots level={taskPriorityLevel(task)} />
              <Text style={styles.value}>{task.priority ?? priorityLabel(taskPriorityLevel(task))}</Text>
            </View>
          </View>
          {taskTags.length ? (
            <View style={styles.tagsRow}>
              {taskTags.map((t, i) => (
                <View key={t.id ?? t.pk ?? i} style={[styles.tagChip, { borderColor: t.color || colors.border }]}>
                  <View style={[styles.tagDot, { backgroundColor: t.color || colors.muted3 }]} />
                  <Text style={styles.tagChipText}>{t.title ?? t.str ?? t.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {assistantsList.length || spectatorsList.length ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Соисполнители и наблюдатели</Text>
            {assistantsList.length ? (
              <InfoRow
                icon="people-outline"
                label="Соисполнители"
                value={assistantsList.join(', ')}
                last={!spectatorsList.length}
              />
            ) : null}
            {spectatorsList.length ? (
              <InfoRow icon="eye-outline" label="Наблюдатели" value={spectatorsList.join(', ')} last />
            ) : null}
          </Card>
        ) : null}

        {checklist.length ? (
          <Card style={styles.card}>
            <View style={styles.checklistHeader}>
              <Text style={styles.cardTitle}>Чеклист</Text>
              <Text style={styles.checklistCount}>{checklistDone} из {checklist.length}</Text>
            </View>
            <ProgressBar progress={(checklistDone / checklist.length) * 100} style={styles.checklistProgress} />
            {checklist.map((item, i) => (
              <View key={item.id ?? i} style={styles.checklistItem}>
                <Ionicons
                  name={item.done ?? item.is_done ?? item.completed ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={item.done ?? item.is_done ?? item.completed ? colors.success : colors.control}
                />
                <Text
                  style={[
                    styles.checklistText,
                    (item.done ?? item.is_done ?? item.completed) && styles.checklistTextDone,
                  ]}
                >
                  {item.text ?? item.title}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {attachments.length ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Вложения · {attachments.length}</Text>
            {attachments.map((a, i) => {
              const meta = [formatFileSize(a.size), formatDateTime(a.created_at ?? a.uploaded_at)]
                .filter(Boolean)
                .join(' · ');
              const thumb = attachmentThumb(a);
              return (
                <TouchableOpacity
                  key={a.id ?? a.pk ?? i}
                  style={styles.attachmentRow}
                  onPress={() => onOpenAttachment(a)}
                  activeOpacity={0.7}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.attachmentThumb} />
                  ) : (
                    <Ionicons name="document-attach-outline" size={18} color={colors.muted} />
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>{attachmentName(a)}</Text>
                    {meta ? <Text style={styles.attachmentMeta}>{meta}</Text> : null}
                  </View>
                  <Ionicons name="download-outline" size={18} color={colors.muted} />
                </TouchableOpacity>
              );
            })}
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Комментарии · {comments.length}</Text>
          {comments.map((c, i) => (
            <View key={c.id ?? i} style={styles.commentRow}>
              <Avatar name={userDisplayName(c.author)} size={28} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeaderRow}>
                  <Text style={styles.commentAuthor}>{userDisplayName(c.author)}</Text>
                  <Text style={styles.commentTime}>{formatRelative(c.created_at ?? c.create_date)}</Text>
                </View>
                <Text style={styles.commentText}>{stripHtml(c.text ?? c.body)}</Text>
              </View>
            </View>
          ))}

          <View style={styles.composerRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Написать комментарий"
              placeholderTextColor={colors.muted3}
              style={styles.composerInput}
              multiline
            />
            <TouchableOpacity onPress={onSendComment} disabled={!commentText.trim()} hitSlop={8}>
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() ? colors.primary : colors.muted3}
              />
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <SecondaryButton icon="create-outline" iconOnly style={styles.footerIconButton} />
        {canTransition ? (
          <PrimaryButton
            label={action.ctaLabel}
            icon="checkmark"
            loading={statusPending}
            onPress={onTakeAction}
            style={styles.footerPrimary}
          />
        ) : action ? (
          <View style={[styles.footerPrimary, styles.footerHint]}>
            <Text style={styles.footerHintText}>Доступно только исполнителю задачи</Text>
          </View>
        ) : (
          <View style={styles.footerPrimary} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary200 },
  title: { fontFamily: fontFamily.semiBold, fontSize: 19, color: colors.surface },
  subtitle: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.primary200 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { gap: 8 },
  cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  description: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text2, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  priorityRow: { paddingVertical: 12 },
  label: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted, flex: 1 },
  value: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  priorityValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  tagDot: { width: 7, height: 7, borderRadius: 3.5 },
  tagChipText: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.text },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checklistCount: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted },
  checklistProgress: { marginBottom: 4 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checklistText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  checklistTextDone: { textDecorationLine: 'line-through', color: colors.muted },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  attachmentThumb: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.fill },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  attachmentMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  commentRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  commentBody: { flex: 1, gap: 2 },
  commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  commentAuthor: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  commentTime: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  commentText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text2 },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  composerInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text,
    maxHeight: 80,
  },
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
  footerHint: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHintText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },
});
