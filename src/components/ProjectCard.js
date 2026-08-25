import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from './Card';
import StatusPill from './StatusPill';
import ProgressBar from './ProgressBar';
import Avatar from './Avatar';
import { colors, toneColors, fontFamily } from '../theme/theme';
import { projectStatusInfo, projectProgress, hasProjectStatus, hasProjectProgress } from '../utils/projectStatus';
import { formatDate, userDisplayName } from '../utils/format';

export default function ProjectCard({ project }) {
  const router = useRouter();
  const status = projectStatusInfo(project);
  const progress = projectProgress(project);
  const total = project.tasks_total ?? project.tasks_count ?? project.current_task_num ?? 0;
  const done = project.tasks_done ?? project.tasks_completed ?? 0;
  const members = project.members ?? project.participants ?? [];

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => router.push(`/project/${project.id}`)}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {project.name ?? project.title}
          </Text>
          {hasProjectStatus(project) ? <StatusPill label={status.label} tone={status.tone} /> : null}
        </View>

        {hasProjectProgress(project) ? (
          <View style={styles.progressRow}>
            <ProgressBar progress={progress} color={toneColors[status.tone]} style={styles.progressBar} />
            <Text style={styles.progressLabel}>{progress}%</Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.meta}>
            {done && total ? `${done} из ${total} задач` : total ? `${total} задач` : ''}
            {project.due_date ? ` · до ${formatDate(project.due_date)}` : ''}
          </Text>
          {members.length ? (
            <View style={styles.avatarStack}>
              {members.slice(0, 4).map((m, i) => (
                <Avatar
                  key={m.id ?? i}
                  name={userDisplayName(m)}
                  size={24}
                  style={[styles.stackedAvatar, i > 0 && { marginLeft: -7 }]}
                />
              ))}
            </View>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text, flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1 },
  progressLabel: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.muted },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted, flex: 1 },
  avatarStack: { flexDirection: 'row' },
  stackedAvatar: { borderWidth: 1.5, borderColor: colors.surface },
});
