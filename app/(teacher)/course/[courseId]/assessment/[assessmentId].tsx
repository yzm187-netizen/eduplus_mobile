import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Link } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function ManageAssessmentScreen() {
  const { courseId, assessmentId } = useLocalSearchParams<{ courseId: string; assessmentId: string }>();
  const cid = String(courseId);
  const aid = String(assessmentId);
  const [a, setA] = useState<any>(null);

  useEffect(() => { (async () => setA(await Services.assignments.getDetail(cid, aid)))(); }, [cid, aid]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-2">Assessment</Text>
      <Text className="text-neutral-500 dark:text-neutral-400 mb-4">{aid}</Text>
      {a ? (
        <View className="gap-3">
          <Text className="text-xl font-semibold">{a.title}</Text>
          {a.dueAt && <Text className="text-neutral-500 dark:text-neutral-400">Due {a.dueAt}</Text>}
          <Link href={{ pathname: '/(teacher)/course/[courseId]/submissions/[assessmentId]', params: { courseId: cid, assessmentId: aid } } as any} asChild>
            <Button title="View Submissions" variant="secondary" />
          </Link>
        </View>
      ) : <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>}
    </SafeAreaView>
  );
}
