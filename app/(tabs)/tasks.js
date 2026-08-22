import { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useFetch } from '../../src/hooks/useFetch';
import { getAssignedTasks, getCreatedTasks } from '../../src/api/tasks';
import SolidHeader from '../../src/components/SolidHeader';
import SearchBar from '../../src/components/SearchBar';
import StatRow from '../../src/components/StatRow';
import FilterChip from '../../src/components/FilterChip';
import Avatar from '../../src/components/Avatar';
import SectionHeader from '../../src/components/SectionHeader';
import TaskCard from '../../src/components/TaskCard';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';
import { isOverdue } from '../../src/utils/taskStatus';
import { userDisplayName } from '../../src/utils/format';

const SCOPES = [
  { key: 'assigned', label: 'Мне назначены' },
  { key: 'created', label: 'Я создал' },
];

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'overdue', label: 'Просроченные' },
  { key: 'favorite', label: 'Избранное' },
];

export default function TasksScreen() {
  const { user } = useAuth();
  const [scope, setScope] = useState('assigned');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetcher = scope === 'assigned' ? getAssignedTasks : getCreatedTasks;
  const { data, loading, refreshing, error, refetch, refresh } = useFetch(fetcher, [scope]);
  const tasks = data ?? [];

  const stats = useMemo(() => {
    const todo = tasks.filter((t) => !isOverdue(t) && t.status?.id === 1).length;
    const inProgress = tasks.filter((t) => !isOverdue(t) && t.status?.id === 2).length;
    const overdue = tasks.filter(isOverdue).length;
    return { todo, inProgress, overdue };
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'overdue') list = list.filter(isOverdue);
    if (filter === 'favorite') list = list.filter((t) => t.is_favs);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => (t.title ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [tasks, filter, search]);

  const overdueTasks = filtered.filter(isOverdue);
  const otherTasks = filtered.filter((t) => !isOverdue(t));

  return (
    <View style={styles.flex}>
      <SolidHeader
        title="Мои задачи"
        left={<View />}
        right={
          <>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color={colors.surface} />
            </TouchableOpacity>
            <Avatar name={userDisplayName(user)} size={34} color={colors.surface} />
          </>
        }
      >
        <SearchBar value={search} onChangeText={setSearch} placeholder="Поиск по задачам" />
        <StatRow
          stats={[
            { value: stats.todo, label: 'К выполнению' },
            { value: stats.inProgress, label: 'В работе' },
            { value: stats.overdue, label: 'Просрочено', color: stats.overdue ? colors.warning200 : undefined },
          ]}
        />
        <View style={styles.scopeRow}>
          {SCOPES.map((s) => (
            <TouchableOpacity key={s.key} onPress={() => setScope(s.key)} style={styles.scopeTab}>
              <Text style={[styles.scopeLabel, scope === s.key && styles.scopeLabelActive]}>{s.label}</Text>
              {scope === s.key ? <View style={styles.scopeUnderline} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </SolidHeader>

      <ScrollView
        style={styles.flex}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      >
        <View style={styles.chipRow}>
          {FILTERS.map((f) => (
            <FilterChip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>

        <View style={styles.body}>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message="Не удалось загрузить задачи" onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Задачи не найдены" icon="checkbox-outline" />
          ) : (
            <>
              {overdueTasks.length ? (
                <>
                  <SectionHeader title={`Просрочено · ${overdueTasks.length}`} />
                  <View style={styles.list}>
                    {overdueTasks.map((t) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </View>
                </>
              ) : null}

              {otherTasks.length ? (
                <>
                  <SectionHeader title="Сегодня" style={overdueTasks.length ? styles.sectionSpacing : undefined} />
                  <View style={styles.list}>
                    {otherTasks.map((t) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scopeRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  scopeTab: { paddingBottom: 6 },
  scopeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: fontFamily.medium },
  scopeLabelActive: { color: colors.surface },
  scopeUnderline: { height: 2, backgroundColor: colors.surface, borderRadius: 1, marginTop: 6 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 16 },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  list: { gap: 12 },
  sectionSpacing: { marginTop: 20 },
});
