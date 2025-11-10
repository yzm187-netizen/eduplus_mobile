import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function CreateCourseScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    try {
      setLoading(true);
  const course = await Services.courses.createCourse({ name, code });
      // TODO: navigate to course overview
      console.log('Created course', course?.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Create Course</Text>
      <View className="gap-3">
        <View>
          <Text className="font-medium mb-1">Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g., Mathematics 101" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <View>
          <Text className="font-medium mb-1">Code</Text>
          <TextInput value={code} onChangeText={setCode} placeholder="e.g., MATH101" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <Button title={loading ? 'Creating…' : 'Create Course'} onPress={onCreate} loading={loading} disabled={!name || !code} />
      </View>
    </SafeAreaView>
  );
}
