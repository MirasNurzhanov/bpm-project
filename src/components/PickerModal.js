import { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fontFamily } from '../theme/theme';

const SEARCH_THRESHOLD = 6;

export default function PickerModal({
  visible,
  title,
  options,
  selectedId,
  selectedIds,
  onSelect,
  onToggle,
  onClose,
  multiple = false,
}) {
  const [query, setQuery] = useState('');
  const isSelected = (id) => (multiple ? (selectedIds ?? []).includes(id) : id === selectedId);
  const handlePress = (item) => (multiple ? onToggle(item) : onSelect(item));

  const showSearch = (options?.length ?? 0) > SEARCH_THRESHOLD;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options ?? [];
    return (options ?? []).filter((o) => String(o.label ?? '').toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>

          {showSearch ? (
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Поиск"
                placeholderTextColor={colors.muted3}
                style={styles.searchInput}
                autoCorrect={false}
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.option} onPress={() => handlePress(item)}>
                <Text style={styles.optionLabel}>{item.label}</Text>
                {isSelected(item.id) ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Ничего не найдено</Text>}
          />
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Text style={styles.closeLabel}>{multiple ? 'Готово' : 'Закрыть'}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(22,25,29,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: 20,
    maxHeight: '75%',
  },
  title: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text, marginBottom: 8 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: colors.fill,
  },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 14, color: colors.text },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionLabel: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text, flex: 1, paddingRight: 8 },
  empty: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.muted, paddingVertical: 20, textAlign: 'center' },
  closeButton: { paddingVertical: 14, alignItems: 'center' },
  closeLabel: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.primary },
});
