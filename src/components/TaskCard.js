import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from './Card';
import StatusPill from './StatusPill';
import PriorityDots from './PriorityDots';
import Avatar from './Avatar';
import { colors, toneColors, fontFamily } from '../theme/theme';
import { taskStatusInfo } from '../utils/taskStatus';
import { taskPriorityLevel } from '../utils/priority';
import { formatDateTime, userDisplayName } from '../utils/format';

export default function TaskCard({ task }) {
  const router = useRouter();
  const status = taskStatusInfo(task);
  const code = task.slug ?? `#${task.id}`;
  const projectName = task.project?.name ?? '';
  const assigneeName = userDisplayName(task.assignee);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => router.push(`/task/${task.id}`)}>
      <Card leftAccent={toneColors[status.tone]} style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{code}</Text>
            <StatusPill label={status.label} tone={status.tone} />
          </View>
          {task.is_favs ? <Ionicons name="star" size={16} color={colors.warning} /> : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        {projectName ? <Text style={styles.subtext} numberOfLines={1}>{projectName}</Text> : null}

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.dueRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.dueText}>{formatDateTime(task.deadline)}</Text>
          </View>
          <PriorityDots level={taskPriorityLevel(task)} />
          {assigneeName ? <Avatar name={assigneeName} size={26} /> : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.muted },
  title: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  subtext: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueText: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
});
