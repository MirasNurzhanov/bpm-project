import { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useFetch } from '../../src/hooks/useFetch';
import {
  getActiveApprovals,
  getCreatedApprovals,
  getNeedApprovalApprovals,
  getSubordinateApprovals,
  getCompletedApprovals,
  getDraftApprovals,
  getApprovalToApproveCount,
} from '../../src/api/approvals';
import SolidHeader from '../../src/components/SolidHeader';
import SearchBar from '../../src/components/SearchBar';
import Avatar from '../../src/components/Avatar';
import ApprovalCard from '../../src/components/ApprovalCard';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/AsyncState';
import { colors, fontFamily } from '../../src/theme/theme';
import { userDisplayName } from '../../src/utils/format';

const SCOPES = [
  { key: 'active', label: 'Активные', fetcher: getActiveApprovals },
  { key: 'needApproval', label: 'Ждут согласования', fetcher: getNeedApprovalApprovals },
  { key: 'created', label: 'Я создал', fetcher: getCreatedApprovals },
  { key: 'subordinates', label: 'Подчинённых', fetcher: getSubordinateApprovals },
  { key: 'completed', label: 'Завершённые', fetcher: getCompletedApprovals },
  { key: 'draft', label: 'Черновики', fetcher: getDraftApprovals },
];

export default function ApprovalsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [scope, setScope] = useState('active');
  const [search, setSearch] = useState('');

  const fetcher = (SCOPES.find((s) => s.key === scope) ?? SCOPES[0]).fetcher;
  const { data, loading, refreshing, error, refetch, refresh } = useFetch(fetcher, [scope]);
  const processes = data ?? [];

  const { data: countsData } = useFetch(getApprovalToApproveCount, []);
  const toApproveCount = countsData?.toApprove ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return processes;
    const q = search.trim().toLowerCase();
    return processes.filter((p) => (p.title ?? p.str ?? '').toLowerCase().includes(q));
  }, [processes, search]);

  return (
    <View style={styles.flex}>
      <SolidHeader
        title="Процессы"
        left={<View />}
        right={
          <>
            <TouchableOpacity onPress={() => router.push('/new-approval')} hitSlop={8}>
              <Ionicons name="add" size={24} color={colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <Avatar
                name={userDisplayName(user)}
                uri={user?.photo?.url}
                size={38}
                color={colors.primary}
                background={colors.surface}
              />
            </TouchableOpacity>
          </>
        }
      >
        <SearchBar value={search} onChangeText={setSearch} placeholder="Поиск по процессам" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scopeRow}
        >
          {SCOPES.map((s) => (
            <TouchableOpacity key={s.key} onPress={() => setScope(s.key)} style={styles.scopeTab}>
              <View style={styles.scopeLabelRow}>
                <Text style={[styles.scopeLabel, scope === s.key && styles.scopeLabelActive]}>
                  {s.label}
                </Text>
                {s.key === 'needApproval' && toApproveCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{toApproveCount}</Text>
                  </View>
                ) : null}
              </View>
              {scope === s.key ? <View style={styles.scopeUnderline} /> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SolidHeader>

      <ScrollView
        style={styles.flex}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      >
        <View style={styles.body}>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message="Не удалось загрузить процессы" onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Процессов не найдено" icon="git-network-outline" />
          ) : (
            <View style={styles.list}>
              {filtered.map((p, i) => (
                <ApprovalCard key={p.id ?? p.pk ?? i} process={p} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scopeRow: { flexDirection: 'row', gap: 20, marginTop: 4, paddingRight: 8 },
  scopeTab: { paddingBottom: 6 },
  scopeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scopeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: fontFamily.medium },
  scopeLabelActive: { color: colors.surface },
  scopeUnderline: { height: 2, backgroundColor: colors.surface, borderRadius: 1, marginTop: 6 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fontFamily.semiBold, fontSize: 11, color: colors.text },
  body: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  list: { gap: 12 },
});
