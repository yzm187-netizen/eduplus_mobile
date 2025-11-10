import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, RefreshControl, Animated, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
// AppText removed on this screen to revert to default Text
import * as DocumentPicker from 'expo-document-picker';
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
import SubmissionModal from '@/components/SubmissionModal';
import { useSubmissionsStore } from '@/store/submissions';
// Using React Native Animated here to avoid Reanimated + css-interop dev freeze conflicts

type Section = SectionState;
type SectionAttachment = { uri: string; name?: string; mimeType?: string; size?: number };

const defaultSections: Section[] = [
  {
    key: 'intro',
    title: 'Introduction',
    tasks: [
      {
        id: 't-intro-1',
        title: 'Outline background and context',
        done: false,
        children: [
          { id: 't-intro-1a', title: 'Define key terms', done: false },
          { id: 't-intro-1b', title: 'Summarize prior work', done: false },
        ],
      },
      { id: 't-intro-2', title: 'State problem/gap clearly', done: false },
    ],
  },
  {
    key: 'methods',
    title: 'Methods',
    tasks: [
      {
        id: 't-methods-1',
        title: 'Describe dataset and variables',
        done: false,
        children: [
          { id: 't-methods-1a', title: 'Sampling strategy', done: false },
          { id: 't-methods-1b', title: 'Variable definitions', done: false },
        ],
      },
      { id: 't-methods-2', title: 'Explain procedure/analysis plan', done: false },
      
      { id: 't-results-1', title: 'Compute key metrics', done: false },
      {
        id: 't-results-2',
        title: 'Create tables/figures',
        done: false,
        children: [
          { id: 't-results-2a', title: 'Figure 1: Overview chart', done: false },
          { id: 't-results-2b', title: 'Table 1: Summary stats', done: false },
        ],
      },
    ],
  },
];

export default function AssignmentDetailScreen() {
  const checklistRef = useRef<NestedChecklistHandle>(null);
  const scrollRef = useRef<any>(null); // Animated.ScrollView ref
  const rowPositionsRef = useRef<Record<string, number>>({});
  const [kbHeight, setKbHeight] = useState(0);

  // Listen to keyboard height and store for scroll offset
  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const s2 = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);
  const { courseId, assignmentId, sectionKey: sectionKeyParam, taskId: taskIdParam } = useLocalSearchParams<{ courseId: string; assignmentId: string; sectionKey?: string; taskId?: string }>();
  const router = useRouter();
  const getPersisted = useAssignmentTasksStore((s) => s.getSections);
  const setPersisted = useAssignmentTasksStore((s) => s.setSections);
  const persisted = getPersisted(String(assignmentId));
  const [sections, setSections] = useState<Section[]>(persisted ?? defaultSections);
  const [submitted, setSubmitted] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);
  const addFinalSubmission = useSubmissionsStore((s) => s.addFinalSubmission);
  const [detail, setDetail] = useState<AssignmentRef | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ intro: true, methods: false, results: false });
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher' }>>([]);
  const members = useMemo(() => roster.filter((p) => p.role === 'student'), [roster]);
  const mentors = useMemo(() => roster.filter((p) => p.role === 'teacher'), [roster]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(320);
  const [collapsedHeight, setCollapsedHeight] = useState(84);
  const [expandedHeight, setExpandedHeight] = useState(320);
  const scrollY = useRef(new Animated.Value(0)).current;
  // Extra background length below the header content for stronger underlay
  const BANNER_EXTRA = 24; // extended underlay length for greener backdrop
  // Smooth banner background height to avoid perceived lag on description toggle (now instant updates)
  const overlayHeight = useRef(new Animated.Value(320 + BANNER_EXTRA)).current;
  const maxCollapse = useMemo(() => Math.max(0, expandedHeight - collapsedHeight), [expandedHeight, collapsedHeight]);
  const headerHeightAnim = scrollY.interpolate({
    inputRange: [0, maxCollapse],
    outputRange: [expandedHeight, collapsedHeight],
    extrapolate: 'clamp',
  });
  // Delay collapse visuals until near the collapsed threshold
  const detailsOpacity = scrollY.interpolate({
    inputRange: [Math.max(0, maxCollapse - 24), maxCollapse],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const detailsTranslateY = scrollY.interpolate({
    inputRange: [Math.max(0, maxCollapse - 24), maxCollapse],
    outputRange: [0, -8],
    extrapolate: 'clamp',
  });
  // Only banner collapses; content scrolls normally

  // No boolean gap toggle; gap is smoothly animated via topGap

  const description: string | null = useMemo(() => {
    // Lightweight mock descriptions keyed by assignment id; falls back when unknown
    const aid = String(assignmentId || '');
    if (detail?.description) return detail.description;
    const map: Record<string, string> = {
      'a-lit-review': 'Synthesize prior research into a clear, cohesive literature review. Emphasize gaps and how your work addresses them. Cite using APA 7th.\n\nDeliverables:\n- 1,500–2,000 words excluding references\n- Minimum 12 recent, relevant sources\n- Section outline: Introduction, Thematic Synthesis, Gaps & Motivations, Summary\n\nTips: Prioritize synthesis over summaries; group findings thematically; use recent meta-analyses when available. Include a figure or table if it clarifies structure.',
      'a-proto': 'Create an interactive prototype that demonstrates your core flow. Focus on usability heuristics, consistency, and learnability.\n\nDeliverables:\n- Clickable prototype covering at least the happy path\n- 5 annotated screenshots highlighting key decisions\n- Heuristic self‑review (Nielsen’s 10) with 3+ actionable fixes\n\nTips: Prefer consistent spacing, color, and typography tokens. Keep interactions obvious; reduce cognitive load at each step.',
      'a-stat-3': 'Apply statistical methods to the provided dataset. Show your steps, justify choices, and interpret results clearly.\n\nDeliverables:\n- Notebook or step‑by‑step calculations\n- Cleaned dataset (or documented transformations)\n- 2–3 charts supporting your conclusions\n\nTips: Check assumptions before picking tests; explain why your method fits the question; include effect sizes, not just p‑values.',
    };
    return map[aid] ?? 'This project focuses on producing a clear, high‑quality submission with strong fundamentals. Follow the sections below and collaborate with your group.';
  }, [assignmentId, detail?.description]);

  // --- Document-like formatting helpers (basic Markdown subset) ---
  type Block =
    | { type: 'h1'; text: string }
    | { type: 'h2'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'subtitle'; text: string }
    | { type: 'label'; text: string }
    | { type: 'hr' }
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] };

  const parseBlocks = (src: string): Block[] => {
    const lines = src.split(/\r?\n/);
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      // Horizontal rule
      if (/^\s*(---+|___+)\s*$/.test(line)) {
        blocks.push({ type: 'hr' });
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push({ type: 'h3', text: line.replace(/^###\s*/, '') });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push({ type: 'h2', text: line.replace(/^##\s*/, '') });
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push({ type: 'h1', text: line.replace(/^#\s*/, '') });
        i++;
        continue;
      }
      // Uppercase line heuristic => subtitle (e.g., CASE STUDY)
      if (/^[A-Z0-9 .,&-]+$/.test(line.trim()) && line.trim().length <= 40) {
        blocks.push({ type: 'subtitle', text: line.trim() });
        i++;
        continue;
      }
      // Lines ending with ':' treated as labels (e.g., "Your report should include:")
      if (!line.trim().startsWith('- ') && /:\s*$/.test(line)) {
        blocks.push({ type: 'label', text: line.replace(/:\s*$/, '') });
        i++;
        continue;
      }
      if (line.trim().startsWith('- ')) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          items.push(lines[i].trim().replace(/^-\s*/, ''));
          i++;
        }
        blocks.push({ type: 'ul', items });
        continue;
      }
      // Ordered list: 1. 2. 3.
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        blocks.push({ type: 'ol', items });
        continue;
      }
      // paragraph: gather consecutive non-empty, non-list, non-heading lines
      const paras: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].startsWith('#') &&
        !lines[i].trim().startsWith('- ')
      ) {
        paras.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'p', text: paras.join('\n') });
    }
    return blocks;
  };

  const renderInline = (text: string) => {
    // Support **bold** and *italic* (non-nested, simple)
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={idx} style={{ fontWeight: '700' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text key={idx} style={{ fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      // Heuristic: bold leading label followed by a colon, e.g., "Recommendation:"
      const label = part.match(/^([A-Za-z][^:]{0,60}:\s)/);
      if (label) {
        const lead = label[1];
        return (
          <Text key={idx}>
            <Text style={{ fontWeight: '700' }}>{lead}</Text>
            {part.slice(lead.length)}
          </Text>
        );
      }
      return <Text key={idx}>{part}</Text>;
    });
  };

  const docBlocks = useMemo(() => (description ? parseBlocks(description) : []), [description]);

  // Per-section submission helpers
  const setSectionSubmissionText = (key: string, text: string) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, submissionText: text } : s)));
  };

  const addSectionAttachments = async (key: string) => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
      const picked: SectionAttachment[] = [];
      if (res?.assets && Array.isArray(res.assets)) {
        for (const a of res.assets) picked.push({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
      } else if (res?.type === 'success') {
        picked.push({ uri: res.uri, name: res.name, mimeType: res.mimeType, size: res.size });
      } else {
        return;
      }
      if (picked.length > 0) {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, attachments: [ ...(s.attachments || []), ...picked ] } : s)));
      }
    } catch (_) {
      // ignore for demo
    }
  };

  const removeSectionAttachment = (key: string, idx: number) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, attachments: (s.attachments || []).filter((_, i) => i !== idx) } : s)));
  };

  // Persist sections whenever they change
  useEffect(() => {
    setPersisted(String(assignmentId), sections);
  }, [sections, assignmentId, setPersisted]);

  const totalTasks = useMemo(() => sections.reduce((acc, s) => acc + countTotals(s.tasks).total, 0), [sections]);
  const completedTasks = useMemo(() => sections.reduce((acc, s) => acc + countTotals(s.tasks).done, 0), [sections]);
  const overallPct = useMemo(() => (totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)), [completedTasks, totalTasks]);
  const hasTasks = totalTasks > 0;

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
  }

  useEffect(() => {
    load();
  }, [courseId, assignmentId]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  // Apply deep-link requested section expansion
  useEffect(() => {
    if (sectionKeyParam) {
      setExpanded((prev) => {
        const next: Record<string, boolean> = {};
        for (const s of sections) next[s.key] = s.key === sectionKeyParam;
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKeyParam]);

  // If a taskId is provided, expand the section that contains it
  useEffect(() => {
    if (!taskIdParam) return;
    const containing = sections.find((s) => JSON.stringify(s.tasks).includes(`"id":"${taskIdParam}"`));
    if (containing) {
      setExpanded((prev) => {
        const next: Record<string, boolean> = {};
        for (const s of sections) next[s.key] = s.key === containing.key;
        return next;
      });
    }
  }, [taskIdParam, sections]);

  // Open group chat with context for a specific task id and section key (include titles for UI preview)
  const openReplyFor = async (sectionKey: string, sectionTitle: string, taskId: string, taskTitle: string) => {
    const list = await Services.chat.listThreads();
    const courseThread = list.find((t) => t.courseId === String(courseId));
    const target = courseThread ?? list[0];
    if (!target) return;
    const url = `/(student)/threads/${target.id}` +
      `?assignmentId=${encodeURIComponent(String(assignmentId))}` +
      `&sectionKey=${encodeURIComponent(sectionKey)}` +
      `&taskId=${encodeURIComponent(taskId)}` +
      `&sectionTitle=${encodeURIComponent(sectionTitle)}` +
      `&taskTitle=${encodeURIComponent(taskTitle)}`;
    router.push(url as any);
  };

  const toggleDesc = () => {
    setDescExpanded((prev) => !prev);
  };

  const closeAnyOpenChecklistRow = () => checklistRef.current?.closeOpenRow?.();

  return (
    <View
      className="flex-1 bg-neutral-50 dark:bg-black"
      onStartShouldSetResponder={() => true}
      onResponderGrant={closeAnyOpenChecklistRow}
    >
      {/* Compressing banner background overlay (curved, behind content)
          Split into two layers to avoid mixing native-driven transforms with JS-driven height:
          - Outer (native-driven): translateY/opacity only
          - Inner (JS-driven): animates height only
          Tail removed: use the banner's own rounded corners for the curved edge */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, maxCollapse],
                outputRange: [0, -maxCollapse],
                extrapolate: 'clamp',
              }),
            },
          ],
          opacity: scrollY.interpolate({
            inputRange: [0, Math.max(0, maxCollapse - 1), maxCollapse],
            outputRange: [1, 1, 0],
            extrapolate: 'clamp',
          }),
        }}
      >
        {/* Inner height layer (JS-driven) */}
        <Animated.View
          pointerEvents="none"
          style={{
            backgroundColor: '#059669',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            height: overlayHeight,
          }}
        />
      </Animated.View>

      {/* Collapsed bar pinned to top (fades in) */}
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
      <Animated.ScrollView
  ref={scrollRef}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header content inside ScrollView (fades/translates on scroll) */}
        <View
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0) {
              setHeaderHeight(h);
              const shouldUpdate = Math.abs(expandedHeight - h) >= 2;
              if (shouldUpdate) {
                setExpandedHeight(h);
                // Make the banner background height jump instantly (no easing), with extra green underlay length
                overlayHeight.setValue(h + BANNER_EXTRA);
              }
            }
          }}
        >
          <View className="px-4 pt-6 pb-6">
            <Animated.View style={{ opacity: detailsOpacity, transform: [{ translateY: detailsTranslateY }] }}>
              {/* Title and meta */}
              <Text className="text-2xl font-black mb-1 text-white" numberOfLines={2}>{detail?.title ?? 'Assignment'}</Text>
              <View className="mb-4 gap-1">
                <Text className="text-sm text-white/70">{course?.code ?? String(courseId)} · {String(assignmentId)}</Text>

                {/* Created date row */}
                {(() => { const createdAt = detail?.createdAt; return createdAt ? (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar-outline" size={14} color="#e5e7eb" />
                    <Text className="text-sm text-white/80">
                      Created {new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                ) : null; })()}

                {/* Due date row */}
                {(() => {
                  const dueAt = detail?.dueAt;
                  return dueAt ? (
                    <View className="flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="flag-outline" size={14} color="#e5e7eb" />
                        <Text className="text-sm text-white/80">
                          Due {new Date(dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#e5e7eb" />
                        <Text className="text-sm text-white/80">
                          {new Date(dueAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text className="text-sm text-white/70">· {formatRelativeShort(dueAt)}</Text>
                    </View>
                  ) : null;
                })()}
              {description && (
                <View className="mt-3 mb-1">
                  <Pressable
                    onPress={toggleDesc}
                    accessibilityRole="button"
                    className="rounded-2xl border px-3 py-3 bg-black/10 border-black/20 relative"
                  >
                    {/* Chevron indicator (collapsed/expanded) */}
                    <View style={{ position: 'absolute', top: 8, right: 10 }} pointerEvents="none">
                      <Ionicons
                        name={descExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="rgba(255,255,255,0.85)"
                      />
                    </View>
                    {descExpanded ? (
                      <View className="mt-2 pr-6">
                        {docBlocks.map((b, i) => {
                          switch (b.type) {
                            case 'h1':
                              return (
                                <Text key={i} className="text-xl font-extrabold text-white mb-1">
                                  {b.text}
                                </Text>
                              );
                            case 'h2':
                              return (
                                <Text key={i} className="text-lg font-bold text-white mb-1">
                                  {b.text}
                                </Text>
                              );
                            case 'h3':
                              return (
                                <Text key={i} className="text-base font-semibold text-white mb-1">
                                  {b.text}
                                </Text>
                              );
                            case 'subtitle':
                              return (
                                <Text key={i} className="text-base italic text-white mb-2">
                                  {(b.text || '').toUpperCase()}
                                </Text>
                              );
                            case 'label':
                              return (
                                <Text key={i} className="text-white font-semibold mt-2 mb-1">
                                  {b.text}
                                </Text>
                              );
                            case 'hr':
                              return (
                                <View key={i} className="my-2" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                              );
                            case 'ol':
                              return (
                                <View key={i} className="mb-2 pl-2">
                                  {b.items.map((it, j) => (
                                    <View key={j} className="flex-row mb-1">
                                      <Text className="text-white mr-2 w-6 text-right">{j + 1}.</Text>
                                      <Text className="flex-1 text-white">{renderInline(it)}</Text>
                                    </View>
                                  ))}
                                </View>
                              );
                            case 'ul':
                              return (
                                <View key={i} className="mb-2 pl-2">
                                  {b.items.map((it, j) => (
                                    <View key={j} className="flex-row mb-1">
                                      <Text className="text-white mr-2 w-6 text-right">•</Text>
                                      <Text className="flex-1 text-white">{renderInline(it)}</Text>
                                    </View>
                                  ))}
                                </View>
                              );
                            default:
                              return (
                                <Text key={i} className="text-white leading-6 mb-2">
                                  {renderInline((b as any).text)}
                                </Text>
                              );
                          }
                        })}
                      </View>
                    ) : (
                      // Collapsed: single Text with ellipsis
                      <Text className="text-white leading-6 mt-2 pr-6" numberOfLines={3}>
                        {renderInline(description)}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              </View>

              {/* Members / Mentors */}
              <View className="flex-row gap-8 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold mb-1 text-white">Members</Text>
                  {members.length > 0 ? (
                    <AvatarGroup people={members} max={5} size={28} overlap={10} />
                  ) : (
                    <Text className="text-white/80">—</Text>
                  )}
                </View>
                {mentors.length > 0 && (
                  <View className="flex-1">
                    <Text className="text-sm font-semibold mb-1 text-white">Mentors</Text>
                    <AvatarGroup people={mentors} max={3} size={28} overlap={10} />
                  </View>
                )}
              </View>

              {/* Project progress */}
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
        {/* Gap between progress bar and first section when expanded */}
        <View style={{ height: 12 }} pointerEvents="none" />
          {/* Sections (slight overlap onto banner background) */}
          <View className="gap-4 mb-6 px-4" style={{ marginTop: -12 }}>
          {sections.map((s) => {
            const { done: secDone, total: secTotal } = countTotals(s.tasks);
            const secPct = secTotal === 0 ? 0 : Math.round((secDone / secTotal) * 100);
            const isOpen = !!expanded[s.key];
            return (
              <Card key={s.key} padded={false}>
                {/* Header */}
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
                {/* Body */}
                {isOpen && (
                  <View className="px-4 pb-4">
                    {/* Tasks checklist (nested) */}
                    <View className="mb-3">
                      <Text className="text-sm font-medium mb-2">Tasks</Text>
                      <NestedChecklist
                        ref={checklistRef}
                        nodes={s.tasks}
                        onChange={(updated) =>
                          setSections((prev) => prev.map((sec) => (sec.key === s.key ? { ...sec, tasks: updated } : sec)))
                        }
                        highlightTaskId={taskIdParam}
                        showAddRoot
                        onReply={(taskId, taskTitle) => openReplyFor(s.key, s.title, taskId, taskTitle)}
                        onRowLayout={(taskId, y) => { rowPositionsRef.current[taskId] = y; }}
                        onStartEdit={(taskId) => {
                          const attemptScroll = (attempt = 0) => {
                            const y = rowPositionsRef.current[taskId];
                            if (y === undefined || !scrollRef.current) return;
                            try {
                              const extra = 32; // small visual margin
                              const offset = Math.max(0, y - (kbHeight || 120) - extra);
                              const node: any = (scrollRef.current as any).getNode ? (scrollRef.current as any).getNode() : scrollRef.current;
                              node.scrollTo({ y: offset, animated: true });
                            } catch {}
                            // Retry a couple times to account for late keyboard/layout updates
                            if (attempt < 2) setTimeout(() => attemptScroll(attempt + 1), 120);
                          };
                          // Delay slightly so keyboard anim and layout settle
                          setTimeout(() => attemptScroll(0), 60);
                        }}
                      />
                    </View>

                    {/* Per-section submission removed: each task/subtask handles submission */}
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* Final submit */}
        <View className="px-4">
          <Button
            title={submitted ? 'Submitted for grading' : 'Submit final for grading'}
            disabled={(hasTasks && overallPct < 100) || submitted}
            onPress={() => setFinalVisible(true)}
          />
        </View>
        <SubmissionModal
          visible={finalVisible}
          title="Submit final for grading"
          onClose={() => setFinalVisible(false)}
          onSubmit={(content, attachments) => {
            addFinalSubmission(String(assignmentId || ''), { content, attachments });
            setFinalVisible(false);
            setSubmitted(true);
          }}
        />
  </Animated.ScrollView>
  </KeyboardAvoidingView>
    </View>
  );
}
