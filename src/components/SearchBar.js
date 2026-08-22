import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../theme/theme';

export default function SearchBar({ value, onChangeText, placeholder, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name="search" size={16} color="rgba(255,255,255,0.85)" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.7)"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.surface,
  },
});
