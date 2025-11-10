import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import Constants from 'expo-constants';

export default function IndexRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const booted = useAuthStore((s) => s.booted);
  const extra: any = Constants.expoConfig?.extra || {};
  const mode = (extra.EXPO_PUBLIC_API_MODE || process.env.EXPO_PUBLIC_API_MODE || 'mock').toLowerCase();

  useEffect(() => {
    if (!booted) return; // wait for auth init to finish
    if (!user) {
      router.replace('/(auth)/sign-in' as any);
      return;
    }
    if (mode === 'live' && user.email === 'you@example.com') {
      // This is a mock placeholder user lingering; force sign-in
      router.replace('/(auth)/sign-in' as any);
      return;
    }
    if (user.role === 'teacher' || user.role === 'admin') {
      router.replace('/(teacher)/(tabs)/home' as any);
    } else {
      router.replace('/(student)/(tabs)/home' as any);
    }
  }, [user, router, booted, mode]);

  return null;
}
