import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function SubmitAssignmentScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const aid = String(assignmentId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const onSubmit = async () => {
    setSending(true);
    try {
      const res = await Services.submissions.submit?.(aid, { content });
      setSubmittedId(res?.id || null);
    } finally { setSending(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Submit Assignment</Text>
      {submittedId ? (
        <Text className="text-emerald-600 font-medium">Submitted! ID {submittedId}</Text>
      ) : (
        <View className="gap-4">
          <View>
            <Text className="font-medium mb-1">Content</Text>
            <TextInput value={content} onChangeText={setContent} multiline placeholder="Write your answer or summary" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3 min-h-[120px]" />
          </View>
          <Button title={sending ? 'Submitting…' : 'Submit'} onPress={onSubmit} loading={sending} disabled={!content} />
        </View>
      )}
    </SafeAreaView>
  );
}
