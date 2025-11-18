import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

type Props = {
  courseId: string;
  active: 'overview' | 'lessons' | 'assignments' | 'exams' | 'people';
  onSelect?: (key: 'overview' | 'lessons' | 'assignments' | 'exams' | 'people') => void;
  color?: string; // base banner / primary color name or hex
  accentColor?: string; // lighter accent override (if provided, used for selected tab background)
  baseGroup?: '(student)' | '(teacher)'; // which route group to link to; defaults to student
};

export default function CourseNav({ courseId, active, onSelect, color, accentColor, baseGroup = '(student)' }: Props) {
  const router = useRouter();
  const tabs: Array<{ key: Props['active']; label: string; path: (group: string, id: string) => string }> = [
    { key: 'overview', label: 'Overview', path: (g, id) => `/${g}/course/${id}/overview` },
    { key: 'lessons', label: 'Lessons', path: (g, id) => `/${g}/course/${id}/lessons` },
    { key: 'assignments', label: 'Assignments', path: (g, id) => `/${g}/course/${id}/assignments` },
    { key: 'exams', label: 'Exams', path: (g, id) => `/${g}/course/${id}/exams` },
    { key: 'people', label: 'People', path: (g, id) => `/${g}/course/${id}/people` },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }} className="bg-transparent mb-4">
      <View className="flex-row">
        {tabs.map((t) => {
          const selected = t.key === active;
          const handlePress = () => {
            if (onSelect) onSelect(t.key);
            else router.replace((t.path(baseGroup, courseId) as any));
          };
          return (
            <Pressable
              key={t.key}
              onPress={handlePress}
              className={
                'mr-2 px-3 py-2 rounded-full border ' +
                (selected
                  ? 'bg-transparent border-transparent' // actual colors applied via style below
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800')
              }
              style={selected ? { backgroundColor: accentColor || color || '#00AFC8', borderColor: accentColor || color || '#00AFC8', borderWidth: 1 } : undefined}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text className={selected ? 'text-white font-semibold' : 'text-neutral-700 dark:text-neutral-200'}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
