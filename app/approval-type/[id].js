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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequireAuth } from '../../src/hooks/useRequireAuth';
import { useFetch } from '../../src/hooks/useFetch';
import {
  getApprovalTypeStages,
  getApprovalStageCreateForm,
  createApprovalStage,
} from '../../src/api/approvals';
import { formatApiErrorMessage } from '../../src/api/client';
import Card from '../../src/components/Card';
import PickerModal from '../../src/components/PickerModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';

const APPROVAL_TYPE_OPTIONS = [
  { id: 'sogl', label: 'Согласование' },
  { id: 'ispl', label: 'Исполнение' },
];

function stagePreviousId(s) {
  return s?.previous_approval_stage_id ?? s?.previous_approval_stage?.id ?? s?.previous_approval_stage ?? null;
}

// Stages form a linked chain (previous_approval_stage); walk it head-to-tail
// instead of trusting API list order.
function orderStages(list) {
  const byPrev = new Map();
  for (const s of list) byPrev.set(stagePreviousId(s), s);
  const ordered = [];
  const seen = new Set();
  let cursor = byPrev.get(null);
  while (cursor && !seen.has(cursor.id ?? cursor.pk)) {
    ordered.push(cursor);
    seen.add(cursor.id ?? cursor.pk);
    cursor = byPrev.get(cursor.id ?? cursor.pk);
  }
  for (const s of list) {
    if (!seen.has(s.id ?? s.pk)) ordered.push(s);
  }
  return ordered;
}

export default function ApprovalTypeStagesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();

  const { data: stagesData, loading, error, refetch } = useFetch(() => getApprovalTypeStages(id), [id]);
  const { data: stageForm } = useFetch(() => getApprovalStageCreateForm(id), [id]);

  const stages = orderStages(stagesData ?? []);
  const typeName = stageForm?.form?.fields?.doc_type?._choices?.[0]?.[1] ?? '';
  const positionOptions = (stageForm?.form?.fields?.position?._choices ?? []).map(([pid, label]) => ({
    id: pid,
    label,
  }));

  const [name, setName] = useState('');
  const [position, setPosition] = useState(null);
  const [approvalType, setApprovalType] = useState('sogl');
  const [moneyChange, setMoneyChange] = useState(false);
  const [positionPickerOpen, setPositionPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed || !position) {
      Alert.alert('Заполните форму', 'Укажите название этапа и должность.');
      return;
    }
    setSaving(true);
    try {
      const lastStage = stages[stages.length - 1];
      await createApprovalStage(id, {
        name: trimmed,
        previousStageId: lastStage ? (lastStage.id ?? lastStage.pk) : null,
        position: position.id,
        moneyChange,
        approvalType,
      });
      setName('');
      setPosition(null);
      setMoneyChange(false);
      setApprovalType('sogl');
      await refetch();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось добавить этап.'));
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
        <Text style={styles.headerTitle} numberOfLines={1}>{typeName || 'Этапы согласования'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message="Не удалось загрузить этапы" onRetry={refetch} />
        ) : stages.length === 0 ? (
          <EmptyState message="Этапов пока нет — процессы этого типа не смогут пройти согласование" icon="git-network-outline" />
        ) : (
          <Card style={styles.listCard}>
            {stages.map((s, i) => (
              <View key={s.id ?? s.pk ?? i} style={[styles.stageRow, i > 0 && styles.stageRowBorder]}>
                <View style={styles.stageIndex}>
                  <Text style={styles.stageIndexText}>{i + 1}</Text>
                </View>
                <View style={styles.stageInfo}>
                  <Text style={styles.stageName}>{s.name ?? s.str}</Text>
                  <Text style={styles.stageMeta} numberOfLines={1}>
                    {s.position?.name ?? s.position_name ?? ''}
                    {s.approval_type ? ` · ${s.approval_type === 'ispl' ? 'Исполнение' : 'Согласование'}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card style={styles.addCard}>
          <Text style={styles.cardTitle}>Добавить этап{stages.length ? ` (${stages.length + 1}-й)` : ' (первый)'}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Название этапа"
            placeholderTextColor={colors.muted3}
            style={styles.input}
          />

          <TouchableOpacity style={styles.pickerRow} onPress={() => setPositionPickerOpen(true)}>
            <Ionicons name="briefcase-outline" size={18} color={colors.muted} />
            <Text style={styles.pickerLabel}>Должность</Text>
            <Text style={styles.pickerValue} numberOfLines={1}>{position?.label ?? 'Не выбрана'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>

          <View style={styles.segmentRow}>
            {APPROVAL_TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setApprovalType(opt.id)}
                style={[styles.segment, approvalType === opt.id && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, approvalType === opt.id && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => setMoneyChange((v) => !v)}>
            <Text style={styles.toggleLabel}>Может менять сумму (money_change)</Text>
            <View style={[styles.toggle, moneyChange && styles.toggleOn]}>
              <View style={[styles.thumb, moneyChange && styles.thumbOn]} />
            </View>
          </TouchableOpacity>

          <PrimaryButton
            label="Добавить этап"
            icon="add"
            loading={saving}
            disabled={!name.trim() || !position}
            onPress={onAdd}
          />
        </Card>
      </ScrollView>

      <PickerModal
        visible={positionPickerOpen}
        title="Выберите должность"
        options={positionOptions}
        selectedId={position?.id}
        onSelect={(item) => { setPosition(item); setPositionPickerOpen(false); }}
        onClose={() => setPositionPickerOpen(false)}
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
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text },
  body: { padding: 16, gap: 12 },
  listCard: { paddingVertical: 4 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stageRowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  stageIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIndexText: { fontFamily: fontFamily.semiBold, fontSize: 12, color: colors.primary },
  stageInfo: { flex: 1, gap: 2 },
  stageName: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  stageMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
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
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  pickerLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  pickerValue: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.muted, maxWidth: 150 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.chipText },
  segmentTextActive: { color: colors.surface },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, flex: 1 },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 22,
    backgroundColor: colors.control,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.success },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface },
  thumbOn: { alignSelf: 'flex-end' },
});
