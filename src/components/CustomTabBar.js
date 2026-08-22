import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../theme/theme';

const ICONS = {
  index: 'home',
  tasks: 'checkbox',
  projects: 'folder',
  profile: 'person',
};

const LABELS = {
  index: 'Главная',
  tasks: 'Задачи',
  projects: 'Проекты',
  profile: 'Профиль',
};

export default function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 12 }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = ICONS[route.name] ?? 'ellipse';
        const label = LABELS[route.name] ?? route.name;
        const color = isFocused ? colors.primary : colors.muted2;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity key={route.key} accessibilityRole="button" onPress={onPress} style={styles.tab}>
            <Ionicons name={iconName} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => router.push('/new-task')}
      >
        <Ionicons name="add" size={26} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.success,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
