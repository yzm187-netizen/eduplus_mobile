import React, { useCallback, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Pressable, TextInput, GestureResponderEvent, Animated, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import SwipeableRow, { type SwipeableRowHandle } from './SwipeableRow';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useChecklistUIStore, type UIState } from '@/store/checklists';
import type { TaskNode } from '@/types/tasks';
import SubmissionModal from '@/components/SubmissionModal';
import { useSubmissionsStore } from '@/store/submissions';

type Props = {
  nodes: TaskNode[];
  onChange: (nodes: TaskNode[]) => void;
  showAddRoot?: boolean;
  highlightTaskId?: string;
  onReply?: (taskId: string, title: string) => void;
  onRowLayout?: (taskId: string, y: number) => void;
  onStartEdit?: (taskId: string) => void;
  readOnly?: boolean; // when true, disable edits/toggles/add/delete
  currentUserId?: string; // used to attribute completion
  roster?: Array<{ id: string; name: string; avatarUrl?: string }>; // for avatar resolution
};

function toggleDone(nodes: TaskNode[], id: string): TaskNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, done: !n.done };
    if (n.children && n.children.length) return { ...n, children: toggleDone(n.children, id) };
    return n;
  });
}

function addChild(nodes: TaskNode[], id: string, newNode: TaskNode): TaskNode[] {
  return nodes.map((n) => {
    if (n.id === id) {
      const children = n.children ? [...n.children, newNode] : [newNode];
      return { ...n, children };
    }
    if (n.children && n.children.length) return { ...n, children: addChild(n.children, id, newNode) };
    return n;
  });
}

export type NestedChecklistHandle = {
  closeOpenRow: () => void;
};

function NestedChecklistImpl({ nodes, onChange, showAddRoot = false, highlightTaskId, onReply, onRowLayout, onStartEdit, readOnly = false, currentUserId, roster }: Props, ref: React.Ref<NestedChecklistHandle>) {
  const expandedMap = useChecklistUIStore((s: UIState) => s.expanded);
  const toggleExpanded = useChecklistUIStore((s: UIState) => s.toggle);
  const setExpanded = useChecklistUIStore((s: UIState) => s.setExpanded);
  const isExpanded = useCallback((id: string) => Boolean(expandedMap[id]), [expandedMap]);
  const openRowRef = useRef<SwipeableRowHandle | null>(null);
  const panMapRef = useRef<Record<string, Animated.ValueXY | null>>({});
  useImperativeHandle(ref, () => ({
    closeOpenRow: () => {
      if (openRowRef.current) {
        try { openRowRef.current.recenter(); } catch {}
        openRowRef.current = null;
      }
      setSwipingId(null);
    },
  }), []);
  // Per-row opacity refs for the right-side controls (Complete/Message)
  const iconsOpacityMapRef = useRef<Record<string, Animated.Value>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [addingMap, setAddingMap] = useState<Record<string, string>>({});
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [viewTaskId, setViewTaskId] = useState<string | null>(null);
  const addTaskSubmission = useSubmissionsStore((s) => s.addTaskSubmission);
  const getTaskSubmissions = useSubmissionsStore((s) => s.getTaskSubmissions);

  // Expand ancestors of highlighted node
  React.useEffect(() => {
    if (!highlightTaskId) return;
    const expandPath = (arr: TaskNode[]): boolean => {
      for (const n of arr) {
        if (n.id === highlightTaskId) return true;
        if (n.children && n.children.length && expandPath(n.children)) {
          setExpanded(n.id, true);
          return true;
        }
      }
      return false;
    };
    expandPath(nodes || []);
  }, [highlightTaskId, nodes, setExpanded]);

  const startAdd = useCallback((parentId: string) => {
    // Close any open swipe row so inputs are fully interactive
    if (openRowRef.current) {
      try { openRowRef.current.recenter(); } catch {}
      openRowRef.current = null;
      setSwipingId(null);
    }
    setAddingMap((prev) => ({ ...prev, [parentId]: '' }));
    if (parentId !== 'root') setExpanded(parentId, true);
  }, [setExpanded]);

  const cancelAdd = useCallback((parentId: string) => {
    setAddingMap((prev) => {
      const { [parentId]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  const confirmAdd = useCallback((parentId: string) => {
    if (readOnly) return;
    setAddingMap((prev) => {
      const draft = (prev[parentId] ?? '').trim();
      const { [parentId]: _omit, ...rest } = prev;
      if (!draft) return rest;
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newNode: TaskNode = { id, title: draft, done: false };
      if (parentId === 'root') onChange([...(nodes || []), newNode]);
      else onChange(addChild(nodes, parentId, newNode));
      return rest;
    });
  }, [nodes, onChange, readOnly]);

  const updateTitle = useCallback((nodesIn: TaskNode[], id: string, title: string): TaskNode[] => {
    return nodesIn.map((n) => {
      if (n.id === id) return { ...n, title };
      if (n.children && n.children.length) return { ...n, children: updateTitle(n.children, id, title) };
      return n;
    });
  }, []);

  const deleteNode = useCallback((nodesIn: TaskNode[], id: string): TaskNode[] => {
    const walk = (arr: TaskNode[]): TaskNode[] =>
      arr
        .filter((n) => n.id !== id)
        .map((n) => (n.children && n.children.length ? { ...n, children: walk(n.children) } : n));
    return walk(nodesIn);
  }, []);

  const setDoneLeaf = useCallback((nodesIn: TaskNode[], id: string, done: boolean): TaskNode[] => {
    const walk = (arr: TaskNode[]): TaskNode[] =>
      arr.map((n) => {
        if (n.id === id) {
          if (n.children && n.children.length) return n; // do not set parent directly
          return { ...n, done, completedBy: done ? currentUserId || (n as any).completedBy || undefined : undefined } as any;
        }
        if (n.children && n.children.length) return { ...n, children: walk(n.children) };
        return n;
      });
    return walk(nodesIn);
  }, [currentUserId]);

  // Progress across leaf subtasks
  const childProgress = useCallback((n: TaskNode): number | null => {
    if (!n.children || n.children.length === 0) return null;
    let totalLeaves = 0;
    let doneLeaves = 0;
    const walk = (arr: TaskNode[]) => {
      for (const c of arr) {
        const isLeaf = !c.children || c.children.length === 0;
        if (isLeaf) {
          totalLeaves += 1;
          if (c.done) doneLeaves += 1;
        } else {
          walk(c.children!);
        }
      }
    };
    walk(n.children);
    return totalLeaves === 0 ? 0 : Math.round((doneLeaves / totalLeaves) * 100);
  }, []);

  const nodePercent = useCallback((n: TaskNode): number => {
    const p = childProgress(n);
    if (p !== null && p !== undefined) return p;
    return n.done ? 100 : 0;
  }, [childProgress]);

  const isLeaf = useCallback((n: TaskNode) => !n.children || n.children.length === 0, []);
  const isNodeComplete = useCallback((n: TaskNode): boolean => {
    const p = childProgress(n);
    if (p !== null && p !== undefined) return p === 100;
    return !!n.done;
  }, [childProgress]);

  const renderNode = useCallback(
  (node: TaskNode, level: number, lineage: boolean[]) => {
      let swipeRefInst: SwipeableRowHandle | null = null;
      const hasChildren = !!node.children && node.children.length > 0;
      const expanded = isExpanded(node.id);
      const paddingLeft = level * 14;
      // Icon opacity driven by swipe pan.x (continuous); fallback to 1 when idle
      const pan = panMapRef.current[node.id] || null;
      const iconsOpacity = pan
        ? pan.x.interpolate({ inputRange: [-8, 0, 200], outputRange: [0, 1, 1], extrapolate: 'clamp' })
        : 1;

      const levelLabel = (lvl: number) => (lvl === 0 ? 'Task' : lvl === 1 ? 'Step' : 'Sub-step');

          const Left = (
        <Pressable
          onPress={() => toggleExpanded(node.id)}
          disabled={editingId === node.id}
          className="flex-1 flex-row items-start"
          hitSlop={6}
        >
          {/* Vertical rails are drawn at the group container level for continuity */}
          {/* Elbow */}
          {level > 0 && (
                <View style={{ position: 'absolute', left: -10, top: 14, width: 10, height: 2 }} className="bg-neutral-300 dark:bg-neutral-700" />
          )}

          {/* Left column: chevron, title, progress */}
          <View className="flex-1 pr-2">
            {/* Chevron + Title */}
            <View className="flex-row items-center">
              <View className="h-6 w-6 items-center justify-center mr-1">
                <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color="#6b7280" />
              </View>
              {editingId === node.id ? (
                <View className="flex-1 flex-row items-center gap-2">
                  <TextInput
                    value={draftTitle}
                    onChangeText={setDraftTitle}
                    autoFocus
                    blurOnSubmit={false}
                        placeholder={`Edit ${levelLabel(level).toLowerCase()}`}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 rounded-md px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
                    style={{ color: '#111827' }}
                    onFocus={() => { onStartEdit && onStartEdit(node.id); }}
                  />
                  <Pressable
                    accessibilityLabel="Confirm edit"
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      onChange(updateTitle(nodes, node.id, (draftTitle || '').trim() || node.title));
                      setEditingId(null);
                    }}
                    className="px-1 py-1"
                  >
                    <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Cancel edit"
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      setEditingId(null);
                      setDraftTitle(node.title);
                    }}
                    className="px-1 py-1"
                  >
                    <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row items-center flex-1">
                  <Text
                    className={`flex-1 ${node.done ? 'text-neutral-400 line-through' : 'text-neutral-800 dark:text-neutral-100'}`}
                    style={highlightTaskId === node.id ? { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 } : undefined}
                    numberOfLines={2}
                  >
                    {node.title}
                  </Text>
                  {node.done && (node as any).completedBy && roster && roster.length > 0 && (() => {
                    const u = roster.find(r => r.id === (node as any).completedBy);
                    if (!u) return null;
                    const uri = u.avatarUrl;
                    return (
                      <View className="ml-1 h-5 w-5 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                        {uri ? <ExpoImage source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Text className="text-[10px] text-neutral-700 dark:text-neutral-200" style={{ textAlign: 'center', lineHeight: 20 }}>{(u.name||'').slice(0,1).toUpperCase()}</Text>}
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
            {/* Progress under title aligned with start of title (not under chevron) */}
            <View className="mt-1 flex-row items-center gap-2" style={{ marginLeft: 28 }}>
              <View className="h-1.5 flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <View style={{ width: `${nodePercent(node)}%` }} className="h-full bg-[#00AFC8]" />
              </View>
              <Text className="w-12 text-right text-[11px] text-neutral-500 dark:text-neutral-400">{nodePercent(node)}%</Text>
            </View>
          </View>
          {/* Right column (inside Swipeable): complete and submissions list (hidden while editing) */}
          {editingId !== node.id && !readOnly && (
            <Animated.View
              className="pl-2 flex-row items-center gap-1"
              pointerEvents={swipingId === node.id ? 'none' : 'auto'}
              style={{ opacity: iconsOpacity as any }}
            >
              <Pressable
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  if (!isLeaf(node)) return; // parents cannot complete directly
                  setSubmittingTaskId(node.id);
                }}
                className="h-8 w-8 rounded-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
              >
                <Ionicons name={isNodeComplete(node) ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={isNodeComplete(node) ? '#10b981' : '#9CA3AF'} />
              </Pressable>
              <Pressable
                onPress={(e: GestureResponderEvent) => { e.stopPropagation(); setViewTaskId(node.id); }}
                className="h-8 w-8 rounded-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
              >
                <Ionicons name="documents-outline" size={18} color="#6b7280" />
              </Pressable>
              {/* Message chip removed: Reply is available via right-swipe underlay */}
            </Animated.View>
          )}
        </Pressable>
      );

      return (
  <View key={node.id} onLayout={(e) => { onRowLayout && onRowLayout(node.id, e.nativeEvent.layout.y); }}>
          <View className="flex-row items-start py-0.5" style={{ paddingLeft }}>
            <View style={{ flex: 1 }}>
              <SwipeableRow
                ref={(ref) => { swipeRefInst = ref; }}
                leftButtons={[
                  <TouchableOpacity
                    key="reply"
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      try { swipeRefInst?.recenter(); } catch {}
                      setSwipingId(null);
                      onReply && onReply(node.id, node.title);
                    }}
                    style={{ backgroundColor: '#0ea5e9', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View style={{ zIndex: 2 }}>
                      <MaterialIcons name="chat-bubble-outline" size={24} color="#ffffff" />
                    </View>
                  </TouchableOpacity>,
                ]}
                leftButtonWidth={68}
                leftActionActivationDistance={84}
                rightButtons={readOnly ? [] : [
                  <TouchableOpacity
                    key="edit"
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      setDraftTitle(node.title);
                      setEditingId(node.id);
                      try { swipeRefInst?.recenter(); } catch {}
                      setSwipingId(null);
                      onStartEdit && onStartEdit(node.id);
                    }}
                    style={{ backgroundColor: '#2563eb', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View style={{ zIndex: 2 }}>
                      <MaterialIcons name="edit" size={24} color="#ffffff" />
                    </View>
                  </TouchableOpacity>,
                  <TouchableOpacity
                    key="delete"
                    onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onChange(deleteNode(nodes, node.id)); }}
                    style={{ backgroundColor: '#dc2626', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View style={{ zIndex: 2 }}>
                      <MaterialIcons name="delete" size={24} color="#ffffff" />
                    </View>
                  </TouchableOpacity>,
                ]}
                rightButtonWidth={68}
                rightActionActivationDistance={84}
                onPanAnimatedValueRef={(v) => { panMapRef.current[node.id] = v; }}
                onSwipeRelease={() => {
                  // Always end swiping state on release so icons return if row didn't stay open
                  setSwipingId(null);
                }}
                onSwipeStart={() => {
                  setSwipingId(node.id);
                  // Close any other open row immediately
                  if (openRowRef.current && openRowRef.current !== swipeRefInst) {
                    try { openRowRef.current.recenter(); } catch {}
                    openRowRef.current = null;
                  }
                }}
                onRightButtonsOpenRelease={() => {
                  openRowRef.current = swipeRefInst;
                  setSwipingId(node.id);
                }}
                onRightButtonsCloseRelease={() => {
                  if (openRowRef.current === swipeRefInst) openRowRef.current = null;
                  setSwipingId((id) => (id === node.id ? null : id));
                }}
              >
                {Left}
              </SwipeableRow>
            </View>
          </View>

          {/* Nested area */}
          {expanded && (
            <View style={{ position: 'relative' }}>
              {/* Continuous vertical rail for this group's next level - extends beside children and add row */}
              <View
                style={{ position: 'absolute', top: 0, bottom: 0, left: 10 + level * 12, width: 2 }}
                className="bg-neutral-300 dark:bg-neutral-700"
              />

              {/* Children */}
              {hasChildren && (
                <View>
                  {node.children!.map((child, idx) => {
                    const isLast = idx === node.children!.length - 1;
                    return renderNode(child, level + 1, [...lineage, isLast]);
                  })}
                </View>
              )}

              {/* Add subtask */}
              <View style={{ paddingLeft }} className="pr-4 pt-1 pb-2">
                <View style={{ marginLeft: 28 }}>
                  {addingMap[node.id] === undefined ? (
                    <Pressable
                      onPress={(e: GestureResponderEvent) => { e.stopPropagation(); if (!readOnly) startAdd(node.id); }}
                      className="mt-1 flex-row items-center gap-1 self-start px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800"
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#6b7280" />
                      <Text className="text-xs text-neutral-700 dark:text-neutral-300">{`Add ${levelLabel(level + 1).toLowerCase()}`}</Text>
                    </Pressable>
                  ) : (
                    <View className="mt-1 flex-row items-center gap-2">
                      <TextInput
                        key={`add-${node.id}`}
                        value={addingMap[node.id]}
                        onChangeText={(t) => setAddingMap((prev) => ({ ...prev, [node.id]: t }))}
                        placeholder={`${levelLabel(level + 1)} name`}
                        placeholderTextColor="#9CA3AF"
                        autoFocus
                        onSubmitEditing={() => confirmAdd(node.id)}
                        className="flex-1 rounded-md px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
                        style={{ color: '#111827' }}
                        onFocus={() => { onStartEdit && onStartEdit(node.id); }}
                      />
                      <TouchableOpacity onPress={(e: GestureResponderEvent) => { e.stopPropagation(); confirmAdd(node.id); }} className="px-1 py-1">
                        <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={(e: GestureResponderEvent) => { e.stopPropagation(); cancelAdd(node.id); }} className="px-1 py-1">
                        <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

        </View>
      );
    },
    [expandedMap, isExpanded, toggleExpanded, nodes, onChange, editingId, draftTitle, updateTitle, swipingId, onReply, addingMap]
  );

  return (
    <Pressable className="gap-1" style={{ position: 'relative' }}>
      {(nodes || []).map((n, idx, arr) => renderNode(n, 0, [idx === arr.length - 1]))}
      {(!nodes || nodes.length === 0) && (
        <Text className="text-neutral-500 dark:text-neutral-400">No tasks yet.</Text>
      )}
      {showAddRoot && !readOnly ? (
        <View className="flex-col justify-start mt-2" style={{ marginLeft: 28 }} onLayout={(e) => { onRowLayout && onRowLayout('root-add', e.nativeEvent.layout.y); }}>
          {addingMap['root'] === undefined ? (
            <Pressable onPress={() => startAdd('root')} className="self-start flex-row items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
              <Ionicons name="add-circle-outline" size={16} color="#6b7280" />
              <Text className="text-xs text-neutral-700 dark:text-neutral-300">Add task</Text>
            </Pressable>
          ) : (
            <View className="mt-1 flex-row items-center gap-2">
              <TextInput
                key="add-root-input"
                value={addingMap['root']}
                onChangeText={(t) => setAddingMap((prev) => ({ ...prev, root: t }))}
                placeholder="Task name"
                placeholderTextColor="#9CA3AF"
                autoFocus
                onSubmitEditing={() => confirmAdd('root')}
                className="flex-1 rounded-md px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
                style={{ color: '#111827' }}
                onFocus={() => { onStartEdit && onStartEdit('root-add'); }}
              />
              <Pressable onPress={() => confirmAdd('root')} className="px-1 py-1">
                <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
              </Pressable>
              <Pressable onPress={() => cancelAdd('root')} className="px-1 py-1">
                <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {/* Submission modals */}
      <SubmissionModal
        visible={!!submittingTaskId}
        title="Submit work"
        onClose={() => setSubmittingTaskId(null)}
        onSubmit={(content, atts) => {
          if (!submittingTaskId) return;
          addTaskSubmission(submittingTaskId, { content, attachments: atts });
          if (!readOnly) {
            onChange(setDoneLeaf(nodes, submittingTaskId, true));
          }
          setSubmittingTaskId(null);
        }}
      />
      {(() => {
        const vt = viewTaskId;
        const last = vt ? (getTaskSubmissions(vt).slice(-1)[0] ?? null) : null;
        return (
          <SubmissionModal
            visible={!!vt}
            title="Submitted items"
            readOnly
            existing={last ? { content: last.content, attachments: last.attachments } : { content: 'No submissions yet', attachments: [] }}
            onClose={() => setViewTaskId(null)}
            onSubmit={() => {}}
          />
        );
      })()}
    </Pressable>
  );
}

const NestedChecklist = forwardRef<NestedChecklistHandle, Props>(NestedChecklistImpl);
export default NestedChecklist;

export function countTotals(nodes: TaskNode[] | undefined): { total: number; done: number } {
  if (!nodes || nodes.length === 0) return { total: 0, done: 0 };
  let total = 0;
  let done = 0;
  const walk = (arr: TaskNode[]) => {
    for (const n of arr) {
      const hasChildren = !!(n.children && n.children.length);
      if (!hasChildren) {
        total += 1;
        if (n.done) done += 1;
      } else {
        walk(n.children!);
      }
    }
  };
  walk(nodes);
  return { total, done };
}



