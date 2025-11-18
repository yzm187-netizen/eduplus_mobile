import type { AuthService } from '@/services/contracts';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateProfile } from '@/services/live/profile';
import { displayNameFromEmail } from '@/utils/displayName';

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
    let profile;
    try {
      const inferredName = me.name || displayNameFromEmail(me.email || email) || 'Student';
      profile = await getOrCreateProfile({ $id: me.$id, name: inferredName, email: me.email || email });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/already exists|409/i.test(msg)) {
        const inferredName = me.name || displayNameFromEmail(me.email || email) || 'Student';
        profile = { id: me.$id, name: inferredName, email: me.email || email, role: 'student' } as any;
      } else {
        throw e;
      }
    }
    const user = { id: profile.id, name: profile.name, email: profile.email, role: (profile as any).role || 'student' } as const;
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
      let profile;
      try {
        const inferredName = me.name || displayNameFromEmail(me.email) || 'Student';
        profile = await getOrCreateProfile({ $id: me.$id, name: inferredName, email: me.email ?? '' });
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (/already exists|409/i.test(msg)) {
          const inferredName = me.name || displayNameFromEmail(me.email) || 'Student';
          profile = { id: me.$id, name: inferredName, email: me.email ?? '', role: 'student' } as any;
        } else {
          throw e;
        }
      }
      const user = { id: profile.id, name: profile.name, email: profile.email, role: (profile as any).role || 'student' } as const;
      useAuthStore.getState().setUser(user);
      return user;
    } catch {
      return null;
    }
  },
};
