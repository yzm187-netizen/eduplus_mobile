import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import { courseAccentColor } from '@/utils/courseColor';
import type { AssignmentRef } from '@/data/sample';
import { formatDateTime, formatRelativeShort } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import CircleProgress from '@/components/CircleProgress';
import { useAssignmentTasksStore } from '@/store/assignmentTasks';
import type { TaskNode } from '@/types/tasks';

export default function CourseAssignmentsListScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const router = useRouter();
  const [items, setItems] = useState<AssignmentRef[]>([]);
  const [accent, setAccent] = useState<string>('#00AFC8');

  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!id) return;
    const list = await Services.assignments.listByCourse(id);
    setItems(list);
  }

  useEffect(() => {
    load();
    (async () => {
      try {
        const c = await Services.courses.getCourse(id);
        setAccent(courseAccentColor(c?.color));
      } catch {}
    })();
  }, [id]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const sorted = useMemo(
    () => items.slice().sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [items]
  );

  // Subscribe to assignment tasks so index cards recompute progress when tasks change
  const byAssignment = useAssignmentTasksStore((s) => s.byAssignment);

  const leafCounts = useCallback((nodes: TaskNode[] | undefined) => {
    if (!nodes || nodes.length === 0) return { total: 0, done: 0 };
    let total = 0;
    let done = 0;
    const walk = (arr: TaskNode[]) => {
      for (const n of arr) {
        if (!n.children || n.children.length === 0) {
          total += 1;
          if (n.done) done += 1;
        } else {
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return { total, done };
  }, []);

  const overallProgress = useCallback((assignmentId: string) => {
    const sections = byAssignment[assignmentId] || [];
    let total = 0, done = 0;
    for (const s of sections) {
      const c = leafCounts(s.tasks);
      total += c.total;
      done += c.done;
    }
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [byAssignment, leafCounts]);

  const topUnitsFor = useCallback((assignmentId: string, limit = 4) => {
    const sections = byAssignment[assignmentId] || [];
    // Flatten top-level tasks across sections, up to limit
    const units: TaskNode[] = [];
    for (const s of sections) {
      for (const t of s.tasks || []) {
        units.push(t);
        if (units.length >= limit) break;
      }
      if (units.length >= limit) break;
    }
    return units;
  }, [byAssignment]);

  const unitProgress = useCallback((node: TaskNode) => {
    const c = leafCounts(node.children || []);
    const pct = c.total === 0 ? (node.done ? 100 : 0) : Math.round((c.done / c.total) * 100);
    // If it has no children, treat itself as the leaf
    if (!node.children || node.children.length === 0) {
      return node.done ? 100 : 0;
    }
    return pct;
  }, [leafCounts]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-3">
          {sorted.map((a) => {
            const date = new Date(a.dueAt);
            const p = overallProgress(a.id);
            const units = topUnitsFor(a.id);
            const isOpen = !!expanded[a.id];
            return (
              <View key={a.id} className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {/* Header */}
                <Pressable onPress={() => toggleExpanded(a.id)} className="p-4 flex-row items-center gap-3">
                  <View className="relative">
                    <CircleProgress size={44} strokeWidth={6} progress={p.pct / 100} progressColor="#F97316" trackColor="#E5E7EB" />
                    <View className="absolute inset-0 items-center justify-center">
                      <Text className="text-[10px] text-neutral-700 dark:text-neutral-300">{p.pct}%</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold" numberOfLines={1}>{a.title}</Text>
                    <Text className="text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                      Due {formatDateTime(date)} · {formatRelativeShort(date)}
                    </Text>
                    { (a as any).groupType && (
                      <View className="mt-1 px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: (a as any).groupType === 'group' ? '#4F46E5' : '#6B7280' }}>
                        <Text className="text-[10px] text-white uppercase tracking-wide">{(a as any).groupType === 'group' ? 'Group' : 'Individual'}</Text>
                      </View>
                    )}
                    <Pressable onPress={() => toggleExpanded(a.id)} className="mt-1 self-start px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      <Text className="text-[11px] text-neutral-700 dark:text-neutral-300">{isOpen ? 'Hide Details' : 'See Details'}</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => router.push((`/assignment/${a.id}?courseId=${id}` as any))} className="h-10 w-10 rounded-full bg-orange-500 items-center justify-center">
                    <Ionicons name="play" size={18} color="#fff" />
                  </Pressable>
                </Pressable>

                {/* Divider */}
                {isOpen && <View className="h-px bg-neutral-200 dark:bg-neutral-800 mx-4" />}

                {/* Units preview */}
                {isOpen && (
                  <View className="px-4 pt-3 pb-3 gap-3">
                    {a.description && (
                      <Text className="text-[12px] text-neutral-600 dark:text-neutral-300 mb-2" numberOfLines={3}>{a.description}</Text>
                    )}
                    {units.length > 0 ? (
                      units.map((u) => {
                        const up = unitProgress(u);
                        const done = up === 100;
                        return (
                          <View key={u.id} className="flex-row items-center gap-3">
                            <View className="flex-1">
                              <Text className="text-[13px] mb-1" numberOfLines={1}>{u.title}</Text>
                              <View className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <View style={{ width: `${up}%`, backgroundColor: done ? accent : '#F97316' }} className="h-full" />
                              </View>
                            </View>
                            <Text className="w-12 text-right text-[11px] text-neutral-500 dark:text-neutral-400">{up}%</Text>
                            <Ionicons name={done ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={done ? '#10b981' : '#9CA3AF'} />
                            <Pressable className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
                              <Ionicons name="play-circle-outline" size={20} color="#9CA3AF" />
                            </Pressable>
                          </View>
                        );
                      })
                    ) : (
                      <Text className="text-neutral-500 dark:text-neutral-400">No units yet.</Text>
                    )}

                    {/* Add New Unit */}
                    <Pressable onPress={() => router.push((`/assignment/${a.id}?courseId=${id}` as any))} className="mt-1 rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 items-center justify-center">
                      <Text className="text-orange-600">Add New Unit</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
          {sorted.length === 0 && (
            <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-neutral-500 dark:text-neutral-400">No assignments yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
  );
}
