import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fontFamily } from '../theme/theme';

export default function PickerModal({ visible, title, options, selectedId, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.option} onPress={() => onSelect(item)}>
                <Text style={styles.optionLabel}>{item.label}</Text>
                {item.id === selectedId ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Нет доступных вариантов</Text>}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeLabel}>Закрыть</Text>
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
    maxHeight: '70%',
  },
  title: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.text, marginBottom: 8 },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionLabel: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  empty: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.muted, paddingVertical: 20, textAlign: 'center' },
  closeButton: { paddingVertical: 14, alignItems: 'center' },
  closeLabel: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.primary },
});
