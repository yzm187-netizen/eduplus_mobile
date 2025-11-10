import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Services } from '@/services/providers';

export default function MyCoursesScreen() {
  const [courses, setCourses] = useState<Array<{ id: string; name: string; code?: string }>>([]);

  useEffect(() => {
    (async () => setCourses(await Services.courses.listMyCourses()))();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">My Courses</Text>
      <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {courses.map(c => (
          <Link key={c.id} href={{ pathname: '/(teacher)/course/[courseId]', params: { courseId: c.id } } as any} asChild>
            <Pressable className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <Text className="font-semibold">{c.name}</Text>
              {!!c.code && <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{c.code}</Text>}
            </Pressable>
          </Link>
        ))}
        {courses.length === 0 && (
          <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No courses yet.</Text></View>
        )}
      </View>
    </SafeAreaView>
  );
}
