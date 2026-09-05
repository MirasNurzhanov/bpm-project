import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { useFetch } from '../src/hooks/useFetch';
import { getSubordinates, getEmployeeEfficiency } from '../src/api/stats';
import Card from '../src/components/Card';
import StatusPill from '../src/components/StatusPill';
import { LoadingState, ErrorState, EmptyState } from '../src/components/AsyncState';
import { colors, fontFamily } from '../src/theme/theme';
import { userDisplayName, formatDate } from '../src/utils/format';
import { taskStatusInfo } from '../src/utils/taskStatus';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function shiftMonth(year, month, delta) {
  const idx = month - 1 + delta;
  const y = year + Math.floor(idx / 12);
  const m = ((idx % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}

const DONE_STATUS_ID = 4;

function statusOf(task) {
  return taskStatusInfo({
    ...task,
    status: { id: task.status_id, name: task.history_status ?? task.status?.name },
  });
}

export default function EfficiencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { user } = useAuth();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedIds, setSelectedIds] = useState(user?.id ? [user.id] : []);

  const subsFetch = useFetch(getSubordinates, []);
  const subordinates = subsFetch.data ?? [];

  const people = useMemo(() => {
    const list = [];
    if (user?.id) list.push({ id: user.id, label: `${userDisplayName(user) || 'Я'} (я)` });
    for (const s of subordinates) {
      if (s?.id && s.id !== user?.id) {
        list.push({ id: s.id, label: userDisplayName(s) || s.username || `#${s.id}` });
      }
    }
    return list;
  }, [user, subordinates]);

  const canQuery = selectedIds.length > 0;
  const effFetch = useFetch(
    () => (canQuery ? getEmployeeEfficiency({ users: selectedIds, year, month }) : Promise.resolve(null)),
    [selectedIds.join(','), year, month]
  );

  const tasks = effFetch.data?.tasks ?? [];
  const usersMeta = effFetch.data?.users ?? [];

  const groups = useMemo(() => {
    if (!tasks.length) return [];
    if (usersMeta.length <= 1) {
      return [{ id: usersMeta[0]?.id ?? 'all', name: usersMeta[0]?.name ?? '', tasks }];
    }
    const nameById = {};
    usersMeta.forEach((u) => { nameById[u.id] = u.name; });
    const map = new Map();
    for (const t of tasks) {
      const uid = t.assignee_id ?? t.assignee?.id ?? 'other';
      if (!map.has(uid)) map.set(uid, []);
      map.get(uid).push(t);
    }
    return [...map.entries()].map(([uid, ts]) => ({
      id: uid,
      name: nameById[uid] ?? userDisplayName(ts[0]?.assignee) ?? `#${uid}`,
      tasks: ts,
    }));
  }, [tasks, usersMeta]);

  const periodLabel = `${MONTHS[month - 1]} ${year}`;
  const atCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const goPrev = () => { const { year: y, month: m } = shiftMonth(year, month, -1); setYear(y); setMonth(m); };
  const goNext = () => { const { year: y, month: m } = shiftMonth(year, month, 1); setYear(y); setMonth(m); };

  const toggle = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Эффективность</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Card style={styles.controlCard}>
          <View style={styles.periodRow}>
            <TouchableOpacity onPress={goPrev} hitSlop={8} style={styles.periodArrow}>
              <Ionicons name="chevron-back" size={20} color={colors.text2} />
            </TouchableOpacity>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <TouchableOpacity onPress={goNext} hitSlop={8} style={styles.periodArrow} disabled={atCurrentMonth}>
              <Ionicons name="chevron-forward" size={20} color={atCurrentMonth ? colors.chevron : colors.text2} />
            </TouchableOpacity>
          </View>

          {people.length > 1 ? (
            <View style={styles.peopleWrap}>
              {people.map((p) => {
                const on = selectedIds.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => toggle(p.id)}
                    activeOpacity={0.7}
                    style={[styles.personChip, on && styles.personChipOn]}
                  >
                    <Text style={[styles.personChipText, on && styles.personChipTextOn]} numberOfLines={1}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </Card>

        {!canQuery ? (
          <EmptyState message="Выберите хотя бы одного сотрудника" icon="people-outline" />
        ) : effFetch.loading ? (
          <LoadingState />
        ) : effFetch.error ? (
          <ErrorState message="Не удалось загрузить данные" onRetry={effFetch.refetch} />
        ) : !tasks.length ? (
          <EmptyState message="Нет задач за выбранный период" icon="stats-chart-outline" />
        ) : (
          groups.map((g) => {
            const counts = new Map();
            for (const t of g.tasks) {
              const label = statusOf(t).label;
              counts.set(label, (counts.get(label) ?? 0) + 1);
            }
            const done = g.tasks.filter((t) => t.status_id === DONE_STATUS_ID).length;
            const rate = Math.round((done / g.tasks.length) * 100);

            return (
              <View key={g.id} style={styles.group}>
                {groups.length > 1 ? <Text style={styles.groupName}>{g.name}</Text> : null}

                <Card style={styles.summaryCard}>
                  <View style={styles.summaryTop}>
                    <View>
                      <Text style={styles.summaryBig}>{g.tasks.length}</Text>
                      <Text style={styles.summaryCaption}>задач за период</Text>
                    </View>
                    <View style={styles.summaryRight}>
                      <Text style={styles.summaryBig}>{rate}%</Text>
                      <Text style={styles.summaryCaption}>завершено ({done})</Text>
                    </View>
                  </View>
                  <View style={styles.countRow}>
                    {[...counts.entries()].map(([label, n]) => (
                      <View key={label} style={styles.countChip}>
                        <Text style={styles.countChipNum}>{n}</Text>
                        <Text style={styles.countChipLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </Card>

                {g.tasks.map((t) => {
                  const st = statusOf(t);
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.taskRow}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/task/${t.id}`)}
                    >
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                        <Text style={styles.taskMeta}>
                          {(t.slug ?? `#${t.id}`)}
                          {t.history_status_date ? ` · ${formatDate(t.history_status_date)}` : ''}
                        </Text>
                      </View>
                      <StatusPill label={st.label} tone={st.tone} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
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
  controlCard: { gap: 12 },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodArrow: { padding: 4 },
  periodLabel: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  peopleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  personChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.fill,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  personChipOn: { backgroundColor: colors.text, borderColor: colors.text },
  personChipText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.chipText },
  personChipTextOn: { color: colors.surface },
  group: { gap: 8 },
  groupName: { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.text, marginTop: 4 },
  summaryCard: { gap: 12 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryRight: { alignItems: 'flex-end' },
  summaryBig: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.text },
  summaryCaption: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  countRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.fill, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  countChipNum: { fontFamily: fontFamily.bold, fontSize: 13, color: colors.text },
  countChipLabel: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  taskInfo: { flex: 1, gap: 2 },
  taskTitle: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  taskMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
});
