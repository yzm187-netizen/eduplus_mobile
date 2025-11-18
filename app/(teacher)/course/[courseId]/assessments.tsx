import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Link } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function TeacherAssessmentsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [assessments, setAssessments] = useState<Array<{ id: string; title: string; dueAt: string }>>([]);

  useEffect(() => { (async () => {
    const list = await Services.assignments.listByCourse(id);
    setAssessments(list.map(a => ({ id: a.id, title: a.title, dueAt: a.dueAt })));
  })(); }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Assessments</Text>
      <View className="rounded-2xl mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {assessments.map(a => (
          <Link key={a.id} href={{ pathname: '/(teacher)/course/[courseId]/assessment/[assessmentId]', params: { courseId: id, assessmentId: a.id } } as any} asChild>
            <Pressable className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <Text className="font-medium">{a.title}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400 text-sm">Due {a.dueAt}</Text>
            </Pressable>
          </Link>
        ))}
        {assessments.length === 0 && <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No assessments yet.</Text></View>}
      </View>
    </SafeAreaView>
  );
}
