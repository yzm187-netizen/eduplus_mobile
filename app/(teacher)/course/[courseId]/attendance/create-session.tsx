import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function CreateSessionScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [topic, setTopic] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    setLoading(true);
    try { await Services.schedule.createLesson(id, { topic, startsAt, endsAt }); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Create Session</Text>
      <View className="gap-3">
        <View>
          <Text className="font-medium mb-1">Topic</Text>
          <TextInput value={topic} onChangeText={setTopic} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <View>
          <Text className="font-medium mb-1">Starts At (ISO)</Text>
          <TextInput value={startsAt} onChangeText={setStartsAt} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <View>
          <Text className="font-medium mb-1">Ends At (ISO)</Text>
          <TextInput value={endsAt} onChangeText={setEndsAt} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <Button title={loading ? 'Creating…' : 'Create'} onPress={onCreate} loading={loading} disabled={!startsAt || !endsAt} />
      </View>
    </SafeAreaView>
  );
}
