import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

// TODO: integrate Services.analytics when ready
export default function CourseAnalyticsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);

  // Placeholder metrics
  const metrics = [
    { label: 'On-Time Rate', value: '—' },
    { label: 'Overdue Count', value: '—' },
    { label: 'Avg Streak', value: '—' },
    { label: 'Risk Score', value: '—' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Analytics</Text>
      <View className="grid gap-3">
        {metrics.map(m => (
          <View key={m.label} className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{m.label}</Text>
            <Text className="text-xl font-semibold">{m.value}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
