import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';

// For routes outside the (tabs)/(auth) groups (task/[id], new-task) that don't
// get the group-layout auth gate — redirects to login if the session expires
// mid-screen (client.js's global 401 handler flips AuthContext to unauthenticated).
export function useRequireAuth() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/(auth)/login');
    }
  }, [status, router]);
}
