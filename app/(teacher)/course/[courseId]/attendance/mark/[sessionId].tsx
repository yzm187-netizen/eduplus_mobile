import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function MarkAttendanceScreen() {
  const { courseId, sessionId } = useLocalSearchParams<{ courseId: string; sessionId: string }>();
  const sid = String(sessionId);
  const [roster, setRoster] = useState<Array<{ id: string; name: string; status?: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => setRoster(await Services.attendance.listSessionRoster(String(courseId), sid)))(); }, [courseId, sid]);

  const toggle = (id: string, status: string) => {
    setRoster(r => r.map(p => p.id === id ? { ...p, status } : p));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const p of roster) {
        const status = (p.status === 'late' || p.status === 'absent' || p.status === 'excused') ? p.status : 'present';
        await Services.attendance.mark(sid, p.id, status);
      }
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Mark Attendance</Text>
      <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        {roster.map(p => (
          <View key={p.id} className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <Text className="font-medium mb-1">{p.name}</Text>
            <View className="flex-row gap-2">
              {['present','late','absent','excused'].map(s => (
                <Pressable key={s} onPress={() => toggle(p.id, s)} className={`px-3 py-1 rounded-full ${p.status===s ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                  <Text className={`text-xs font-medium ${p.status===s ? 'text-white' : 'text-neutral-800 dark:text-neutral-100'}`}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {roster.length === 0 && <View className="p-4"><Text className="text-neutral-500 dark:text-neutral-400">No roster loaded.</Text></View>}
      </View>
      <View className="mt-4">
        <Button title={saving ? 'Saving…' : 'Save Attendance'} onPress={saveAll} loading={saving} disabled={roster.length===0} />
      </View>
    </SafeAreaView>
  );
}
