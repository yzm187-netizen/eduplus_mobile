import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Link } from 'expo-router';
import { Services } from '@/services/providers';

export default function TeacherCourseOverview() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);

  const [course, setCourse] = useState<any>(null);

  useEffect(() => { (async () => setCourse(await Services.courses.getCourse(id)))(); }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-1">Course</Text>
      <Text className="text-neutral-500 dark:text-neutral-400 mb-4">{id}</Text>
      {course && (
        <View className="mb-6">
          <Text className="text-xl font-semibold">{course.name}</Text>
          {course.code && <Text className="text-neutral-500 dark:text-neutral-400">{course.code}</Text>}
        </View>
      )}

      <View className="grid gap-3">
  <Link href={{ pathname: '/(teacher)/course/[courseId]/edit', params: { courseId: id } } as any} asChild>
          <Pressable className="px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"><Text className="font-medium">Edit Settings</Text></Pressable>
        </Link>
  <Link href={{ pathname: '/(teacher)/course/[courseId]/roster', params: { courseId: id } } as any} asChild>
          <Pressable className="px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"><Text className="font-medium">Roster</Text></Pressable>
        </Link>
  <Link href={{ pathname: '/(teacher)/course/[courseId]/assessments', params: { courseId: id } } as any} asChild>
          <Pressable className="px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"><Text className="font-medium">Assessments</Text></Pressable>
        </Link>
  <Link href={{ pathname: '/(teacher)/course/[courseId]/groups', params: { courseId: id } } as any} asChild>
          <Pressable className="px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"><Text className="font-medium">Groups</Text></Pressable>
        </Link>
  <Link href={{ pathname: '/(teacher)/course/[courseId]/attendance/sessions', params: { courseId: id } } as any} asChild>
          <Pressable className="px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"><Text className="font-medium">Attendance</Text></Pressable>
        </Link>
  <Link href={{ pathname: '/(teacher)/course/[courseId]/analytics', params: { courseId: id } } as any} asChild>
          <Pressable className="px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"><Text className="font-medium">Analytics</Text></Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
