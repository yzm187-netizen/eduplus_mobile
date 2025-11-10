import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'student' | 'teacher' | 'admin';
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Wire this to your chosen backend (Supabase, Firebase, etc.) in services/
