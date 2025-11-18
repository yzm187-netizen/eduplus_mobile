import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { courseColorBannerImage } from '@/utils/courseColor';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Services } from '@/services/providers';
import type { Course } from '@/data/sample';
import { useRouter } from 'expo-router';
import { BannerHeader } from '@/components/BannerHeader';

export default function AllCoursesScreen() {
  const [items, setItems] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => setItems(await Services.courses.listMyCourses()))();
  }, []);


  const [teacherByCourse, setTeacherByCourse] = useState<Record<string, { name: string; avatarUrl?: string } | null>>({});
  useEffect(() => {
    (async () => {
      const pairs = await Promise.all(items.map(async (c) => {
        try {
          const roster = await Services.people.listCoursePeople(c.id);
          const t = roster.find(r => r.role === 'teacher') || null;
          return [c.id, t ? { name: t.name, avatarUrl: t.avatarUrl } : null] as const;
        } catch { return [c.id, null] as const; }
      }));
      const map: Record<string, { name: string; avatarUrl?: string } | null> = {};
      for (const [id, v] of pairs) map[id] = v;
      setTeacherByCourse(map);
    })();
  }, [items]);

  // Add course modal state
  const [addVisible, setAddVisible] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingCode, setPendingCode] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [pendingColor, setPendingColor] = useState<'blue'|'green'|'purple'|'red'>('blue');
  const NAME_LIMIT = 80;
  const DESC_LIMIT = 240;

  async function createCourse() {
    if (!pendingName.trim() || !pendingCode.trim()) return;
    try {
      const created = await Services.courses.createCourse({ name: pendingName.trim(), code: pendingCode.trim(), description: pendingDescription.trim() || null, color: pendingColor });
      setItems(prev => [created, ...prev]);
      setAddVisible(false);
      setPendingName(''); setPendingCode(''); setPendingDescription('');
      setPendingColor('blue');
      router.push((`/(student)/course/${created.id}` as any));
    } catch (e) {
      console.warn('Create course failed', e);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <BannerHeader>
        <View>
          <Text className="text-3xl font-extrabold text-white">My Courses</Text>
          <Text className="text-white/80 mt-1">Manage and explore</Text>
        </View>
        <View className="absolute right-4 bottom-4">
          <Pressable onPress={() => setAddVisible(true)} className="px-4 py-2 rounded-xl bg-white/20 border border-white/30">
            <Text className="text-white font-semibold">Add Course</Text>
          </Pressable>
        </View>
      </BannerHeader>
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 32, paddingTop: 200 }}>
        <View className="-mt-24 mb-4" />
        <View className="gap-3">
          {items.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push((`/(student)/course/${c.id}` as any))}
              className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <View style={{ height: 120 }}>
                <ExpoImage
                  source={courseColorBannerImage(c.color)}
                  contentFit="cover"
                  contentPosition="top"
                  cachePolicy="memory-disk"
                  priority="low"
                  style={{ position: 'absolute', inset: 0 }}
                />
                <View className="absolute left-4 right-4 bottom-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-extrabold" numberOfLines={1}>{c.name}</Text>
                    <Text className="text-white/80 text-xs" numberOfLines={1}>{c.code}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border border-white/30">
                      {teacherByCourse[c.id]?.avatarUrl ? (
                        <ExpoImage source={{ uri: teacherByCourse[c.id]?.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center"><Text className="text-[10px] text-white font-semibold">{(teacherByCourse[c.id]?.name || 'T')[0]}</Text></View>
                      )}
                    </View>
                    <View className="w-20 h-2 rounded-full bg-white/25 overflow-hidden">
                      <View style={{ width: '30%' }} className="h-full bg-emerald-400" />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
          {items.length === 0 && (
            <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-neutral-500 dark:text-neutral-400">No courses yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add course bottom sheet modal */}
      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => setAddVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setAddVisible(false)}>
          <View className="flex-1 justify-end">
            <Pressable onPress={() => {}} className="w-full rounded-t-2xl bg-white dark:bg-neutral-900 p-4" style={{ elevation: 6 }}>
              <Text className="text-base font-semibold mb-3 dark:text-white">New Course</Text>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Name</Text>
                <TextInput value={pendingName} onChangeText={(t)=>{ if (t.length<=NAME_LIMIT) setPendingName(t); }} placeholder="Course name" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingName.length}/{NAME_LIMIT}</Text>
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Code</Text>
                <TextInput value={pendingCode} onChangeText={setPendingCode} placeholder="e.g. CS 305" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Description (optional)</Text>
                <TextInput value={pendingDescription} onChangeText={(t)=>{ if (t.length<=DESC_LIMIT) setPendingDescription(t); }} placeholder="Short description" multiline numberOfLines={5} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" style={{ minHeight: 90, textAlignVertical: 'top' }} />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingDescription.length}/{DESC_LIMIT}</Text>
              </View>
              <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-2">Theme</Text>
              <View className="flex-row justify-between mb-4">
                {(['blue','green','purple','red'] as const).map((c) => (
                  <Pressable key={c} onPress={() => setPendingColor(c)} className="items-center">
                    <View className="w-12 h-8 rounded" style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'green' ? '#22c55e' : c === 'purple' ? '#8b5cf6' : '#ef4444', opacity: pendingColor === c ? 1 : 0.8, borderWidth: pendingColor === c ? 2 : 0, borderColor: '#111827' }} />
                    <Text className="text-xs mt-1 capitalize dark:text-white">{c}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row justify-end gap-3 mt-2">
                <Pressable onPress={() => setAddVisible(false)} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  <Text className="text-neutral-700 dark:text-neutral-200">Cancel</Text>
                </Pressable>
                <Pressable disabled={!pendingName.trim() || !pendingCode.trim()} onPress={createCourse} className="px-4 py-2 rounded-xl" style={{ backgroundColor: (!pendingName.trim() || !pendingCode.trim()) ? '#9ca3af' : '#111827' }}>
                  <Text className="text-white font-semibold">Create</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
