import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import { colorForName, nameInitials } from '@/utils/avatar';

export default function CoursePeopleScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const router = useRouter();
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }>>([]);

  useEffect(() => {
    (async () => setRoster(await Services.people.listCoursePeople(id)))();
  }, [id]);
  return (
    <View>
        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="font-semibold mb-3">People</Text>
          {roster.map((p) => (
            <Pressable key={p.id} onPress={() => router.push((`/(student)/people/${p.id}` as any))} className="py-3 border-b border-neutral-200 dark:border-neutral-800 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full overflow-hidden" style={{ backgroundColor: colorForName(p.name) }}>
                {p.avatarUrl ? (
                  <ExpoImage source={{ uri: p.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center"><Text className="text-xs text-white font-semibold">{nameInitials(p.name)}</Text></View>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-medium">{p.name}</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{p.role}</Text>
              </View>
            </Pressable>
          ))}
          {roster.length === 0 && (
            <Text className="text-neutral-500 dark:text-neutral-400">No people found.</Text>
          )}
        </View>
    </View>
  );
}
