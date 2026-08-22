import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { LoadingState } from '../../src/components/AsyncState';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'checking') return <LoadingState style={{ flex: 1 }} />;
  if (status === 'authenticated') return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
