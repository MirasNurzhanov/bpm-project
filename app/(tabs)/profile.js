import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import SolidHeader from '../../src/components/SolidHeader';
import Avatar from '../../src/components/Avatar';
import Card from '../../src/components/Card';
import SettingsRow from '../../src/components/SettingsRow';
import SecondaryButton from '../../src/components/SecondaryButton';
import { colors, fontFamily } from '../../src/theme/theme';
import { userDisplayName } from '../../src/utils/format';

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [faceId, setFaceId] = useState(false);

  // Profile was only ever fetched once at login/boot — refresh on every
  // visit so stats stay current (and so we can actually see its [api] log).
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const name = userDisplayName(user);
  // Confirmed via a real response: this endpoint gives direct position_name/
  // department_name strings (unlike the nested position.job/position.department
  // shape seen on user objects from other endpoints, e.g. project members).
  const roleCity = [user?.position_name, user?.department_name].filter(Boolean).join(' · ');

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.flex}>
      <SolidHeader
        title="Профиль"
        left={<View />}
        right={
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={20} color={colors.surface} />
          </TouchableOpacity>
        }
      >
        <View style={styles.userRow}>
          <Avatar name={name} size={62} color={colors.surface} style={styles.userAvatar} />
          <Text style={styles.userName}>{name}</Text>
          {roleCity ? <Text style={styles.userMeta}>{roleCity}</Text> : null}
          {user?.email ? <Text style={styles.userMeta}>{user.email}</Text> : null}
        </View>
      </SolidHeader>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>РАБОТА</Text>
        <Card style={styles.card}>
          <SettingsRow icon="star-outline" label="Избранное" value={user?.favorites_count} />
          <SettingsRow icon="calendar-outline" label="Планирование" />
          <SettingsRow icon="trending-up-outline" label="Эффективность" />
          <SettingsRow icon="pricetags-outline" label="Тэги и справочники" last />
        </Card>

        <Text style={styles.sectionLabel}>ПРИЛОЖЕНИЕ</Text>
        <Card style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            label="Уведомления"
            toggle={notifications}
            onToggle={() => setNotifications((v) => !v)}
          />
          <SettingsRow
            icon="scan-outline"
            label="Вход по Face ID"
            toggle={faceId}
            onToggle={() => setFaceId((v) => !v)}
          />
          <SettingsRow icon="information-circle-outline" label="О приложении" value="1.0.0" last />
        </Card>

        <SecondaryButton
          label="Выйти"
          icon="log-out-outline"
          tone="danger"
          onPress={onLogout}
          style={styles.logoutButton}
        />

        <Text style={styles.footer}>© 2026 SevenDS</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  userRow: { alignItems: 'center', gap: 4, marginTop: 4 },
  userAvatar: { borderColor: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  userName: { fontFamily: fontFamily.semiBold, fontSize: 18, color: colors.surface },
  userMeta: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.primary200 },
  body: { padding: 16, gap: 8 },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    marginTop: 12,
    marginLeft: 4,
  },
  card: { paddingVertical: 4 },
  logoutButton: {
    marginTop: 16,
    borderColor: colors.danger200,
  },
  footer: {
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted3,
    marginTop: 16,
    marginBottom: 8,
  },
});
