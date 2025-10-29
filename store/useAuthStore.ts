import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  signOut: () => set({ user: null }),
}));

// Wire this to your chosen backend (Supabase, Firebase, etc.) in services/
