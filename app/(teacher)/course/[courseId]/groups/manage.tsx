import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Services } from '@/services/providers';

export default function ManageGroupsScreen() {
  const { courseId, groupId } = useLocalSearchParams<{ courseId: string; groupId?: string }>();
  const [group, setGroup] = useState<{ id: string; name: string; members: Array<{ id: string; name: string }> } | null>(null);

  useEffect(() => { (async () => { if (groupId) setGroup(await Services.groups.get(String(groupId))); })(); }, [groupId]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-2">Manage Groups</Text>
      <Text className="text-neutral-500 dark:text-neutral-400">Course {courseId}</Text>
      {group ? (
        <View className="mt-4">
          <Text className="text-xl font-semibold mb-2">{group.name}</Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Members</Text>
          <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            {group.members.map(m => (
              <View key={m.id} className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <Text className="font-medium">{m.name}</Text>
              </View>
            ))}
            {group.members.length === 0 && <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No members.</Text></View>}
          </View>
        </View>
      ) : (
        <Text className="text-neutral-500 dark:text-neutral-400 mt-2">{groupId ? 'Loading…' : 'Select a group from the list'}</Text>
      )}
    </SafeAreaView>
  );
}
