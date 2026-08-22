import { useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useFetch } from '../../src/hooks/useFetch';
import { getProjects } from '../../src/api/projects';
import SolidHeader from '../../src/components/SolidHeader';
import SearchBar from '../../src/components/SearchBar';
import FilterChip from '../../src/components/FilterChip';
import Avatar from '../../src/components/Avatar';
import SectionHeader from '../../src/components/SectionHeader';
import ProjectCard from '../../src/components/ProjectCard';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/AsyncState';
import { colors } from '../../src/theme/theme';
import { userDisplayName } from '../../src/utils/format';

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'mine', label: 'Мои' },
  { key: 'completed', label: 'Завершённые' },
];

const CLOSED_STATUSES = ['closed', 'completed'];

export default function ProjectsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, loading, refreshing, error, refetch, refresh } = useFetch(getProjects, []);
  const projects = data ?? [];

  const filtered = useMemo(() => {
    let list = projects;
    if (filter === 'mine') {
      list = list.filter((p) => p.is_mine ?? p.owner?.id === user?.id);
    }
    if (filter === 'completed') {
      list = list.filter((p) => CLOSED_STATUSES.includes(String(p.status).toLowerCase()));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => (p.name ?? p.title ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [projects, filter, search, user]);

  const inProgress = filtered.filter((p) => !CLOSED_STATUSES.includes(String(p.status).toLowerCase()));
  const completed = filtered.filter((p) => CLOSED_STATUSES.includes(String(p.status).toLowerCase()));

  return (
    <View style={styles.flex}>
      <SolidHeader
        title="Проекты"
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
        <SearchBar value={search} onChangeText={setSearch} placeholder="Поиск по проектам" />
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
            <ErrorState message="Не удалось загрузить проекты" onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Проекты не найдены" icon="folder-open-outline" />
          ) : (
            <>
              {inProgress.length ? (
                <>
                  <SectionHeader title="В работе" />
                  <View style={styles.list}>
                    {inProgress.map((p) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </View>
                </>
              ) : null}

              {completed.length ? (
                <>
                  <SectionHeader title="Завершено" style={inProgress.length ? styles.sectionSpacing : undefined} />
                  <View style={styles.list}>
                    {completed.map((p) => (
                      <ProjectCard key={p.id} project={p} />
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
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 16 },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  list: { gap: 12 },
  sectionSpacing: { marginTop: 20 },
});
