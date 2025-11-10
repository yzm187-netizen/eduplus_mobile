import React, { useMemo as useReactMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import type { Course, Notification as Notify, AssignmentRef } from '@/data/sample';
import { formatRelativeShort } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { BannerHeader } from '@/components/BannerHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { avatarUrl } from '@/utils/imagePlaceholders';
import { courseBanner } from '@/utils/imagePlaceholders';

export default function StudentHomeScreen() {
  const router = useRouter();
  const [notif, setNotif] = useState<Notify[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allAssignments, setAllAssignments] = useState<AssignmentRef[]>([]);
  const [overview, setOverview] = useState<{ weeklyStudyHours: number; assignmentsCompleted: number; streakDays: number } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    const [n, c, a, o] = await Promise.all([
      Services.notifications.list(),
      Services.courses.listMyCourses(),
      Services.assignments.listAll(),
      Services.stats.getStudentOverview(),
    ]);
    setNotif(n);
    setMyCourses(c);
    setAllAssignments(a);
    setOverview(o);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const dueSoon = useMemo(() => {
    const withinDays = 7;
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return allAssignments.filter((a) => new Date(a.dueAt) <= cutoff).length;
  }, [allAssignments]);

  const metrics = overview
    ? [
        { label: 'Due soon', value: dueSoon.toString() },
        { label: 'Completed', value: overview.assignmentsCompleted.toString() },
        { label: 'Study hrs', value: overview.weeklyStudyHours.toString() },
      ]
    : [];

  const user = useAuthStore((s) => s.user);
  const firstName = useReactMemo(() => {
    if (!user?.name) return 'Student';
    return user.name.split(/\s+/)[0];
  }, [user?.name]);
  const profileAvatar = useReactMemo(() => avatarUrl(user?.id || 'x', 96), [user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      {/* Banner header shorter (height 188), full-width, zoomed-out & shifted to reveal gradient */}
      <BannerHeader
        height={188}
        childrenPosition="top"
        textShift={-32}
      >
        <View className="flex-row items-start justify-between">
          <View className="pr-4" style={{ maxWidth: '70%' }}>
            <Text className="text-3xl font-extrabold text-white" numberOfLines={1}>Welcome, {firstName}</Text>
          </View>
          <View className="items-end">
            <Pressable onPress={() => router.push('/(student)/(tabs)/profile' as any)}>
              <Image
                source={{ uri: profileAvatar }}
                style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00AFC8' }}
              />
            </Pressable>
            {user?.role ? (
              <Text className="text-xs mt-2 px-2 py-1 rounded-full bg-white/15 text-white" style={{ overflow: 'hidden' }}>
                {user.role.toUpperCase()}
              </Text>
            ) : null}
          </View>
        </View>
      </BannerHeader>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
  {/* Spacer to push content below banner and allow slight overlap */}
  <View style={{ height: 164 }} />
  {/* Metrics cards slight overlap */}
  <View className="flex-row gap-3 mb-6 -mt-6">
          {metrics.slice(0, 3).map((m) => (
            <View key={m.label} className="flex-1 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <View className="flex-row items-center gap-2 mb-1">
                {m.label === 'Due soon' && <Ionicons name="time-outline" size={18} color="#00AFC8" />}
                {m.label === 'Completed' && <Ionicons name="checkmark-done-outline" size={18} color="#00AFC8" />}
                {m.label === 'Study hrs' && <Ionicons name="school-outline" size={18} color="#00AFC8" />}
                <Text className="text-neutral-500 dark:text-neutral-400">{m.label}</Text>
              </View>
              <Text className="text-2xl font-bold">{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Notifications (scrollable window) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">Notifications</Text>
            <Pressable onPress={() => router.push('/(student)/notifications' as any)}>
              <Text className="text-[#00AFC8]">See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {notif.map((n) => (
              <Pressable
                key={n.id}
                className="w-64 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                onPress={() => {
                  if (n.courseId && n.assignmentId) {
                    router.push((`/(student)/course/${n.courseId}/assignments/${n.assignmentId}` as any));
                  }
                }}
              >
                <View className="flex-row justify-between items-start">
                  <Text className="font-semibold mr-2 flex-1">{n.title}</Text>
                  {typeof n.badges === 'number' && n.badges > 0 ? (
                    <View className="px-2 py-1 rounded-full bg-[#00AFC8]">
                      <Text className="text-white text-xs">{n.badges}</Text>
                    </View>
                  ) : null}
                </View>
                {n.subtitle ? (
                  <Text className="mt-1 text-neutral-500 dark:text-neutral-400">{n.subtitle}</Text>
                ) : null}
                <Text className="mt-2 text-xs text-neutral-400">{formatRelativeShort(n.createdAt)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* My Courses */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">My Courses</Text>
            <Pressable onPress={() => router.push('/(student)/courses' as any)}>
              <Text className="text-[#00AFC8]">Manage</Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {myCourses.map((c) => (
              <Pressable
                key={c.id}
                className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                onPress={() => {
                  // Navigate to course hub (overview) – stub path for now
                  router.push((`/(student)/course/${c.id}` as any));
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Image source={{ uri: courseBanner(c.code || c.name, 400, 200) }} style={{ width: 56, height: 40, borderRadius: 8 }} />
                    <View>
                      <Text className="font-semibold">{c.name}</Text>
                      <Text className="text-neutral-500 dark:text-neutral-400">{c.code}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    {c.badges?.newNotes ? (
                      <View className="px-2 py-1 rounded-full bg-blue-600 flex-row items-center gap-1">
                        <Ionicons name="document-text-outline" size={12} color="#fff" />
                        <Text className="text-white text-xs">{c.badges.newNotes} new notes</Text>
                      </View>
                    ) : null}
                    {c.badges?.newGrades ? (
                      <View className="px-2 py-1 rounded-full bg-amber-600 flex-row items-center gap-1">
                        <Ionicons name="ribbon-outline" size={12} color="#fff" />
                        <Text className="text-white text-xs">{c.badges.newGrades} new grade</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

