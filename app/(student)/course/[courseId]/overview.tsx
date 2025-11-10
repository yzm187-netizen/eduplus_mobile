import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import CourseNav from '@/components/CourseNav';
import { GradeTrend, CompletionBar } from '@/components/Charts';
import { courseBanner } from '@/utils/imagePlaceholders';

export default function CourseOverviewScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-extrabold mb-2">Course</Text>
        <Text className="text-neutral-500 dark:text-neutral-400 mb-3">{id}</Text>

        {/* Course banner */}
        <View className="mb-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          <Image
            source={{ uri: courseBanner(id, 1200, 360) }}
            style={{ width: '100%', height: 150 }}
            resizeMode="cover"
          />
        </View>

        <CourseNav courseId={id} active="overview" />

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
          <Text className="font-semibold mb-2">Grade trend</Text>
          <GradeTrend data={[68, 72, 74, 77, 80, 83, 86]} />
        </View>
        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="font-semibold mb-2">Completion by module</Text>
          <CompletionBar values={[40, 55, 70, 85]} />
        </View>
      </View>
    </SafeAreaView>
  );
}
