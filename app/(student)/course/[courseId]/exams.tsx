import React from 'react';
import { View, Text } from 'react-native';

export default function CourseExamsScreen() {
  return (
    <View>
        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="font-semibold mb-1">Exams</Text>
          <Text className="text-neutral-500 dark:text-neutral-400">Exam schedule and details — coming soon.</Text>
        </View>
    </View>
  );
}
