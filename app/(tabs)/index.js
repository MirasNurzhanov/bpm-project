import { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useFetch } from '../../src/hooks/useFetch';
import { getAssignedTasks } from '../../src/api/tasks';
import { getProjects } from '../../src/api/projects';
import SolidHeader from '../../src/components/SolidHeader';
import StatRow from '../../src/components/StatRow';
import Avatar from '../../src/components/Avatar';
import Card from '../../src/components/Card';
import SectionHeader from '../../src/components/SectionHeader';
import TaskCard from '../../src/components/TaskCard';
import ProjectCard from '../../src/components/ProjectCard';
import { LoadingState, ErrorState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';
import { greeting, formatLongDate, formatDateTime, userDisplayName } from '../../src/utils/format';
import { isOverdue } from '../../src/utils/taskStatus';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const tasksFetch = useFetch(getAssignedTasks, []);
  const projectsFetch = useFetch(getProjects, []);

  const tasks = tasksFetch.data ?? [];
  const projects = projectsFetch.data ?? [];

  const stats = useMemo(() => {
    const todo = tasks.filter((t) => !isOverdue(t) && t.status?.id === 1).length;
    const inProgress = tasks.filter((t) => !isOverdue(t) && t.status?.id === 2).length;
    const overdue = tasks.filter(isOverdue);
    return { todo, inProgress, overdue };
  }, [tasks]);

  const nearestOverdue = stats.overdue.sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )[0];

  const todayTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter((t) => t.deadline && new Date(t.deadline).toDateString() === today).slice(0, 4);
  }, [tasks]);

  const displayName = userDisplayName(user);

  const loading = tasksFetch.loading || projectsFetch.loading;
  const refreshing = tasksFetch.refreshing || projectsFetch.refreshing;
  const onRefresh = () => {
    tasksFetch.refresh();
    projectsFetch.refresh();
  };

  if (loading) return <LoadingState style={{ flex: 1 }} />;

  return (
    <ScrollView
      style={styles.flex}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <SolidHeader
        title={`${greeting()}${displayName ? ', ' + displayName : ''}`}
        subtitle={formatLongDate()}
        left={<View />}
        right={
          <>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color={colors.surface} />
            </TouchableOpacity>
            <Avatar name={displayName} size={34} color={colors.surface} />
          </>
        }
      >
        <StatRow
          stats={[
            { value: stats.todo, label: 'К выполнению' },
            { value: stats.inProgress, label: 'В работе' },
            { value: stats.overdue.length, label: 'Просрочено', color: stats.overdue.length ? colors.warning200 : undefined },
          ]}
        />
      </SolidHeader>

      <View style={styles.body}>
        {tasksFetch.error ? (
          <ErrorState message="Не удалось загрузить задачи" onRetry={tasksFetch.refetch} />
        ) : null}

        {nearestOverdue ? (
          <Card leftAccent={colors.danger} style={styles.alertCard}>
            <Text style={styles.alertLabel}>ТРЕБУЕТ ВНИМАНИЯ</Text>
            <Text style={styles.alertText}>
              {stats.overdue.length} {stats.overdue.length === 1 ? 'задача просрочена' : 'задачи просрочены'}, ближайшая — «
              {nearestOverdue.title}»
            </Text>
            <Text style={styles.alertMeta}>Срок истёк {formatDateTime(nearestOverdue.deadline)}</Text>
          </Card>
        ) : null}

        <SectionHeader
          title={`Сегодня · ${todayTasks.length}`}
          actionLabel="Все задачи"
          onActionPress={() => router.push('/(tabs)/tasks')}
        />
        {todayTasks.length ? (
          <View style={styles.list}>
            {todayTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>На сегодня задач нет</Text>
        )}

        <SectionHeader
          title="Мои проекты"
          actionLabel="Все"
          onActionPress={() => router.push('/(tabs)/projects')}
          style={styles.sectionSpacing}
        />
        {projectsFetch.error ? (
          <ErrorState message="Не удалось загрузить проекты" onRetry={projectsFetch.refetch} />
        ) : (
          <View style={styles.list}>
            {projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 8 },
  list: { gap: 12 },
  sectionSpacing: { marginTop: 20 },
  alertCard: { backgroundColor: colors.danger100, gap: 4, marginBottom: 8 },
  alertLabel: { fontFamily: fontFamily.semiBold, fontSize: 11, color: colors.danger, letterSpacing: 0.6 },
  alertText: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  alertMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
  emptyText: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted, marginBottom: 8 },
});
