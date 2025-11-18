import React, { useMemo as useReactMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import type { Course, Notification as Notify, AssignmentRef } from '@/data/sample';
import { formatRelativeShort } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { BannerHeader } from '@/components/BannerHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { colorForName } from '@/utils/avatar';
import { courseBanner } from '@/utils/imagePlaceholders';
import { courseColorBannerImage } from '@/utils/courseColor';

export default function StudentHomeScreen() {
  const router = useRouter();
  const [notif, setNotif] = useState<Notify[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherByCourse, setTeacherByCourse] = useState<Record<string, { name: string; avatarUrl?: string } | null>>({});
  const [allAssignments, setAllAssignments] = useState<AssignmentRef[]>([]);
  const [overview, setOverview] = useState<{ weeklyStudyHours: number; assignmentsCompleted: number; streakDays: number } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    (async () => {
      const pairs = await Promise.all(myCourses.map(async (c) => {
        try {
          const roster = await Services.people.listCoursePeople(c.id);
          const t = roster.find(r => r.role === 'teacher') || null;
          return [c.id, t ? { name: t.name, avatarUrl: t.avatarUrl } : null] as const;
        } catch {
          return [c.id, null] as const;
        }
      }));
      const map: Record<string, { name: string; avatarUrl?: string } | null> = {};
      for (const [id, v] of pairs) map[id] = v;
      setTeacherByCourse(map);
    })();
  }, [myCourses]);

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
  const profileInitial = useReactMemo(() => (user?.name?.[0] || 'S').toUpperCase(), [user?.name]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black" edges={['left','right','bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner header inside ScrollView so it scrolls with content */}
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
            </View>
            <View className="items-end">
              <Pressable onPress={() => router.push('/(student)/(tabs)/profile' as any)}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00AFC8' }} />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00AFC8', backgroundColor: colorForName(user?.name) }} className="items-center justify-center">
                    <Text className="text-2xl font-bold text-white">{profileInitial}</Text>
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

        {/* Metrics cards slight overlap */}
        <View className="flex-row gap-3 mb-6 -mt-4 px-4">
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
        <View className="mb-6 px-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">Notifications</Text>
            <Pressable onPress={() => router.push('/(student)/notifications' as any)}>
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
          )}
        </View>

        {/* My Courses */}
        <View className="mb-6 px-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">My Courses</Text>
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
                      <View className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border border-white/30">
                        {teacherByCourse[c.id]?.avatarUrl ? (
                          <ExpoImage source={{ uri: teacherByCourse[c.id]?.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <View className="flex-1 items-center justify-center"><Text className="text-[10px] text-white font-semibold">{(teacherByCourse[c.id]?.name || 'T')[0]}</Text></View>
                        )}
                      </View>
                      <View className="w-20 h-2 rounded-full bg-white/25 overflow-hidden">
                        <View style={{ width: '30%' }} className="h-full bg-emerald-400" />
                      </View>
                    </View>
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

