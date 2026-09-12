import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from './Card';
import StatusPill from './StatusPill';
import { toneColors, colors, fontFamily } from '../theme/theme';
import { approvalStatusInfo } from '../utils/approvalStatus';
import { formatDate, formatMoney, userDisplayName } from '../utils/format';

export default function ApprovalCard({ process: p }) {
  const router = useRouter();
  const status = approvalStatusInfo(p);
  const code = p.slug ?? `#${p.id ?? p.pk}`;
  const typeName = p.type?.name ?? p.document_type?.name ?? '';
  const initiatorName = userDisplayName(p.initiator);
  const money = formatMoney(p.money_amount);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => router.push(`/approval/${p.id ?? p.pk}`)}>
      <Card leftAccent={toneColors[status.tone]} style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.code}>{code}</Text>
          <StatusPill label={status.label} tone={status.tone} />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {p.title ?? p.str ?? 'Без названия'}
        </Text>
        {typeName ? <Text style={styles.subtext} numberOfLines={1}>{typeName}</Text> : null}

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {initiatorName || '—'}{p.create_date ? ` · ${formatDate(p.create_date)}` : ''}
          </Text>
          {money ? <Text style={styles.money}>{money}</Text> : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.muted },
  title: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.text },
  subtext: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metaText: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted, flex: 1 },
  money: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.text },
});
