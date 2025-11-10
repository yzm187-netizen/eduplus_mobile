import { useEffect } from 'react';
import { Services } from '@/services/providers';
import { useAuthStore } from '@/store/useAuthStore';

// On app start, probe session and set the user accordingly.
// If no session, ensure local store is cleared so index routes to sign-in.
export function useAuthInit() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await Services.auth.getSession();
        if (cancelled) return;
        if (!user) {
          // clear any stale persisted user
          useAuthStore.getState().signOut();
        }
      } catch {
        if (!cancelled) useAuthStore.getState().signOut();
      }
    })();
    return () => { cancelled = true; };
  }, []);
}
