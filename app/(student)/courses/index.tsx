import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Services } from '@/services/providers';
import type { Course } from '@/data/sample';
import { useRouter } from 'expo-router';
import { BannerHeader } from '@/components/BannerHeader';

export default function AllCoursesScreen() {
  const [items, setItems] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => setItems(await Services.courses.listMyCourses()))();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <BannerHeader>
        <View>
          <Text className="text-3xl font-extrabold text-white">My Courses</Text>
          <Text className="text-white/80 mt-1">Manage and explore</Text>
        </View>
      </BannerHeader>
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 32, paddingTop: 200 }}>
        <View className="-mt-24 mb-4" />
        <View className="gap-3">
          {items.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push((`/(student)/course/${c.id}` as any))}
              className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 rounded-lg" style={{ backgroundColor: c.color || '#10b981' }} />
                  <View>
                    <Text className="font-semibold">{c.name}</Text>
                    <Text className="text-neutral-500 dark:text-neutral-400">{c.code}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
          {items.length === 0 && (
            <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-neutral-500 dark:text-neutral-400">No courses yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
