import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';

type SettingsState = {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  largeText: boolean;
  language: 'en' | 'auto';
  setTheme: (t: ThemeMode) => void;
  toggleNotifications: () => void;
  toggleLargeText: () => void;
  setLanguage: (l: SettingsState['language']) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      notificationsEnabled: true,
      largeText: false,
      language: 'auto',
      setTheme: (t) => set({ theme: t }),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      toggleLargeText: () => set((s) => ({ largeText: !s.largeText })),
      setLanguage: (l) => set({ language: l }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
