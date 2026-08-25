import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFetch } from '../../src/hooks/useFetch';
import { useRequireAuth } from '../../src/hooks/useRequireAuth';
import { getProject, getProjectTasks } from '../../src/api/projects';
import SolidHeader from '../../src/components/SolidHeader';
import Card from '../../src/components/Card';
import Avatar from '../../src/components/Avatar';
import InfoRow from '../../src/components/InfoRow';
import SectionHeader from '../../src/components/SectionHeader';
import TaskCard from '../../src/components/TaskCard';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';
import { userDisplayName } from '../../src/utils/format';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  useRequireAuth();
  const { data: project, loading, error, refetch } = useFetch(() => getProject(id), [id]);
  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useFetch(() => getProjectTasks(id), [id]);
  const tasks = tasksData ?? [];

  if (loading) return <LoadingState style={{ flex: 1 }} />;
  if (error || !project) {
    return (
      <View style={styles.flex}>
        <ErrorState message="Не удалось загрузить проект" onRetry={refetch} style={{ flex: 1 }} />
      </View>
    );
  }

  const members = project.members ?? [];
  const responsibleNames = (project.responsible ?? []).map(userDisplayName).filter(Boolean).join(', ');

  return (
    <View style={styles.flex}>
      <SolidHeader
        left={
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </TouchableOpacity>
        }
        title={project.name}
        subtitle={project.company?.name}
      />

      <ScrollView style={styles.flex} contentContainerStyle={styles.body}>
        <Card style={styles.card}>
          {project.company?.name ? (
            <InfoRow icon="business-outline" label="Компания" value={project.company.name} />
          ) : null}
          {responsibleNames ? (
            <InfoRow icon="person-outline" label="Ответственный" value={responsibleNames} last={!members.length} />
          ) : null}
          {members.length ? (
            <View style={styles.membersRow}>
              <Ionicons name="people-outline" size={16} color={colors.muted} style={styles.membersIcon} />
              <Text style={styles.membersLabel}>Участники</Text>
              <View style={styles.avatarStack}>
                {members.slice(0, 6).map((m, i) => (
                  <Avatar
                    key={m.id ?? i}
                    name={userDisplayName(m)}
                    size={26}
                    style={[styles.stackedAvatar, i > 0 && { marginLeft: -7 }]}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        <SectionHeader title={`Задачи · ${tasks.length}`} style={styles.sectionHeader} />
        {tasksLoading ? (
          <LoadingState />
        ) : tasksError ? (
          <ErrorState message="Не удалось загрузить задачи проекта" onRetry={refetchTasks} />
        ) : tasks.length === 0 ? (
          <EmptyState message="В проекте пока нет задач" icon="checkbox-outline" />
        ) : (
          <View style={styles.list}>
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 8, paddingBottom: 32 },
  card: { gap: 4 },
  membersRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  membersIcon: { marginRight: 10 },
  membersLabel: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted, flex: 1 },
  avatarStack: { flexDirection: 'row' },
  stackedAvatar: { borderWidth: 1.5, borderColor: colors.surface },
  sectionHeader: { marginTop: 12 },
  list: { gap: 12 },
});
