import React from 'react';
import { View, Text } from 'react-native';
import { GradeTrend, CompletionBar } from '@/components/Charts';

// Overview now only renders secondary analytics; primary course info moved into banner header in _layout.tsx.
export default function CourseOverviewScreen() {
  return (
    <>
      <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
        <Text className="font-semibold mb-2">Grade trend</Text>
        <GradeTrend data={[68, 72, 74, 77, 80, 83, 86]} />
      </View>
      <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <Text className="font-semibold mb-2">Completion by module</Text>
        <CompletionBar values={[40, 55, 70, 85]} />
      </View>
    </>
  );
}
