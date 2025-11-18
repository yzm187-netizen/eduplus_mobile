import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, Image, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Services } from '@/services/providers'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'
import { colorForName } from '@/utils/avatar'
import { uploadAvatar, deleteAvatarFile } from '@/services/live/avatar'
import { updateProfile } from '@/services/live/profile'

export default function TeacherProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name ?? '');
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '');
  const [pendingAvatar, setPendingAvatar] = useState<{ uri: string } | null>(null);

  useEffect(() => {
    setNameDraft(user?.name ?? '');
    setEmailDraft(user?.email ?? '');
  }, [user]);

  const onChangeAvatar = async () => {
    try {
      // Lightweight picker via expo-image-picker (lazy import to avoid bundle if unused)
      const mod = await import('expo-image-picker');
      const perm = await mod.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access to set an avatar.'); return; }
      const result: any = await mod.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.9 });
      if (result?.canceled || !result?.assets?.length) return;
      setPendingAvatar({ uri: result.assets[0].uri });
    } catch (e) {
      Alert.alert('Avatar', 'Could not open photo library');
    }
  };

  const onConfirmAvatar = async () => {
    if (!user || !pendingAvatar) return;
    try {
      const previousFileId = (user as any).avatarFileId;
      if (previousFileId) deleteAvatarFile(previousFileId);
      const { fileId, url } = await uploadAvatar({ uri: pendingAvatar.uri, name: 'avatar.jpg', type: 'image/jpeg' });
      await updateProfile(user.id, { avatarFileId: fileId });
      setUser({ ...user, avatarUrl: url, avatarFileId: fileId as any });
    } catch (e) {
      Alert.alert('Avatar', (e as any)?.message || 'Upload failed');
    } finally {
      setPendingAvatar(null);
    }
  };

  const onRemoveAvatar = () => {
    if (!user) return;
    const prev = (user as any).avatarFileId;
    if (prev) deleteAvatarFile(prev);
    updateProfile(user.id, { avatarFileId: null }).catch(() => {});
    setUser({ ...user, avatarUrl: undefined, avatarFileId: undefined });
  };

  const onSaveProfile = async () => {
    if (!user) return;
    const newName = nameDraft.trim() || user.name;
    const newEmail = emailDraft.trim() || user.email;
    try { await updateProfile(user.id, { name: newName, email: newEmail }); } catch {}
    setUser({ ...user, name: newName, email: newEmail });
    setEditing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <ScrollView className="px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-2xl font-extrabold mb-1">Profile</Text>
        <View className="flex-row items-center gap-3 mb-2">
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
          ) : (
            <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: colorForName(user?.name) }}>
              <Text className="text-lg text-white">{(user?.name?.[0] || 'T').toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text className="text-neutral-900 dark:text-neutral-100 font-semibold">{user?.name ?? 'Teacher'}</Text>
            <Text className="text-neutral-500 dark:text-neutral-400">{user?.email ?? 'you@example.com'}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-4">
          <Pressable onPress={onChangeAvatar} className="px-3 py-2 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-700 dark:text-neutral-200">Upload photo</Text>
          </Pressable>
          <Pressable onPress={onRemoveAvatar} className="px-3 py-2 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-700 dark:text-neutral-200">Remove</Text>
          </Pressable>
        </View>
        {pendingAvatar && (
          <View className="mb-6 items-start">
            <Text className="text-sm mb-2 text-neutral-600 dark:text-neutral-300">Preview</Text>
            <Image source={{ uri: pendingAvatar.uri }} style={{ width: 72, height: 72, borderRadius: 16 }} />
            <View className="flex-row gap-2 mt-3">
              <Pressable onPress={() => setPendingAvatar(null)} className="px-3 py-2 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <Text className="text-neutral-700 dark:text-neutral-200">Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirmAvatar} className="px-3 py-2 rounded-full bg-[#00AFC8]">
                <Text className="text-white font-semibold">Save Avatar</Text>
              </Pressable>
            </View>
          </View>
        )}

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
              <Text className="text-neutral-500 dark:text-neutral-400">Name: {user?.name ?? 'Teacher'}</Text>
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
        </View>

        <Pressable
          onPress={async () => { try { await Services.auth.signOut(); } finally { router.replace('/(auth)/sign-in' as any); } }}
          className="w-full rounded-2xl p-4 bg-red-600 items-center"
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
