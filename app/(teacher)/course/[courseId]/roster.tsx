import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function RosterScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: string }>>([]);

  useEffect(() => { (async () => setRoster(await Services.people.listCoursePeople(id)))(); }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Roster</Text>
      <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {roster.map(p => (
          <View key={p.id} className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <Text className="font-medium">{p.name}</Text>
            <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{p.role}</Text>
          </View>
        ))}
        {roster.length === 0 && (
          <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No people yet.</Text></View>
        )}
      </View>
      <View className="mt-4 flex-row gap-3">
        <Button title="Add Student" onPress={() => { /* TODO: open add student modal */ }} />
        <Button title="Add TA" variant="secondary" onPress={() => { /* TODO */ }} />
      </View>
    </SafeAreaView>
  );
}
