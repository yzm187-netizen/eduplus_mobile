import React, { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function EditCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [course, setCourse] = useState<any>(null);
  const [name, setName] = useState('');
  const [gradingRule, setGradingRule] = useState('60/40');
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => { const c = await Services.courses.getCourse(id); setCourse(c); setName(c?.name || ''); })(); }, [id]);

  const onSave = async () => {
    setLoading(true);
  try { await Services.courses.updateCourse(id, { name, gradingRule }); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Edit Course</Text>
      {course ? (
        <View className="gap-4">
          <View>
            <Text className="font-medium mb-1">Name</Text>
            <TextInput value={name} onChangeText={setName} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
          </View>
          <View>
            <Text className="font-medium mb-1">Grading Rule</Text>
            <TextInput value={gradingRule} onChangeText={setGradingRule} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
          </View>
          <Button title={loading ? 'Saving…' : 'Save'} onPress={onSave} loading={loading} disabled={!name} />
        </View>
      ) : <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>}
    </SafeAreaView>
  );
}
