import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

type Props = {
  courseId: string;
  active: 'overview' | 'lessons' | 'assignments' | 'exams' | 'people';
};

const tabs: Array<{ key: Props['active']; label: string; path: (id: string) => string }> = [
  { key: 'overview', label: 'Overview', path: (id) => `/(student)/course/${id}/overview` },
  { key: 'lessons', label: 'Lessons', path: (id) => `/(student)/course/${id}/lessons` },
  { key: 'assignments', label: 'Assignments', path: (id) => `/(student)/course/${id}/assignments` },
  { key: 'exams', label: 'Exams', path: (id) => `/(student)/course/${id}/exams` },
  { key: 'people', label: 'People', path: (id) => `/(student)/course/${id}/people` },
];

export default function CourseNav({ courseId, active }: Props) {
  const router = useRouter();
  return (
    <View className="flex-row bg-transparent mb-4">
      {tabs.map((t) => {
        const selected = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => router.replace((t.path(courseId) as any))}
            className={
              'mr-2 px-3 py-2 rounded-full border ' +
              (selected
                ? 'bg-[#00AFC8] border-[#00AFC8]'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800')
            }
          >
            <Text className={selected ? 'text-white font-semibold' : 'text-neutral-700 dark:text-neutral-200'}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
