import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function IndexRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      // No authenticated user -> go to sign-in
      router.replace('/(auth)/sign-in' as any);
      return;
    }
    if (user.role === 'teacher' || user.role === 'admin') {
      router.replace('/(teacher)/(tabs)/home' as any);
    } else {
      router.replace('/(student)/(tabs)/home' as any);
    }
  }, [user, router]);

  return null;
}
