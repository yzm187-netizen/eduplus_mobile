import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Link } from 'expo-router';
import { Services } from '@/services/providers';

export default function AssessmentSubmissionsScreen() {
  const { courseId, assessmentId } = useLocalSearchParams<{ courseId: string; assessmentId: string }>();
  const aid = String(assessmentId);
  const [subs, setSubs] = useState<Array<{ id: string; studentName?: string; status: string; grade?: number }>>([]);

  useEffect(() => { (async () => setSubs(await Services.submissions.list(aid)))(); }, [aid]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Submissions</Text>
      <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {subs.map(s => (
          <Link key={s.id} href={{ pathname: '/(teacher)/course/[courseId]/submissions/[assessmentId]/[submissionId]', params: { courseId: courseId, assessmentId: aid, submissionId: s.id } } as any} asChild>
            <Pressable className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <Text className="font-medium">{s.studentName || s.id}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400 text-sm">{s.status}{s.grade != null ? ` · ${s.grade}` : ''}</Text>
            </Pressable>
          </Link>
        ))}
        {subs.length === 0 && <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No submissions yet.</Text></View>}
      </View>
    </SafeAreaView>
  );
}
