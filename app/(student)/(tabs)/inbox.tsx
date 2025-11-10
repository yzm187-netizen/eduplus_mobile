import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Services } from '@/services/providers';
import type { Thread } from '@/data/chat';
import { useRouter } from 'expo-router';

export default function StudentInboxScreen() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const list = await Services.chat.listThreads();
      setThreads(list);
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <ScrollView className="px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-2xl font-extrabold mb-4">Inbox</Text>
        <View className="gap-3">
          {threads.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push((`/(student)/threads/${t.id}` as any))}
              className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <Text className="font-semibold mb-1">{t.title}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400">Updated {new Date(t.lastMessageAt).toLocaleString()}</Text>
            </Pressable>
          ))}
          {threads.length === 0 && (
            <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-neutral-500 dark:text-neutral-400">No threads yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
