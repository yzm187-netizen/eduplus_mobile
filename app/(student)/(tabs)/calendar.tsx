import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Services } from '@/services/providers';
import type { CalendarItem } from '@/data/schedule';
import { useRouter } from 'expo-router';
import { useState as useReactState } from 'react';
import { Calendar } from 'react-native-calendars';
import { formatDateTime, formatRelativeShort } from '@/utils/date';

export default function StudentCalendarScreen() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [courseCodes, setCourseCodes] = useState<Record<string, string>>({});
  const router = useRouter();
  const [mode, setMode] = useReactState<'agenda' | 'month'>('agenda');

  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    const all = await Services.schedule.listCalendarItems();
    setItems(all);
    const courses = await Services.courses.listMyCourses();
    setCourseCodes(Object.fromEntries(courses.map((c) => [c.id, c.code])));
  }

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const sorted = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => getDateMs(a) - getDateMs(b));
  }, [items]);

  // Marked dates for month view
  const marked = useMemo(() => {
    const m: Record<string, { marked: boolean }> = {};
    for (const it of items) {
      const d = new Date(it.type === 'assignment' ? it.dueAt : it.startsAt);
      const key = d.toISOString().slice(0, 10);
      m[key] = { marked: true };
    }
    return m;
  }, [items]);

  function getDateMs(it: CalendarItem) {
    return new Date(it.type === 'assignment' ? it.dueAt : it.startsAt).getTime();
  }

  function renderSubtitle(it: CalendarItem) {
    const date = new Date(it.type === 'assignment' ? it.dueAt : it.startsAt);
    const label = it.type === 'session' ? 'Class' : it.type === 'exam' ? 'Exam' : 'Assignment';
    const when = it.type === 'assignment' ? `Due ${formatDateTime(date)}` : formatDateTime(date);
    return `${label} • ${when} · ${formatRelativeShort(date)}`;
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <ScrollView
        className="px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-2xl font-extrabold mb-2">Agenda</Text>
        <View className="flex-row gap-2 mb-4">
          {(['agenda', 'month'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} className={`px-3 py-2 rounded-full border ${mode === m ? 'bg-[#00AFC8] border-[#00AFC8]' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>
              <Text className={mode === m ? 'text-white font-semibold' : 'text-neutral-700 dark:text-neutral-200'}>{m === 'agenda' ? 'Agenda' : 'Month'}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'month' ? (
          <View className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mb-4">
            <Calendar markedDates={marked} />
          </View>
        ) : null}

        <View className="gap-3">
          {sorted.map((it) => {
            const key = `${it.type}:${it.id}`;
            const onPress = () => {
              if (it.type === 'assignment') router.push((`/(student)/course/${it.courseId}/assignments/${it.id}` as any));
              else router.push((`/(student)/course/${it.courseId}/${it.type === 'exam' ? 'exams' : 'overview'}` as any));
            };
            return (
              <Pressable
                key={key}
                onPress={onPress}
                className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <Text className="font-semibold mb-1">{it.title}</Text>
                <Text className="text-neutral-500 dark:text-neutral-400">{courseCodes[it.courseId] ?? ''}</Text>
                <Text className="text-neutral-500 dark:text-neutral-400 mt-1">{renderSubtitle(it)}</Text>
              </Pressable>
            );
          })}
          {sorted.length === 0 && (
            <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-neutral-500 dark:text-neutral-400">No upcoming items.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
