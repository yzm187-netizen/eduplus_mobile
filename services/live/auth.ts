import type { AuthService } from '@/services/contracts';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateProfile } from '@/services/live/profile';

export const liveAuth: AuthService = {
  async signIn(email: string, password: string) {
    // If a session exists and belongs to the same email, reuse it; otherwise replace it
    try {
      const meExisting = await account.get();
      const sameUser = (meExisting.email || '').toLowerCase() === email.toLowerCase();
      if (!sameUser) {
        try { await account.deleteSession('current'); } catch {}
        await account.createEmailPasswordSession(email, password);
      }
    } catch {
      // No active session; create a new one
      await account.createEmailPasswordSession(email, password);
    }

    const me = await account.get();
    const profile = await getOrCreateProfile({ $id: me.$id, name: me.name || (me.email?.split('@')[0] ?? 'User'), email: me.email || email });
    const user = { id: profile.id, name: profile.name, email: profile.email, role: profile.role } as const;
    useAuthStore.getState().setUser(user);
    return user;
  },
  async signOut() {
    try { await account.deleteSession('current'); } catch {}
    useAuthStore.getState().signOut();
  },
  async getSession() {
    try {
      const me = await account.get();
      const profile = await getOrCreateProfile({ $id: me.$id, name: me.name || (me.email?.split('@')[0] ?? 'User'), email: me.email ?? '' });
      const user = { id: profile.id, name: profile.name, email: profile.email, role: profile.role } as const;
      useAuthStore.getState().setUser(user);
      return user;
    } catch {
      return null;
    }
  },
};
