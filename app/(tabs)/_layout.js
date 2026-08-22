import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { LoadingState } from '../../src/components/AsyncState';
import CustomTabBar from '../../src/components/CustomTabBar';

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'checking') return <LoadingState style={{ flex: 1 }} />;
  if (status === 'unauthenticated') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
