import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function CreateAssessmentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('assignment');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    setLoading(true);
    try { await Services.assignments.create(id, { title, type, dueAt }); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Create Assessment</Text>
      <View className="gap-3">
        <View>
          <Text className="font-medium mb-1">Title</Text>
          <TextInput value={title} onChangeText={setTitle} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <View>
          <Text className="font-medium mb-1">Type</Text>
          <TextInput value={type} onChangeText={setType} placeholder="assignment | test | exam" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <View>
          <Text className="font-medium mb-1">Due (ISO)</Text>
          <TextInput value={dueAt} onChangeText={setDueAt} placeholder="2025-12-01T10:00:00Z" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <Button title={loading ? 'Creating…' : 'Create'} onPress={onCreate} loading={loading} disabled={!title} />
      </View>
    </SafeAreaView>
  );
}
