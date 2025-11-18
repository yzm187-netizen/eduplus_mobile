import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerHeader } from '@/components/BannerHeader';
import { Services } from '@/services/providers';
import { useRouter } from 'expo-router';

export default function NewCourseScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onCreate = useCallback(async () => {
    if (!name || !code) return Alert.alert('Missing info', 'Enter course name and code');
    setLoading(true);
    try {
      const c = await Services.courses.createCourse({ name: name.trim(), code: code.trim() });
      Alert.alert('Course created', `${c.name} (${c.code})`);
      router.replace(`/(student)/course/${c.id}` as any);
    } catch (e: any) {
      console.error('Create course failed', e);
      Alert.alert('Failed', e?.message || 'Unable to create course');
    } finally {
      setLoading(false);
    }
  }, [name, code, router]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <BannerHeader height={180} backgroundMode="cover" backgroundAnchorY="top" floating showText={false}>
          <View>
            <Text className="text-3xl font-extrabold text-white">New Course</Text>
            <Text className="text-white/80 mt-1">Create a class you will teach</Text>
          </View>
        </BannerHeader>
        <View className="px-6 -mt-12">
          <View className="rounded-3xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <Text className="text-lg font-semibold mb-4">Details</Text>
            <View className="mb-4">
              <Text className="text-sm mb-2 text-neutral-600 dark:text-neutral-300">Course Name</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="e.g. Calculus I"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View className="mb-6">
              <Text className="text-sm mb-2 text-neutral-600 dark:text-neutral-300">Course Code</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="e.g. MATH101"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />
            </View>
            <TouchableOpacity
              disabled={loading}
              onPress={onCreate}
              className="rounded-lg py-3 items-center disabled:opacity-60"
              style={{ backgroundColor: '#00AFC8' }}
            >
              <Text className="text-white font-semibold">{loading ? 'Creating…' : 'Create Course'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
