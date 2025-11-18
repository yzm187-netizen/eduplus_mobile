import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';
import { router } from 'expo-router';

export default function EditCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const [course, setCourse] = useState<any>(null);
  const [name, setName] = useState('');
  const [gradingRule, setGradingRule] = useState('60/40');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { (async () => {
    const c = await Services.courses.getCourse(id);
    setCourse(c);
    setName(c?.name || '');
    setCode(c?.code || '');
    setDescription(c?.description || '');
  })(); }, [id]);

  const onSave = async () => {
    setLoading(true);
    try {
      await Services.courses.updateCourse(id, { name, code, gradingRule, description: description || null });
      Alert.alert('Saved', 'Course updated.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    Alert.alert('Delete course?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            if (Services.courses.deleteCourse) {
              await Services.courses.deleteCourse(id);
              Alert.alert('Deleted', 'Course removed.');
              router.replace('/(teacher)/(tabs)/my-courses');
            } else {
              Alert.alert('Not supported', 'Delete is not available in this mode.');
            }
          } finally {
            setDeleting(false);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-extrabold mb-4">Edit Course</Text>
          {course ? (
            <View className="gap-4">
              <View>
                <Text className="font-medium mb-1">Title</Text>
                <TextInput value={name} onChangeText={setName} className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
              </View>
              <View>
                <Text className="font-medium mb-1">Code</Text>
                <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
              </View>
              <View>
                <Text className="font-medium mb-1">Description</Text>
                <View className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <TextInput
                    value={description}
                    onChangeText={(t)=> setDescription(t.slice(0, 2000))}
                    multiline
                    numberOfLines={8}
                    placeholder="Enter an academic catalog-style description."
                    className="px-4 py-3 text-base text-neutral-900 dark:text-neutral-100"
                    style={{ minHeight: 160, textAlignVertical: 'top' }}
                  />
                  <View className="px-4 pb-3">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">{description.length}/2000</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button title={loading ? 'Saving…' : 'Save'} onPress={onSave} loading={loading} disabled={!name || !code} />
                </View>
                <View style={{ width: 120 }}>
                  <Button title={deleting ? 'Deleting…' : 'Delete'} onPress={onDelete} loading={deleting} variant="danger" />
                </View>
              </View>
            </View>
          ) : <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
