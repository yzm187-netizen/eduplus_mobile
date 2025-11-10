import React, { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function GradeSubmissionScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const sid = String(submissionId);
  const [sub, setSub] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => setSub(await Services.submissions.get(sid)))(); }, [sid]);

  const onGrade = async () => {
    setLoading(true);
    try { await Services.submissions.grade(sid, { grade: Number(grade), feedback }); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-2">Grade Submission</Text>
      <Text className="text-neutral-500 dark:text-neutral-400 mb-4">{sid}</Text>
      {sub ? (
        <View className="gap-4">
          <Text className="font-semibold">Student / Group: {sub.studentName || sub.groupName || sub.studentId}</Text>
          <Text className="text-neutral-500 dark:text-neutral-400">Status: {sub.status}</Text>
          <View>
            <Text className="font-medium mb-1">Grade</Text>
            <TextInput value={grade} onChangeText={setGrade} keyboardType="number-pad" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
          </View>
          <View>
            <Text className="font-medium mb-1">Feedback</Text>
            <TextInput value={feedback} onChangeText={setFeedback} multiline className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
          </View>
          <Button title={loading ? 'Saving…' : 'Save Grade'} onPress={onGrade} loading={loading} disabled={!grade} />
        </View>
      ) : <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>}
    </SafeAreaView>
  );
}
