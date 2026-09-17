import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFetch } from '../../src/hooks/useFetch';
import { useAuth } from '../../src/hooks/useAuth';
import { useRequireAuth } from '../../src/hooks/useRequireAuth';
import {
  getApproval,
  getStageHistory,
  getApprovalAttachments,
  updateApprovalStatus,
  decideStage,
  revokeStageDecision,
  deleteApprovals,
} from '../../src/api/approvals';
import { formatApiErrorMessage } from '../../src/api/client';
import { attachmentUrl, attachmentName, attachmentThumb } from '../../src/utils/attachmentDisplay';
import SolidHeader from '../../src/components/SolidHeader';
import Card from '../../src/components/Card';
import StatusPill from '../../src/components/StatusPill';
import InfoRow from '../../src/components/InfoRow';
import Avatar from '../../src/components/Avatar';
import PrimaryButton from '../../src/components/PrimaryButton';
import SecondaryButton from '../../src/components/SecondaryButton';
import RichText from '../../src/components/RichText';
import { LoadingState, ErrorState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';
import {
  approvalStatusInfo,
  approvalStatusId,
  APPROVAL_DRAFT,
  APPROVAL_PENDING,
  APPROVAL_REJECTED,
} from '../../src/utils/approvalStatus';
import { formatDateTime, formatFileSize, formatMoney, userDisplayName } from '../../src/utils/format';

function stageDecisionLabel(h) {
  if (h?.approve_bool === true) return { label: 'Одобрено', tone: 'success' };
  if (h?.approve_bool === false) return { label: 'Отклонено', tone: 'danger' };
  const decision = h?.decision ?? h?.status;
  if (decision === true || decision === 'approved') return { label: 'Одобрено', tone: 'success' };
  if (decision === false || decision === 'rejected') return { label: 'Отклонено', tone: 'danger' };
  return { label: 'Ожидает', tone: 'muted' };
}

function stageActor(h) {
  return h?.user ?? h?.approver ?? h?.actor ?? null;
}

function stageLabel(h, i) {
  return h?.stage?.name ?? h?.position_name ?? h?.stage_name ?? h?.position?.name ?? `Этап ${h?.order_num ?? i + 1}`;
}

function stageIdOf(h) {
  return h?.stage_id ?? h?.stage?.id ?? h?.id ?? h?.pk ?? null;
}

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  useRequireAuth();

  const { data: process, loading, error, refetch } = useFetch(() => getApproval(id), [id]);
  const { data: historyData, refetch: refetchHistory } = useFetch(() => getStageHistory(id), [id]);
  const { data: attachmentsData } = useFetch(() => getApprovalAttachments(id), [id]);

  const [comment, setComment] = useState('');
  const [decisionPending, setDecisionPending] = useState(null); // 'approve' | 'reject' | null
  const [statusPending, setStatusPending] = useState(false);
  const [revokePending, setRevokePending] = useState(false);

  const didMount = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (didMount.current) {
        refetch();
        refetchHistory();
      } else {
        didMount.current = true;
      }
    }, [refetch, refetchHistory])
  );

  if (loading) return <LoadingState style={{ flex: 1 }} />;
  if (error || !process) {
    return (
      <View style={styles.flex}>
        <ErrorState message="Не удалось загрузить процесс" onRetry={refetch} style={{ flex: 1 }} />
      </View>
    );
  }

  const history = historyData ?? [];
  const attachments = attachmentsData ?? [];
  const statusId = approvalStatusId(process);
  const status = approvalStatusInfo(process);
  const code = process.slug ?? `#${process.id ?? process.pk}`;
  const typeName = process.doc_type?.name ?? process.type?.name ?? process.document_type?.name ?? '';
  const initiatorName = userDisplayName(process.initiator) || '—';
  const isInitiator =
    (process.initiator?.id ?? process.initiator?.pk ?? process.initiator_id) === user?.id;
  const money = formatMoney(process.money_amount);

  if (__DEV__) {
    console.log('[approval] process keys ->', Object.keys(process).join(', '));
    console.log('[approval] stage history raw ->', JSON.stringify(history).slice(0, 3000));
  }

  // The process itself points at its current stage (confirmed from the
  // create-form's instance dict: current_stage_object_id) — prefer that over
  // guessing from the last stage_history entry.
  const currentStage = history[history.length - 1] ?? null;
  const currentStageId = process.current_stage_object_id ?? stageIdOf(currentStage);
  // For revoke, the specific rejected stage matters more than "current" (the
  // process's current_stage may already be cleared once rejected) — prefer
  // the history entry, fall back to current_stage_object_id.
  const rejectedStage = [...history].reverse().find((h) => stageDecisionLabel(h).label === 'Отклонено');
  const rejectedStageId = stageIdOf(rejectedStage) ?? process.current_stage_object_id;

  const onSendToApproval = async () => {
    setStatusPending(true);
    try {
      await updateApprovalStatus(process.id ?? process.pk, APPROVAL_PENDING);
      await refetch();
      await refetchHistory();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось отправить на согласование.'));
    } finally {
      setStatusPending(false);
    }
  };

  const onRecall = () => {
    Alert.alert(
      'Отозвать процесс',
      'Процесс вернётся в черновики, история согласования будет очищена. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отозвать',
          style: 'destructive',
          onPress: async () => {
            setStatusPending(true);
            try {
              await updateApprovalStatus(process.id ?? process.pk, APPROVAL_DRAFT);
              await refetch();
              await refetchHistory();
            } catch (e) {
              Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось отозвать процесс.'));
            } finally {
              setStatusPending(false);
            }
          },
        },
      ]
    );
  };

  const onDelete = () => {
    Alert.alert('Удалить процесс', `Удалить «${process.title ?? process.str}»?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteApprovals([process.id ?? process.pk]);
            router.back();
          } catch (e) {
            Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось удалить процесс.'));
          }
        },
      },
    ]);
  };

  const onDecide = async (approve) => {
    if (!currentStageId) {
      Alert.alert('Ошибка', 'Не удалось определить текущий этап согласования.');
      return;
    }
    setDecisionPending(approve ? 'approve' : 'reject');
    try {
      await decideStage(process.id ?? process.pk, { stageId: currentStageId, approve, comment });
      setComment('');
      await refetch();
      await refetchHistory();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось сохранить решение.'));
    } finally {
      setDecisionPending(null);
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

  const onRevoke = async () => {
    if (!rejectedStageId) return;
    setRevokePending(true);
    try {
      await revokeStageDecision(process.id ?? process.pk, rejectedStageId);
      await refetch();
      await refetchHistory();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось отозвать решение.'));
    } finally {
      setRevokePending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SolidHeader
        style={styles.headerCompact}
        left={
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </TouchableOpacity>
        }
        right={
          isInitiator ? (
            <TouchableOpacity
              hitSlop={8}
              onPress={() => router.push({ pathname: '/new-approval', params: { id: process.id ?? process.pk } })}
            >
              <Ionicons name="create-outline" size={20} color={colors.surface} />
            </TouchableOpacity>
          ) : null
        }
      >
        <View style={styles.codeRow}>
          <Text style={styles.code}>{code}</Text>
          <StatusPill label={status.label} tone={status.tone} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{process.title ?? process.str}</Text>
      </SolidHeader>

      <ScrollView style={styles.flex} contentContainerStyle={styles.body}>
        {process.description ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Описание</Text>
            <RichText html={process.description} />
          </Card>
        ) : null}

        <Card style={styles.card}>
          {typeName ? <InfoRow icon="pricetags-outline" label="Тип" value={typeName} /> : null}
          <InfoRow icon="person-outline" label="Автор" value={initiatorName} />
          <InfoRow icon="calendar-outline" label="Создано" value={formatDateTime(process.create_date)} />
          {money ? <InfoRow icon="cash-outline" label="Сумма" value={money} /> : null}
        </Card>

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

        {history.length ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>История согласования</Text>
            {history.map((h, i) => {
              const decision = stageDecisionLabel(h);
              const actor = stageActor(h);
              return (
                <View key={h.id ?? h.pk ?? i} style={styles.stageRow}>
                  <Avatar name={userDisplayName(actor)} uri={actor?.photo?.url} size={28} />
                  <View style={styles.stageBody}>
                    <View style={styles.stageHeaderRow}>
                      <Text style={styles.stageName} numberOfLines={1}>{stageLabel(h, i)}</Text>
                      <StatusPill label={decision.label} tone={decision.tone} />
                    </View>
                    {actor ? <Text style={styles.stageActor}>{userDisplayName(actor)}</Text> : null}
                    {h.comment ? <Text style={styles.stageComment}>{h.comment}</Text> : null}
                    {(h.create_date ?? h.date) ? (
                      <Text style={styles.stageDate}>{formatDateTime(h.create_date ?? h.date)}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}
      </ScrollView>

      {statusId === APPROVAL_DRAFT && isInitiator ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton
            label="Отправить на согласование"
            loading={statusPending}
            onPress={onSendToApproval}
            style={styles.footerBtn}
          />
          <SecondaryButton
            label="Удалить"
            tone="danger"
            onPress={onDelete}
            style={styles.footerBtn}
          />
        </View>
      ) : statusId === APPROVAL_PENDING ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Комментарий (необязательно)"
            placeholderTextColor={colors.muted3}
            style={styles.commentInput}
            multiline
          />
          <View style={styles.footerRow}>
            <PrimaryButton
              label="Одобрить"
              loading={decisionPending === 'approve'}
              disabled={decisionPending != null}
              onPress={() => onDecide(true)}
              style={styles.footerBtn}
            />
            <PrimaryButton
              label="Отклонить"
              tone="danger"
              loading={decisionPending === 'reject'}
              disabled={decisionPending != null}
              onPress={() => onDecide(false)}
              style={styles.footerBtn}
            />
          </View>
          {isInitiator ? (
            <SecondaryButton
              label="Отозвать"
              tone="danger"
              loading={statusPending}
              disabled={decisionPending != null}
              onPress={onRecall}
              style={styles.footerBtn}
            />
          ) : null}
        </View>
      ) : statusId === APPROVAL_REJECTED && rejectedStageId ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <SecondaryButton
            label="Отозвать решение"
            loading={revokePending}
            onPress={onRevoke}
            style={styles.footerBtn}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  headerCompact: { paddingBottom: 14, gap: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary200 },
  title: { fontFamily: fontFamily.semiBold, fontSize: 18, color: colors.surface, lineHeight: 23 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { gap: 8 },
  cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  stageRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  stageBody: { flex: 1, gap: 2 },
  stageHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stageName: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text, flex: 1 },
  stageActor: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  stageComment: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.text2, marginTop: 2 },
  stageDate: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.muted3, marginTop: 2 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  attachmentThumb: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.fill },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  attachmentMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerRow: { flexDirection: 'row', gap: 8 },
  footerBtn: { flex: 1 },
  commentInput: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text,
    maxHeight: 70,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 10,
  },
});
