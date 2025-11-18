import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, RefreshControl, Animated, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import type { AssignmentRef, Course } from '@/data/sample';
import { formatRelativeShort } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ProgressBar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import NestedChecklist, { countTotals, type NestedChecklistHandle } from '@/components/NestedChecklist';
import { useAssignmentTasksStore, type SectionState } from '@/store/assignmentTasks';
import AvatarGroup from '@/components/ui/AvatarGroup';

type Section = SectionState;

export default function TeacherAssignmentLikeStudentScreen() {
  const params = useLocalSearchParams<{ courseId: string; assessmentId?: string; assignmentId?: string; sectionKey?: string; taskId?: string }>();
  const courseId = params.courseId;
  const assignmentId = String(params.assignmentId || params.assessmentId || '');
  const sectionKeyParam = params.sectionKey;
  const taskIdParam = params.taskId;
  const router = useRouter();

  const checklistRef = useRef<NestedChecklistHandle>(null);
  const scrollRef = useRef<any>(null);
  const rowPositionsRef = useRef<Record<string, number>>({});
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const s2 = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  const getPersisted = useAssignmentTasksStore((s) => s.getSections);
  const setPersisted = useAssignmentTasksStore((s) => s.setSections);
  const persisted = getPersisted(String(assignmentId));
  const [sections, setSections] = useState<Section[]>(persisted ?? []);
  const [detail, setDetail] = useState<AssignmentRef | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher' }>>([]);
  const members = useMemo(() => roster.filter((p) => p.role === 'student'), [roster]);
  const mentors = useMemo(() => roster.filter((p) => p.role === 'teacher'), [roster]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(84);
  const [expandedHeight, setExpandedHeight] = useState(320);
  const scrollY = useRef(new Animated.Value(0)).current;
  const BANNER_EXTRA = 24;
  const overlayHeight = useRef(new Animated.Value(320 + BANNER_EXTRA)).current;
  const maxCollapse = useMemo(() => Math.max(0, expandedHeight - collapsedHeight), [expandedHeight, collapsedHeight]);
  const detailsOpacity = scrollY.interpolate({ inputRange: [Math.max(0, maxCollapse - 24), maxCollapse], outputRange: [1, 0], extrapolate: 'clamp' });
  const detailsTranslateY = scrollY.interpolate({ inputRange: [Math.max(0, maxCollapse - 24), maxCollapse], outputRange: [0, -8], extrapolate: 'clamp' });

  const description: string | null = useMemo(() => (detail?.description ? detail.description : null), [detail?.description]);

  const docBlocks = useMemo(() => {
    if (!description) return [] as any[];
    const parseBlocks = (src: string) => {
      const lines = src.split(/\r?\n/);
      const blocks: any[] = []; let i = 0;
      while (i < lines.length) {
        const line = lines[i]; if (!line.trim()) { i++; continue; }
        if (/^\s*(---+|___+)\s*$/.test(line)) { blocks.push({ type: 'hr' }); i++; continue; }
        if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.replace(/^###\s*/, '') }); i++; continue; }
        if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.replace(/^##\s*/, '') }); i++; continue; }
        if (line.startsWith('# ')) { blocks.push({ type: 'h1', text: line.replace(/^#\s*/, '') }); i++; continue; }
        if (/^[A-Z0-9 .,&-]+$/.test(line.trim()) && line.trim().length <= 40) { blocks.push({ type: 'subtitle', text: line.trim() }); i++; continue; }
        if (!line.trim().startsWith('- ') && /:\s*$/.test(line)) { blocks.push({ type: 'label', text: line.replace(/:\s*$/, '') }); i++; continue; }
        if (line.trim().startsWith('- ')) { const items: string[] = []; while (i < lines.length && lines[i].trim().startsWith('- ')) { items.push(lines[i].trim().replace(/^-\s*/, '')); i++; } blocks.push({ type: 'ul', items }); continue; }
        if (/^\s*\d+\.\s+/.test(line)) { const items: string[] = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; } blocks.push({ type: 'ol', items }); continue; }
        const paras: string[] = [line]; i++; while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].trim().startsWith('- ')) { paras.push(lines[i]); i++; }
        blocks.push({ type: 'p', text: paras.join('\n') });
      }
      return blocks;
    };
    return parseBlocks(description);
  }, [description]);

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) return (<Text key={idx} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>);
      if (part.startsWith('*') && part.endsWith('*')) return (<Text key={idx} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>);
      const label = part.match(/^([A-Za-z][^:]{0,60}:\s)/);
      if (label) { const lead = label[1]; return (<Text key={idx}><Text style={{ fontWeight: '700' }}>{lead}</Text>{part.slice(lead.length)}</Text>); }
      return <Text key={idx}>{part}</Text>;
    });
  };

  // Load detail + course + roster and initialize sections from DB if present
  async function load() {
    const cid = String(courseId || '');
    const aid = String(assignmentId || '');
    const [d, c, ppl] = await Promise.all([
      Services.assignments.getDetail(cid, aid),
      Services.courses.getCourse(cid),
      Services.people.listCoursePeople(cid),
    ]);
    setDetail(d);
    setCourse(c);
    setRoster(ppl);
    // Initialize sections from DB if available and local not set
    if ((!sections || sections.length === 0) && d?.sectionsJson) {
      try {
        const parsed = JSON.parse(d.sectionsJson);
        if (Array.isArray(parsed)) {
          const mapped: Section[] = parsed.map((s: any, idx: number) => ({ key: s.id || 'sec-' + idx, title: s.heading || s.title || `Section ${idx+1}`, tasks: Array.isArray(s.tasks) ? s.tasks : [] }));
          setSections(mapped);
        }
      } catch {}
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [courseId, assignmentId]);

  // Persist sections to local store and Appwrite (debounced)
  useEffect(() => { setPersisted(String(assignmentId), sections); }, [sections, assignmentId, setPersisted]);
  const saveDebounce = useRef<any>(null);
  useEffect(() => {
    if (!assignmentId) return;
    if (saveDebounce.current) clearTimeout(saveDebounce.current);
    saveDebounce.current = setTimeout(async () => {
      try {
        const payload = JSON.stringify(sections.map(s => ({ id: s.key, heading: s.title, tasks: s.tasks })));
        await Services.assignments.update?.(String(assignmentId), { sectionsJson: payload });
      } catch {}
    }, 500);
    return () => { if (saveDebounce.current) clearTimeout(saveDebounce.current); };
  }, [sections, assignmentId]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { try { setRefreshing(true); await load(); } finally { setRefreshing(false); } };

  const totalTasks = useMemo(() => sections.reduce((acc, s) => acc + countTotals(s.tasks).total, 0), [sections]);
  const completedTasks = useMemo(() => sections.reduce((acc, s) => acc + countTotals(s.tasks).done, 0), [sections]);
  const overallPct = useMemo(() => (totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)), [completedTasks, totalTasks]);

  const openReplyFor = async (sectionKey: string, sectionTitle: string, taskId: string, taskTitle: string) => {
    const list = await Services.chat.listThreads();
    const courseThread = list.find((t) => (t as any).courseId === String(courseId));
    const target: any = courseThread ?? list[0];
    if (!target) return;
    const url = `/(student)/threads/${target.id}` +
      `?assignmentId=${encodeURIComponent(String(assignmentId))}` +
      `&sectionKey=${encodeURIComponent(sectionKey)}` +
      `&taskId=${encodeURIComponent(taskId)}` +
      `&sectionTitle=${encodeURIComponent(sectionTitle)}` +
      `&taskTitle=${encodeURIComponent(taskTitle)}`;
    router.push(url as any);
  };

  const toggleDesc = () => setDescExpanded((prev) => !prev);
  const closeAnyOpenChecklistRow = () => checklistRef.current?.closeOpenRow?.();

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-black" onStartShouldSetResponder={() => true} onResponderGrant={closeAnyOpenChecklistRow}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0, transform: [{ translateY: scrollY.interpolate({ inputRange: [0, maxCollapse], outputRange: [0, -maxCollapse], extrapolate: 'clamp' }) }], opacity: scrollY.interpolate({ inputRange: [0, Math.max(0, maxCollapse - 1), maxCollapse], outputRange: [1, 1, 0], extrapolate: 'clamp' }) }}>
        <Animated.View pointerEvents="none" style={{ backgroundColor: '#059669', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, height: overlayHeight }} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, backgroundColor: '#059669', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, opacity: scrollY.interpolate({ inputRange: [0, Math.max(0, maxCollapse - 16), maxCollapse], outputRange: [0, 0, 1], extrapolate: 'clamp' }) }}>
        <View onLayout={(e) => setCollapsedHeight(Math.max(56, Math.round(e.nativeEvent.layout.height)))} className="px-4 pt-3 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-black text-white" numberOfLines={1}>{detail?.title ?? 'Assignment'}</Text>
            <Text className="text-white/90">{overallPct}%</Text>
          </View>
          <ProgressBar value={overallPct} variant="onDark" />
        </View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.ScrollView ref={scrollRef} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 48 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }>
          <View onLayout={(e) => { const h = Math.round(e.nativeEvent.layout.height); if (h > 0) { const shouldUpdate = Math.abs(expandedHeight - h) >= 2; if (shouldUpdate) { setExpandedHeight(h); overlayHeight.setValue(h + BANNER_EXTRA); } } }}>
            <View className="px-4 pt-6 pb-6">
              <Animated.View style={{ opacity: detailsOpacity, transform: [{ translateY: detailsTranslateY }] }}>
                <Text className="text-2xl font-black mb-1 text-white" numberOfLines={2}>{detail?.title ?? 'Assignment'}</Text>
                <View className="mb-4 gap-1">
                  <Text className="text-sm text-white/70">{course?.code ?? String(courseId)} · {String(assignmentId)}</Text>
                  {(() => { const createdAt = (detail as any)?.createdAt; return createdAt ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="calendar-outline" size={14} color="#e5e7eb" />
                      <Text className="text-sm text-white/80">Created {new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                  ) : null; })()}
                  {(() => { const dueAt = (detail as any)?.dueAt; return dueAt ? (
                    <View className="flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="flag-outline" size={14} color="#e5e7eb" />
                        <Text className="text-sm text-white/80">Due {new Date(dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#e5e7eb" />
                        <Text className="text-sm text-white/80">{new Date(dueAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      <Text className="text-sm text-white/70">· {formatRelativeShort(dueAt)}</Text>
                    </View>
                  ) : null; })()}
                  {description && (
                    <View className="mt-3 mb-1">
                      <Pressable onPress={toggleDesc} accessibilityRole="button" className="rounded-2xl border px-3 py-3 bg-black/10 border-black/20 relative">
                        <View style={{ position: 'absolute', top: 8, right: 10 }} pointerEvents="none">
                          <Ionicons name={descExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.85)" />
                        </View>
                        {descExpanded ? (
                          <View className="mt-2 pr-6">
                            {docBlocks.map((b: any, i: number) => {
                              switch (b.type) {
                                case 'h1': return (<Text key={i} className="text-xl font-extrabold text-white mb-1">{b.text}</Text>);
                                case 'h2': return (<Text key={i} className="text-lg font-bold text-white mb-1">{b.text}</Text>);
                                case 'h3': return (<Text key={i} className="text-base font-semibold text-white mb-1">{b.text}</Text>);
                                case 'subtitle': return (<Text key={i} className="text-base italic text-white mb-2">{(b.text || '').toUpperCase()}</Text>);
                                case 'label': return (<Text key={i} className="text-white font-semibold mt-2 mb-1">{b.text}</Text>);
                                case 'hr': return (<View key={i} className="my-2" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />);
                                case 'ol': return (
                                  <View key={i} className="mb-2 pl-2">
                                    {b.items.map((it: string, j: number) => (
                                      <View key={j} className="flex-row mb-1">
                                        <Text className="text-white mr-2 w-6 text-right">{j + 1}.</Text>
                                        <Text className="flex-1 text-white">{renderInline(it)}</Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                                case 'ul': return (
                                  <View key={i} className="mb-2 pl-2">
                                    {b.items.map((it: string, j: number) => (
                                      <View key={j} className="flex-row mb-1">
                                        <Text className="text-white mr-2 w-6 text-right">•</Text>
                                        <Text className="flex-1 text-white">{renderInline(it)}</Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                                default: return (<Text key={i} className="text-white leading-6 mb-2">{renderInline((b as any).text)}</Text>);
                              }
                            })}
                          </View>
                        ) : (
                          <Text className="text-white leading-6 mt-2 pr-6" numberOfLines={3}>{renderInline(description)}</Text>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-8 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold mb-1 text-white">Members</Text>
                    {members.length > 0 ? (<AvatarGroup people={members} max={5} size={28} overlap={10} />) : (<Text className="text-white/80">—</Text>)}
                  </View>
                  {mentors.length > 0 && (
                    <View className="flex-1">
                      <Text className="text-sm font-semibold mb-1 text-white">Mentors</Text>
                      <AvatarGroup people={mentors} max={3} size={28} overlap={10} />
                    </View>
                  )}
                </View>

                <View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="font-semibold text-white">Project Progress</Text>
                    <Text className="text-white/90">{overallPct}%</Text>
                  </View>
                  <ProgressBar value={overallPct} variant="onDark" />
                </View>
              </Animated.View>
            </View>
          </View>

          <View style={{ height: 12 }} pointerEvents="none" />
          <View className="gap-4 mb-6 px-4" style={{ marginTop: -12 }}>
            {sections.map((s) => {
              const { done: secDone, total: secTotal } = countTotals(s.tasks);
              const secPct = secTotal === 0 ? 0 : Math.round((secDone / secTotal) * 100);
              const isOpen = !!expanded[s.key];
              return (
                <Card key={s.key} padded={false}>
                  <Pressable onPress={() => setExpanded((e) => ({ ...e, [s.key]: !e[s.key] }))} className="px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="font-semibold" numberOfLines={1}>{s.title}</Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">{secDone}/{secTotal} tasks</Text>
                      <View className="mt-1">
                        <AvatarGroup people={roster.filter((p) => p.role === 'student')} max={5} size={18} overlap={6} />
                      </View>
                    </View>
                    <View className="w-24"><ProgressBar value={secPct} /></View>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
                  </Pressable>
                  {isOpen && (
                    <View className="px-4 pb-4">
                      <View className="mb-3">
                        <Text className="text-sm font-medium mb-2">Tasks</Text>
                        <NestedChecklist
                          ref={checklistRef}
                          nodes={s.tasks}
                          onChange={(updated) => setSections((prev) => prev.map((sec) => (sec.key === s.key ? { ...sec, tasks: updated } : sec)))}
                          highlightTaskId={taskIdParam as any}
                          showAddRoot={false}
                          readOnly
                          onReply={(taskId, taskTitle) => openReplyFor(s.key, s.title, taskId, taskTitle)}
                          onRowLayout={(taskId, y) => { rowPositionsRef.current[taskId] = y; }}
                          onStartEdit={(taskId) => {
                            const attemptScroll = (attempt = 0) => {
                              const y = rowPositionsRef.current[taskId];
                              if (y === undefined || !scrollRef.current) return;
                              try {
                                const extra = 32; const offset = Math.max(0, y - (kbHeight || 120) - extra);
                                const node: any = (scrollRef.current as any).getNode ? (scrollRef.current as any).getNode() : scrollRef.current;
                                node.scrollTo({ y: offset, animated: true });
                              } catch {}
                              if (attempt < 2) setTimeout(() => attemptScroll(attempt + 1), 120);
                            };
                            setTimeout(() => attemptScroll(0), 60);
                          }}
                        />
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>

          {/* Optional: teacher-only actions could go here later */}
          <View className="px-4">
            <Button title="Close" variant="secondary" onPress={() => router.back()} />
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
