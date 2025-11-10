import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CourseNav from '@/components/CourseNav';
import { Services } from '@/services/providers';

export default function CoursePeopleScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const router = useRouter();
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher' }>>([]);

  useEffect(() => {
    (async () => setRoster(await Services.people.listCoursePeople(id)))();
  }, [id]);
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-extrabold mb-2">People</Text>
        <Text className="text-neutral-500 dark:text-neutral-400 mb-3">{id}</Text>
        <CourseNav courseId={id} active="people" />

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="font-semibold mb-3">Roster</Text>
          {roster.map((p) => (
            <Pressable key={p.id} onPress={() => router.push((`/(student)/people/${p.id}` as any))} className="py-3 border-b border-neutral-200 dark:border-neutral-800">
              <Text className="font-medium">{p.name}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{p.role}</Text>
            </Pressable>
          ))}
          {roster.length === 0 && (
            <Text className="text-neutral-500 dark:text-neutral-400">No people found.</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
