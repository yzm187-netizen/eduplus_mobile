import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Services } from '@/services/providers';
import type { AssignmentRef } from '@/data/sample';
import { formatDateTime, formatRelativeShort } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import CircleProgress from '@/components/CircleProgress';

export default function TeacherCourseAssignmentsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const router = useRouter();
  const [items, setItems] = useState<AssignmentRef[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingDueDays, setPendingDueDays] = useState('7');
  const [pendingDescription, setPendingDescription] = useState('');
  const [pendingType, setPendingType] = useState<'individual' | 'group'>('individual');
  const TITLE_LIMIT = 120;
  const DESC_LIMIT = 600;

  async function load() {
    if (!id) return;
    const list = await Services.assignments.listByCourse(id);
    setItems(list);
    // Auto-seed one individual and one group assignment if none exist yet
    if (list.length === 0) {
      try {
        const ind = await Services.assignments.create(id, { title: 'Reflection Essay', type: 'assignment', groupType: 'individual', description: 'Individual reflective writing.', dueAt: new Date(Date.now()+5*24*60*60*1000).toISOString() });
        const grp = await Services.assignments.create(id, { title: 'Group Prototype Draft', type: 'assignment', groupType: 'group', description: 'Collaborative prototype deliverable.', dueAt: new Date(Date.now()+10*24*60*60*1000).toISOString() });
        setItems([grp, ind]);
      } catch (e) { console.warn('Seed assignments failed', e); }
    }
  }
  useEffect(() => { load(); }, [id]);
  useFocusEffect(
    React.useCallback(() => {
      // Reload on focus to reflect edits made in detail screen
      load();
      return () => {};
    }, [id])
  );

  const onRefresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };

  const sorted = useMemo(() => items.slice().sort((a,b)=> new Date(a.dueAt).getTime()-new Date(b.dueAt).getTime()), [items]);

  // Aggregate group counts and overall progress across groups
  const [groupStats, setGroupStats] = useState<Record<string, { groups: number; pct: number }>>({});
  useEffect(() => {
    (async () => {
      const acc: Record<string, { groups: number; pct: number }> = {};
      for (const a of items) {
        try {
          const groups = await Services.assignments.listGroups?.(a.id);
          const detail = await Services.assignments.getDetail(a.courseId, a.id);
          let totalLeaves = 0;
          const sections = (() => { try { return detail?.sectionsJson ? JSON.parse(String(detail.sectionsJson)) : []; } catch { return []; } })();
          const countLeaves = (nodes: any[]) => {
            let t = 0;
            const walk = (arr: any[]) => { for (const n of arr || []) { if (n.children && n.children.length) walk(n.children); else t += 1; } };
            walk(nodes);
            return t;
          };
          for (const s of sections) { totalLeaves += countLeaves(Array.isArray(s.tasks) ? s.tasks : []); }
          let sumPct = 0; let gcount = (groups || []).length || 0;
          if (gcount === 0) {
            acc[a.id] = { groups: 0, pct: 0 };
            continue;
          }
          for (const g of (groups || [])) {
            try {
              const prog = await Services.assignments.getOrCreateProgress?.(a.id, g.id);
              const map = prog?.progress || {} as Record<string, boolean>;
              // Prefer overlay task leaves per group if present
              let groupLeaves = totalLeaves;
              try {
                const overlay = (prog as any)?.tasksOverlay || {} as Record<string, any[]>;
                let t = 0; const walk = (arr: any[]) => { for (const n of arr||[]) { if (n.children && n.children.length) walk(n.children); else t += 1; } };
                for (const secKey of Object.keys(overlay)) walk(overlay[secKey] || []);
                if (t > 0) groupLeaves = t;
              } catch {}
              const doneLeaves = Object.values(map).filter(Boolean).length;
              const pct = groupLeaves === 0 ? 0 : Math.round((doneLeaves / groupLeaves) * 100);
              sumPct += pct;
            } catch {}
          }
          const avgPct = gcount ? Math.round(sumPct / gcount) : 0;
          acc[a.id] = { groups: gcount, pct: avgPct };
        } catch {}
      }
      setGroupStats(acc);
    })();
  }, [items]);

  async function createAssignment() {
    if (!pendingTitle.trim()) return;
    const days = parseInt(pendingDueDays, 10); const dueAt = new Date(Date.now() + (isNaN(days)?7:days)*24*60*60*1000).toISOString();
    try {
      const created = await Services.assignments.create(id, {
        title: pendingTitle.trim(),
        type: 'assignment',
        dueAt,
        description: pendingDescription.trim(),
        groupType: pendingType,
      });
      setItems(prev => [created, ...prev]);
      setAddVisible(false);
      setPendingTitle(''); setPendingDueDays('7'); setPendingDescription(''); setPendingType('individual');
    } catch (e) {
      console.warn('Create assignment failed', e);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}> 
      <View className="flex-row items-center justify-between mb-3 px-4">
        <Text className="text-lg font-semibold">Assignments</Text>
        <Pressable onPress={()=> setAddVisible(true)} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F97316' }}>
          <Text className="text-white font-semibold">Add</Text>
        </Pressable>
      </View>
      <View className="gap-3 px-4">
        {sorted.map(a => {
          const date = new Date(a.dueAt);
          const stats = groupStats[a.id] || { groups: 0, pct: 0 };
          return (
            <Pressable key={a.id} onPress={() => router.push((`/assignment/${a.id}?courseId=${id}` as any))} className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 active:opacity-90">
              <View className="flex-row items-start justify-between gap-3">
                <View className="items-center justify-center" style={{ width: 52 }}>
                  <CircleProgress size={44} strokeWidth={6} progress={(stats.pct||0)/100} progressColor="#4F46E5" trackColor="#E5E7EB" />
                  <Text className="text-[10px] text-neutral-700 dark:text-neutral-300" style={{ position: 'absolute' }}>{stats.pct || 0}%</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text className="font-semibold" numberOfLines={1}>{a.title}</Text>
                  <Text className="text-neutral-500 dark:text-neutral-400 text-xs" numberOfLines={1}>Due {formatDateTime(date)} · {formatRelativeShort(date)}</Text>
                  { (a as any).groupType && (
                    <View className="mt-1 px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: (a as any).groupType === 'group' ? '#4F46E5' : '#6B7280' }}>
                      <Text className="text-[10px] text-white uppercase tracking-wide">{(a as any).groupType === 'group' ? 'Group' : 'Individual'}</Text>
                    </View>
                  )}
                  <View className="mt-1 flex-row items-center gap-2">
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text className="text-[11px] text-neutral-600 dark:text-neutral-300">{stats.groups} {stats.groups === 1 ? 'group' : 'groups'}</Text>
                  </View>
                  { a.description && a.description.length > 0 && (
                    <Text className="text-[12px] text-neutral-600 dark:text-neutral-300 mt-2" numberOfLines={3}>{a.description}</Text>
                  )}
                </View>
                <Pressable onPress={() => router.push((`/assignment/${a.id}?courseId=${id}` as any))} className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: '#F97316' }}>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
        {sorted.length === 0 && (
          <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <Text className="text-neutral-500 dark:text-neutral-400">No assignments yet.</Text>
          </View>
        )}
      </View>
      {/* Add assignment modal */}
      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={()=> setAddVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={()=> setAddVisible(false)}>
          <View className="flex-1 justify-end">
            <Pressable onPress={()=>{}} className="w-full rounded-t-2xl bg-white dark:bg-neutral-900 p-4" style={{ elevation: 6 }}>
              <Text className="text-base font-semibold mb-3 dark:text-white">New Assignment</Text>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Title</Text>
                <TextInput value={pendingTitle} onChangeText={(t)=>{ if (t.length<=TITLE_LIMIT) setPendingTitle(t); }} placeholder="Assignment title" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingTitle.length}/{TITLE_LIMIT}</Text>
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Due (days from now)</Text>
                <TextInput value={pendingDueDays} onChangeText={setPendingDueDays} keyboardType="number-pad" placeholder="7" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Type</Text>
                <View className="flex-row gap-3">
                  {(['individual','group'] as const).map(t => (
                    <Pressable key={t} onPress={()=> setPendingType(t)} className="px-3 py-2 rounded-xl" style={{ backgroundColor: pendingType === t ? '#F97316' : '#E5E7EB' }}>
                      <Text className={pendingType === t ? 'text-white font-semibold' : 'text-neutral-700'}>{t === 'group' ? 'Group' : 'Individual'}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Description (optional)</Text>
                <TextInput value={pendingDescription} onChangeText={(t)=>{ if (t.length<=DESC_LIMIT) setPendingDescription(t); }} placeholder="Short description" multiline numberOfLines={6} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" style={{ minHeight: 110, textAlignVertical: 'top' }} />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingDescription.length}/{DESC_LIMIT}</Text>
              </View>
              <View className="flex-row justify-end gap-3 mt-2">
                <Pressable onPress={()=> setAddVisible(false)} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Cancel</Text></Pressable>
                <Pressable disabled={!pendingTitle.trim()} onPress={createAssignment} className="px-4 py-2 rounded-xl" style={{ backgroundColor: !pendingTitle.trim() ? '#9CA3AF' : '#F97316' }}>
                  <Text className="text-white font-semibold">Create</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
