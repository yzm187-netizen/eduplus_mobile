import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Services } from '@/services/providers';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gid = String(groupId);
  const [group, setGroup] = useState<any>(null);

  useEffect(() => { (async () => setGroup(await Services.groups.get(gid)))(); }, [gid]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Group</Text>
      {group ? (
        <View className="gap-2">
          <Text className="text-xl font-semibold">{group.name}</Text>
          <Text className="text-neutral-500 dark:text-neutral-400">Members: {group.members?.length || 0}</Text>
        </View>
      ) : <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>}
    </SafeAreaView>
  );
}
