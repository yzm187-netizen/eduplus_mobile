import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Services } from '@/services/providers';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { GradeTrend, StudyProgress } from '@/components/Charts';
import { avatarUrl } from '@/utils/imagePlaceholders';
import { useAssignmentTasksStore } from '@/store/assignmentTasks';
import { resetMockChat } from '@/services/mock/chat';

export default function StudentProfileScreen() {
  const [stats, setStats] = useState<{ weeklyStudyHours: number; assignmentsCompleted: number; streakDays: number } | null>(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);
  const largeText = useSettingsStore((s) => s.largeText);
  const toggleLargeText = useSettingsStore((s) => s.toggleLargeText);

  // Simple mock: cycle through a few deterministic placeholder avatars per user
  const [avatarVariant, setAvatarVariant] = useState(0);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name ?? '');
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '');
  const clearAssignments = useAssignmentTasksStore((s) => s.clear);

  const onChangeAvatar = () => {
    if (!user) return;
    const next = (avatarVariant + 1) % 5; // 5 variants
    setAvatarVariant(next);
    const url = avatarUrl(`${user.id}-v${next}`, 128);
    setUser({ ...user, avatarUrl: url });
  };

  const onRemoveAvatar = () => {
    if (!user) return;
    setUser({ ...user, avatarUrl: undefined });
  };

  useEffect(() => {
    // Keep drafts in sync when user changes (e.g., sign-in or sign-out)
    setNameDraft(user?.name ?? '');
    setEmailDraft(user?.email ?? '');
  }, [user]);

  const onSaveProfile = () => {
    if (!user) return;
    setUser({ ...user, name: nameDraft.trim() || user.name, email: emailDraft.trim() || user.email });
    setEditing(false);
  };

  const onResetDemo = async () => {
    // Reset assignment progress and chat history in mock mode
    clearAssignments();
    await resetMockChat();
    Alert.alert('Demo reset', 'Assignments and chat have been reset to defaults.');
  };

  useEffect(() => {
    (async () => setStats(await Services.stats.getStudentOverview()))();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <ScrollView className="px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-2xl font-extrabold mb-1">Profile</Text>
        <View className="flex-row items-center gap-3 mb-2">
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
          ) : (
            <View className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 items-center justify-center">
              <Text className="text-lg text-neutral-700 dark:text-neutral-200">{(user?.name?.[0] || 'S').toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text className="text-neutral-900 dark:text-neutral-100 font-semibold">{user?.name ?? 'Student'}</Text>
            <Text className="text-neutral-500 dark:text-neutral-400">{user?.email ?? 'you@example.com'}</Text>
          </View>
        </View>
        <View className="flex-row gap-2 mb-4">
          <Pressable onPress={onChangeAvatar} className="px-3 py-2 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-700 dark:text-neutral-200">Change photo</Text>
          </Pressable>
          <Pressable onPress={onRemoveAvatar} className="px-3 py-2 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-700 dark:text-neutral-200">Remove</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-3 mb-6">
          {stats && [
            { label: 'Completed', value: stats.assignmentsCompleted },
            { label: 'Study hrs', value: stats.weeklyStudyHours },
            { label: 'Streak', value: stats.streakDays + ' days' },
          ].map((m) => (
            <View key={m.label} className="flex-1 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-2xl font-bold">{String(m.value)}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400">{m.label}</Text>
            </View>
          ))}
        </View>

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
          <Text className="font-semibold mb-2">Your analytics</Text>
          <GradeTrend data={[70, 72, 75, 80, 82, 85, 88]} />
          <View className="mt-4">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Study progress</Text>
            <StudyProgress ratio={0.6} />
          </View>
        </View>

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-semibold">Account</Text>
            {!editing ? (
              <Pressable onPress={() => setEditing(true)} className="px-3 py-1 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <Text className="text-neutral-700 dark:text-neutral-200">Edit</Text>
              </Pressable>
            ) : (
              <View className="flex-row gap-2">
                <Pressable onPress={() => setEditing(false)} className="px-3 py-1 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  <Text className="text-neutral-700 dark:text-neutral-200">Cancel</Text>
                </Pressable>
                <Pressable onPress={onSaveProfile} className="px-3 py-1 rounded-full bg-[#00AFC8]">
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
              </View>
            )}
          </View>

          {!editing ? (
            <>
              <Text className="text-neutral-500 dark:text-neutral-400">Name: {user?.name ?? 'Student'}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400 mt-1">Email: {user?.email ?? 'you@example.com'}</Text>
            </>
          ) : (
            <View>
              <View className="mb-2">
                <Text className="mb-1 text-sm text-neutral-600 dark:text-neutral-300">Name</Text>
                <TextInput
                  className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View>
                <Text className="mb-1 text-sm text-neutral-600 dark:text-neutral-300">Email</Text>
                <TextInput
                  className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800"
                  value={emailDraft}
                  onChangeText={setEmailDraft}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}

          <View className="flex-row gap-2 mt-4">
            {(['system','light','dark'] as const).map((t) => (
              <Pressable key={t} onPress={() => setTheme(t)} className={`px-3 py-2 rounded-full border ${theme===t?'bg-[#00AFC8] border-[#00AFC8]':'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>
                <Text className={theme===t?'text-white font-semibold':'text-neutral-700 dark:text-neutral-200'}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
          <Text className="font-semibold mb-2">Preferences</Text>
          <Pressable onPress={toggleNotifications} className="py-3 border-b border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-700 dark:text-neutral-200">Notifications: {notificationsEnabled ? 'On' : 'Off'}</Text>
          </Pressable>
          <Pressable onPress={toggleLargeText} className="py-3">
            <Text className="text-neutral-700 dark:text-neutral-200">Large text: {largeText ? 'On' : 'Off'}</Text>
          </Pressable>
          <Text className="text-xs text-neutral-500 mt-2">Language and accessibility settings are placeholders for now.</Text>
        </View>

        <Pressable
          onPress={async () => {
            try { await Services.auth.signOut(); } finally { router.replace('/(auth)/sign-in' as any); }
          }}
          className="w-full rounded-2xl p-4 bg-red-600 items-center"
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </Pressable>

        <Pressable
          onPress={onResetDemo}
          className="w-full rounded-2xl p-4 bg-neutral-200 dark:bg-neutral-800 items-center mt-3"
        >
          <Text className="text-neutral-900 dark:text-neutral-100 font-semibold">Reset demo data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
