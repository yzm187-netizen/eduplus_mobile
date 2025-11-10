import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Link } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function TeacherGroupsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; members: number }>>([]);

  useEffect(() => { (async () => setGroups(await Services.groups.list(id)))(); }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Groups</Text>
      <Button title="Create Group" variant="secondary" onPress={() => {/* TODO open group create */}} />
      <View className="rounded-2xl mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {groups.map(g => (
          <Link key={g.id} href={{ pathname: '/(teacher)/course/[courseId]/groups/manage', params: { courseId: id, groupId: g.id } } as any} asChild>
            <Pressable className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <Text className="font-medium">{g.name}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{g.members} members</Text>
            </Pressable>
          </Link>
        ))}
        {groups.length === 0 && <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No groups yet.</Text></View>}
      </View>
    </SafeAreaView>
  );
}
