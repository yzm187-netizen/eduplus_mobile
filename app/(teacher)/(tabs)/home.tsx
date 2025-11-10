import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerHeader } from '@/components/BannerHeader';
import { Services } from '@/services/providers';

export default function TeacherHomeScreen() {
  const [overview, setOverview] = useState<{ courses: number; activeStudents: number } | null>(null);

  useEffect(() => {
    // Placeholder aggregated stats (replace with real service calls later)
    (async () => {
      try {
        const courses = (await Services.courses.listMyCourses()).length;
        // Active students placeholder until enrollments service is wired
        const activeStudents = 0;
        setOverview({ courses, activeStudents });
      } catch {}
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <BannerHeader>
        <View>
          <Text className="text-3xl font-extrabold text-white">Welcome back</Text>
          <Text className="text-white/80 mt-1">Your teaching overview</Text>
        </View>
      </BannerHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingTop: 200 }} className="px-4">
        <View className="flex-row gap-3 mb-6 -mt-24">
          <View className="flex-1 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-500 dark:text-neutral-400 mb-1">Courses</Text>
            <Text className="text-2xl font-bold">{overview?.courses ?? '—'}</Text>
          </View>
          <View className="flex-1 rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-500 dark:text-neutral-400 mb-1">Active students</Text>
            <Text className="text-2xl font-bold">{overview?.activeStudents ?? '—'}</Text>
          </View>
        </View>

        <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="text-lg font-semibold mb-2">Next steps</Text>
          <Text className="text-neutral-500 dark:text-neutral-400">Create a new course or review submissions to keep momentum going.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
