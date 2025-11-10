import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import CourseNav from '@/components/CourseNav';
import { courseBanner } from '@/utils/imagePlaceholders';

export default function CourseExamsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-extrabold mb-2">Exams</Text>
        <Text className="text-neutral-500 dark:text-neutral-400 mb-3">{id}</Text>
        <View className="mb-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          <Image source={{ uri: courseBanner('Exam Schedule', 1200, 360) }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
        </View>
        <CourseNav courseId={id} active="exams" />

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="font-semibold mb-1">Exams</Text>
          <Text className="text-neutral-500 dark:text-neutral-400">Exam schedule and details — coming soon.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
