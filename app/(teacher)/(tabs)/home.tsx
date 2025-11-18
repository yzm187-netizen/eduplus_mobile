import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerHeader } from '@/components/BannerHeader';
import { Services } from '@/services/providers';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { colorForName } from '@/utils/avatar';
import { Image as ExpoImage } from 'expo-image';
import { courseColorBannerImage } from '@/utils/courseColor';
import type { Course, Notification as Notify } from '@/data/sample';
import { formatRelativeShort } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [notif, setNotif] = useState<Notify[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = useMemo(() => (user?.name ? user.name.split(/\s+/)[0] : 'Teacher'), [user?.name]);
  const profileInitial = (user?.name?.[0] || 'T').toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [courses, notifications] = await Promise.all([
          Services.courses.listMyCourses(),
          Services.notifications.list(),
        ]);
        setMyCourses(courses);
        // For teachers, notifications will later include submissions to grade, announcements, etc.
        setNotif(notifications);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const [courses, notifications] = await Promise.all([
        Services.courses.listMyCourses(),
        Services.notifications.list(),
      ]);
      setMyCourses(courses);
      setNotif(notifications);
    } finally {
      setRefreshing(false);
    }
  };

  // Teacher metrics (placeholder calculations for now)
  const metrics = [
    { label: 'Courses', value: String(myCourses.length) },
    { label: 'To grade', value: '0' },
    { label: 'Lessons', value: '0' },
  ];

  // Add course modal state (floating bottom sheet)
  const [addVisible, setAddVisible] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingCode, setPendingCode] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [pendingColor, setPendingColor] = useState<'blue'|'green'|'purple'|'red'>('blue');
  const NAME_LIMIT = 80;
  const DESC_LIMIT = 240;

  async function createCourse() {
    if (!pendingName.trim() || !pendingCode.trim()) return;
    try {
      const created = await Services.courses.createCourse({
        name: pendingName.trim(),
        code: pendingCode.trim(),
        description: pendingDescription.trim() || null,
        color: pendingColor,
      });
      setMyCourses(prev => [created, ...prev]);
      setAddVisible(false);
      setPendingName('');
      setPendingCode('');
      setPendingDescription('');
      setPendingColor('blue');
      // Navigate to teacher course overview for immediate editing
      router.push((`/(teacher)/course/${created.id}` as any));
    } catch (e) {
      console.warn('Create course failed', e);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black" edges={['left','right','bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BannerHeader
          height={188}
          childrenPosition="top"
          textShift={-32}
          showText={false}
          backgroundMode="cover"
          backgroundAnchorY="top"
          floating
        >
          <View className="flex-row items-start justify-between">
            <View className="pr-4" style={{ maxWidth: '70%' }}>
              <Text className="text-3xl font-extrabold text-white" numberOfLines={1}>Welcome, {firstName}</Text>
              <Text className="text-white/80 mt-1">Your teaching overview</Text>
            </View>
            <View className="items-end">
              <Pressable onPress={() => router.push('/(teacher)/(tabs)/profile' as any)}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00AFC8' }} />
                ) : (
                  <View className="items-center justify-center" style={{ width:64, height:64, borderRadius: 32, backgroundColor: colorForName(user?.name), borderWidth: 2, borderColor: '#00AFC8' }}>
                    <Text className="text-white text-2xl font-bold">{profileInitial}</Text>
                  </View>
                )}
              </Pressable>
              {user?.role ? (
                <Text className="text-xs mt-2 px-2 py-1 rounded-full bg-white/15 text-white" style={{ overflow: 'hidden' }}>
                  {user.role.toUpperCase()}
                </Text>
              ) : null}
            </View>
          </View>
        </BannerHeader>

        {/* Metrics */}
        <View className="flex-row gap-3 mb-6 -mt-4 px-4">
          {metrics.slice(0, 3).map((m) => (
            <View key={m.label} className="flex-1 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <View className="flex-row items-center gap-2 mb-1">
                {m.label === 'Courses' && <Ionicons name="book-outline" size={18} color="#00AFC8" />}
                {m.label === 'To grade' && <Ionicons name="clipboard-outline" size={18} color="#00AFC8" />}
                {m.label === 'Lessons' && <Ionicons name="school-outline" size={18} color="#00AFC8" />}
                <Text className="text-neutral-500 dark:text-neutral-400">{m.label}</Text>
              </View>
              <Text className="text-2xl font-bold">{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <View className="mb-6 px-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">Notifications</Text>
            <Pressable onPress={() => router.push('/(teacher)/notifications' as any)}>
              <Text className="text-[#00AFC8]">See all</Text>
            </Pressable>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} className="w-64 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <View className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <View className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-900 mt-3 animate-pulse" />
                  <View className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-900 mt-2 animate-pulse" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {notif.map((n) => (
                <View key={n.id} className="w-64 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <View className="flex-row justify-between items-start">
                    <Text className="font-semibold mr-2 flex-1" numberOfLines={2}>{n.title}</Text>
                  </View>
                  {n.subtitle ? (
                    <Text className="mt-1 text-neutral-500 dark:text-neutral-400" numberOfLines={2}>{n.subtitle}</Text>
                  ) : null}
                  <Text className="mt-2 text-xs text-neutral-400">{formatRelativeShort(n.createdAt)}</Text>
                </View>
              ))}
              {notif.length === 0 && (
                <View className="w-64 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <Text className="text-neutral-500 dark:text-neutral-400">No notifications yet.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* My Courses + Add */}
        <View className="mb-6 px-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">My Courses</Text>
            <Pressable onPress={() => setAddVisible(true)} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#00AFC8' }}>
              <Text className="text-white font-semibold">Add course</Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <View key={i} className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <View style={{ height: 120 }} className="bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </View>
              ))
            ) : myCourses.map((c) => (
              <Pressable
                key={c.id}
                className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
                onPress={() => router.push((`/(student)/course/${c.id}` as any))}
              >
                <View style={{ height: 120 }}>
                  <ExpoImage
                    source={courseColorBannerImage(c.color)}
                    contentFit="cover"
                    contentPosition="top"
                    cachePolicy="memory-disk"
                    priority="low"
                    transition={250}
                    style={{ position: 'absolute', inset: 0 }}
                  />
                  <View className="absolute left-4 right-4 bottom-3 flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-extrabold" numberOfLines={1}>{c.name}</Text>
                      <Text className="text-white/80 text-xs" numberOfLines={1}>{c.code}</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      {user?.avatarUrl ? (
                        <View className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border border-white/30">
                          <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                        </View>
                      ) : (
                        <View className="w-8 h-8 rounded-full items-center justify-center border border-white/30" style={{ backgroundColor: colorForName(user?.name) }}>
                          <Text className="text-white text-xs font-bold">{profileInitial}</Text>
                        </View>
                      )}
                      <View className="w-20 h-2 rounded-full bg-white/25 overflow-hidden">
                        <View style={{ width: '50%' }} className="h-full bg-emerald-400" />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
            {!loading && myCourses.length === 0 && (
              <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <Text className="text-neutral-500 dark:text-neutral-400">No courses yet.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {/* Add course bottom sheet modal (floating) */}
      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => setAddVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setAddVisible(false)}>
          <View className="flex-1 justify-end">
            <Pressable onPress={() => {}} className="w-full rounded-t-2xl bg-white dark:bg-neutral-900 p-4" style={{ elevation: 6 }}>
              <Text className="text-base font-semibold mb-3 dark:text-white">New Course</Text>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Title</Text>
                <TextInput value={pendingName} onChangeText={(t)=>{ if (t.length<=NAME_LIMIT) setPendingName(t); }} placeholder="Course title" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingName.length}/{NAME_LIMIT}</Text>
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Code</Text>
                <TextInput value={pendingCode} onChangeText={setPendingCode} placeholder="e.g. CS 305" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Description (optional)</Text>
                <TextInput value={pendingDescription} onChangeText={(t)=>{ if (t.length<=DESC_LIMIT) setPendingDescription(t); }} placeholder="Short description" multiline numberOfLines={5} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" style={{ minHeight: 90, textAlignVertical: 'top' }} />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingDescription.length}/{DESC_LIMIT}</Text>
              </View>
              <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-2">Theme</Text>
              <View className="flex-row justify-between mb-4">
                {(['blue','green','purple','red'] as const).map((c) => (
                  <Pressable key={c} onPress={() => setPendingColor(c)} className="items-center">
                    <View className="w-12 h-8 rounded" style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'green' ? '#22c55e' : c === 'purple' ? '#8b5cf6' : '#ef4444', opacity: pendingColor === c ? 1 : 0.8, borderWidth: pendingColor === c ? 2 : 0, borderColor: '#111827' }} />
                    <Text className="text-xs mt-1 capitalize dark:text-white">{c}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row justify-end gap-3 mt-2">
                <Pressable onPress={() => setAddVisible(false)} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800">
                  <Text className="dark:text-white">Cancel</Text>
                </Pressable>
                <Pressable disabled={!pendingName.trim() || !pendingCode.trim()} onPress={createCourse} className="px-4 py-2 rounded-xl" style={{ backgroundColor: (!pendingName.trim() || !pendingCode.trim()) ? '#9ca3af' : '#00AFC8' }}>
                  <Text className="text-white font-semibold">Create</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
