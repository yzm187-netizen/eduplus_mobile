import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CourseNav from '@/components/CourseNav';
import { Services } from '@/services/providers';
import type { Lesson, Note } from '@/data/academics';
import { formatRelativeShort } from '@/utils/date';
import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { randomImage } from '@/utils/imagePlaceholders';

export default function CourseLessonsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [ls, ns] = await Promise.all([
      Services.content.listLessons(id),
      Services.content.listNotes(id),
    ]);
    setLessons(ls);
    setNotes(ns);
  }

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <ScrollView className="px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <SectionHeader title="Lessons" subtitle={id} />
        <CourseNav courseId={id} active="lessons" />

        <View className="gap-4">
          <Card>
            <Text className="font-semibold mb-2">Lesson Outline</Text>
            {lessons.map((l) => (
              <View key={l.id} className="py-2 border-b border-neutral-100 dark:border-neutral-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <Image source={{ uri: randomImage(`lesson-${l.id}`, 120, 80) }} style={{ width: 56, height: 40, borderRadius: 8 }} />
                    <Text className="text-neutral-800 dark:text-neutral-100" numberOfLines={1}>{l.order}. {l.title}</Text>
                  </View>
                  <Pressable onPress={() => router.push((`/(student)/slides/${l.id}` as any))} className="px-3 py-1 rounded-xl bg-[#00AFC8]">
                    <Text className="text-white text-sm">View slides</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {lessons.length === 0 && <EmptyState title="No lessons yet" />}
          </Card>

          <Card>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-semibold">Notes & Resources</Text>
            </View>
            <View className="gap-3">
              {notes.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => router.push((`/(student)/viewer/${n.id}` as any))}
                >
                  <Card padded={true}>
                    <View className="flex-row items-center gap-3">
                      <Image source={{ uri: randomImage(`note-${n.id}`, 120, 80) }} style={{ width: 56, height: 40, borderRadius: 8 }} />
                      <View className="flex-1">
                        <Text className="font-semibold" numberOfLines={1}>{n.title}</Text>
                        <Text className="text-xs text-neutral-500 mt-1">{formatRelativeShort(n.createdAt)} • {n.visibility}</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
              {notes.length === 0 && <EmptyState title="No notes yet" />}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
