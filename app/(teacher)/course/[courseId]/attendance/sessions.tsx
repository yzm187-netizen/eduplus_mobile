import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Link } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function AttendanceSessionsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [sessions, setSessions] = useState<Array<{ id: string; topic?: string; startsAt: string }>>([]);

  useEffect(() => { (async () => {
    const items = await Services.schedule.listCalendarItems();
    setSessions(items.filter(i => i.type === 'session' && i.courseId === id).map(i => ({ id: i.id, topic: (i as any).title, startsAt: (i as any).startsAt })));
  })(); }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Attendance Sessions</Text>
      <Link href={{ pathname: '/(teacher)/course/[courseId]/attendance/create-session', params: { courseId: id } } as any} asChild>
        <Button title="Create Session" variant="secondary" />
      </Link>
      <View className="rounded-2xl mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {sessions.map(s => (
          <View key={s.id} className="border-b border-neutral-200 dark:border-neutral-800">
            <Link href={{ pathname: '/(teacher)/course/[courseId]/attendance/mark/[sessionId]', params: { courseId: id, sessionId: s.id } } as any} asChild>
              <Pressable className="px-4 py-3">
                <Text className="font-medium">{s.topic || s.id}</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{s.startsAt}</Text>
              </Pressable>
            </Link>
            <View className="px-4 pb-3">
              <Link href={{ pathname: '/(teacher)/course/[courseId]/attendance/session/[sessionId]/live', params: { courseId: id, sessionId: s.id } } as any} asChild>
                <Pressable className="mt-1"><Text className="text-emerald-600 font-medium">Show Live QR</Text></Pressable>
              </Link>
            </View>
          </View>
        ))}
        {sessions.length === 0 && <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No sessions yet.</Text></View>}
      </View>
    </SafeAreaView>
  );
}
