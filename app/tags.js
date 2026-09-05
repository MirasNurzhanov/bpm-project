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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequireAuth } from '../src/hooks/useRequireAuth';
import { useFetch } from '../src/hooks/useFetch';
import { getTags, createTag } from '../src/api/tags';
import { formatApiErrorMessage } from '../src/api/client';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { LoadingState, ErrorState, EmptyState } from '../src/components/AsyncState';
import { colors, fontFamily } from '../src/theme/theme';

const PALETTE = [
  '#4400ff', '#0e9cdb', '#2ec46b', '#f5a623', '#d0453b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#111827',
];

export default function TagsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useRequireAuth();

  const { data, loading, error, refetch } = useFetch(getTags, []);
  const tags = data ?? [];

  const [title, setTitle] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    const name = title.trim();
    if (!name) return;
    setSaving(true);
    try {
      await createTag({ title: name, color });
      setTitle('');
      setColor(PALETTE[0]);
      await refetch();
    } catch (e) {
      Alert.alert('Ошибка', formatApiErrorMessage(e, 'Не удалось создать тег.'));
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
        <Text style={styles.headerTitle}>Тэги и справочники</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.addCard}>
          <Text style={styles.cardTitle}>Новый тег</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Название тега"
            placeholderTextColor={colors.muted3}
            style={styles.input}
            autoCapitalize="none"
          />
          <View style={styles.swatchRow}>
            {PALETTE.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && styles.swatchOn,
                ]}
              >
                {color === c ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
              </TouchableOpacity>
            ))}
          </View>
          <PrimaryButton
            label="Добавить"
            icon="add"
            loading={saving}
            disabled={!title.trim()}
            onPress={onAdd}
          />
        </Card>

        <Text style={styles.sectionLabel}>ВСЕ ТЕГИ{tags.length ? ` · ${tags.length}` : ''}</Text>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message="Не удалось загрузить теги" onRetry={refetch} />
        ) : tags.length === 0 ? (
          <EmptyState message="Тегов пока нет" icon="pricetags-outline" />
        ) : (
          <Card style={styles.listCard}>
            {tags.map((t, i) => (
              <View key={t.id ?? t.pk ?? i} style={[styles.tagRow, i > 0 && styles.tagRowBorder]}>
                <View style={[styles.tagDot, { backgroundColor: t.color || colors.muted3 }]} />
                <Text style={styles.tagLabel} numberOfLines={1}>{t.title ?? t.str}</Text>
                <Text style={styles.tagHex}>{t.color}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
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
  headerTitle: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text },
  body: { padding: 16, gap: 12 },
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
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: { borderColor: colors.text },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    marginTop: 8,
    marginLeft: 4,
  },
  listCard: { paddingVertical: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  tagRowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  tagDot: { width: 14, height: 14, borderRadius: 7 },
  tagLabel: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text, flex: 1 },
  tagHex: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.muted },
});
