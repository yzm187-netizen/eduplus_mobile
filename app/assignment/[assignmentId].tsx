import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, RefreshControl, Animated, KeyboardAvoidingView, Platform, Keyboard, Modal, ScrollView, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import type { AssignmentRef, Course } from '@/data/sample';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeShort } from '@/utils/date';
import ProgressBar from '@/components/ProgressBar';
import Card from '@/components/ui/Card';
import NestedChecklist, { countTotals, type NestedChecklistHandle } from '@/components/NestedChecklist';
import { useAssignmentTasksStore, type SectionState } from '@/store/assignmentTasks';
import AvatarGroup from '@/components/ui/AvatarGroup';
import * as DocumentPicker from 'expo-document-picker';
import { account } from '@/lib/appwrite';
import { CONFIG } from '@/utils/config';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeCourseColor, courseAccentColor } from '@/utils/courseColor';
import { Image as ExpoImage } from 'expo-image';

type Section = SectionState;

export default function AssignmentDetailStandaloneScreen() {
  const params = useLocalSearchParams<{ assignmentId: string; courseId?: string; sectionKey?: string; taskId?: string; groupId?: string }>();
  const router = useRouter();
  const assignmentId = String(params.assignmentId || '');
  const courseIdParam = params.courseId ? String(params.courseId) : undefined;
  const sectionKeyParam = params.sectionKey;
  const taskIdParam = params.taskId;
  const groupIdParam = params.groupId ? String(params.groupId) : undefined;
  const me = useAuthStore((s) => s.user);

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
  const persisted = getPersisted(assignmentId);
  const [sections, setSections] = useState<Section[]>(persisted ?? []);
  const [detail, setDetail] = useState<AssignmentRef | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseId, setCourseId] = useState<string | undefined>(courseIdParam);
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [descExpanded, setDescExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(84);
  const [expandedHeight, setExpandedHeight] = useState(320);
  const scrollY = useRef(new Animated.Value(0)).current;
  const BANNER_EXTRA = 24;
  const overlayHeight = useRef(new Animated.Value(320 + BANNER_EXTRA)).current;
  const maxCollapse = useMemo(() => Math.max(0, expandedHeight - collapsedHeight), [expandedHeight, collapsedHeight]);
  const detailsOpacity = scrollY.interpolate({ inputRange: [Math.max(0, maxCollapse - 24), maxCollapse], outputRange: [1, 0], extrapolate: 'clamp' });
  const detailsTranslateY = scrollY.interpolate({ inputRange: [Math.max(0, maxCollapse - 24), maxCollapse], outputRange: [0, -8], extrapolate: 'clamp' });
  const members = useMemo(() => roster.filter((p) => p.role === 'student'), [roster]);
  const mentors = useMemo(() => roster.filter((p) => p.role === 'teacher'), [roster]);
  const accent = courseAccentColor(course?.color);
  const bannerBase = useMemo(() => {
    const name = normalizeCourseColor(course?.color);
    return name === 'red' ? '#7f1d1d' : name === 'green' ? '#065f46' : name === 'purple' ? '#4c1d95' : '#0f172a';
  }, [course?.color]);

  const description: string | null = useMemo(() => (detail?.description ? detail.description : null), [detail?.description]);
  const createdByName = useMemo(() => {
    const id = (detail as any)?.createdBy;
    if (!id) return null;
    const p = roster.find(r => r.id === id);
    return p?.name || String(id);
  }, [detail, roster]);

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

  // Upload to Appwrite Storage and persist into sectionsJson
  const uploadToBucket = async (file: { uri: string; name?: string; type?: string }) => {
    const BUCKET = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
    const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
    const project = CONFIG.APPWRITE_PROJECT_ID;
    const url = `${base}/storage/buckets/${BUCKET}/files`;
    const form = new FormData();
    form.append('fileId', 'unique()');
    form.append('file', { uri: file.uri, name: file.name || 'attachment', type: file.type || 'application/octet-stream' } as any);
    try { (form as any).append('permissions[]', 'read("any")'); } catch {}
    let jwt: string | undefined;
    try { const j = await (account as any).createJWT?.(); jwt = j?.jwt; } catch {}
    const headers: Record<string, string> = { 'X-Appwrite-Project': project || '' };
    if (jwt) headers['X-Appwrite-JWT'] = jwt;
    const res = await fetch(url, { method: 'POST', headers, body: form as any });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Upload failed: ${res.status} ${txt}`);
    }
    const uploaded: any = await res.json();
    const fileId = uploaded?.$id;
    let viewUrl: string | undefined;
    if (project && fileId) viewUrl = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${project}`;
    return { fileId, url: viewUrl };
  };

  const deleteFromBucket = async (fileId?: string) => {
    if (!fileId) return;
    const BUCKET = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
    const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
    const project = CONFIG.APPWRITE_PROJECT_ID;
    const url = `${base}/storage/buckets/${BUCKET}/files/${fileId}`;
    let jwt: string | undefined;
    try { const j = await (account as any).createJWT?.(); jwt = j?.jwt; } catch {}
    const headers: Record<string, string> = { 'X-Appwrite-Project': project || '' };
    if (jwt) headers['X-Appwrite-JWT'] = jwt;
    try { await fetch(url, { method: 'DELETE', headers }); } catch {}
  };

  const addSectionAttachments = async (key: string) => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
      const selected: Array<{ uri: string; name?: string; mimeType?: string; size?: number }> = [];
      if (res?.assets && Array.isArray(res.assets)) {
        for (const a of res.assets) selected.push({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
      } else if (res?.type === 'success') {
        selected.push({ uri: res.uri, name: res.name, mimeType: res.mimeType, size: res.size });
      } else {
        return;
      }
      const uploaded: any[] = [];
      for (const f of selected) {
        try {
          const up = await uploadToBucket({ uri: f.uri, name: f.name, type: f.mimeType });
          uploaded.push({ uri: up.url, name: f.name, mimeType: f.mimeType, size: f.size, fileId: up.fileId });
        } catch {}
      }
      if (uploaded.length > 0) {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, attachments: [ ...(s.attachments || []), ...uploaded ] } : s)));
        // Persist attachments map to assignment_progress for the selected group
        if (selectedGroupId) {
          try {
            const attMap: Record<string, any[]> = {};
            const next = (sections || []).map(s => (s.key === key ? { ...s, attachments: [ ...(s.attachments || []), ...uploaded ] } : s));
            for (const s of next) attMap[s.key] = s.attachments || [];
            const prog = progressDoc || await Services.assignments.getOrCreateProgress?.(assignmentId, selectedGroupId);
            if (prog) {
              await Services.assignments.updateProgress?.((prog as any).id, { sectionsAttachments: attMap });
              setProgressDoc({ id: (prog as any).id, progress: (prog as any).progress || {} });
            }
          } catch {}
        }
      }
    } catch (_) {}
  };

  const removeSectionAttachment = async (key: string, idx: number) => {
    let fileId: string | undefined;
    const nextSections = (sections || []).map((s) => {
      if (s.key !== key) return s;
      const atts = (s.attachments || []);
      fileId = (atts[idx] as any)?.fileId;
      return { ...s, attachments: atts.filter((_, i) => i !== idx) };
    });
    setSections(nextSections);
    // Persist attachments change to assignment_progress
    if (selectedGroupId) {
      try {
        const attMap: Record<string, any[]> = {};
        for (const s of nextSections) attMap[s.key] = s.attachments || [];
        const prog = progressDoc || await Services.assignments.getOrCreateProgress?.(assignmentId, selectedGroupId);
        if (prog) {
          await Services.assignments.updateProgress?.((prog as any).id, { sectionsAttachments: attMap });
          setProgressDoc({ id: (prog as any).id, progress: (prog as any).progress || {} });
        }
      } catch {}
    }
    try { await deleteFromBucket(fileId); } catch {}
  };

  const [groups, setGroups] = useState<Array<{ id: string; name: string; memberIds: string[] }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(groupIdParam);
  const [groupProgressMap, setGroupProgressMap] = useState<Record<string, Record<string, boolean>>>({});
  const [progressDoc, setProgressDoc] = useState<{ id: string; progress: Record<string, boolean> } | null>(null);
  const [tasksOverlay, setTasksOverlay] = useState<Record<string, any[]>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [pendingTitle, setPendingTitle] = useState<string>('');
  const [pendingDescription, setPendingDescription] = useState<string>('');
  const [pendingBannerUri, setPendingBannerUri] = useState<string | null>(null);
  const [pendingDueAt, setPendingDueAt] = useState<Date | null>(null);
  const [showInlineIOSPicker, setShowInlineIOSPicker] = useState(false);
  // Removed bulk create groups UX to keep it simple
  const [pickSelected, setPickSelected] = useState<Record<string, boolean>>({});
  const unassignedStudentIds = useMemo(() => {
    const assigned = new Set<string>();
    for (const g of groups) for (const id of (g.memberIds||[])) assigned.add(id);
    return roster.filter(r => r.role==='student' && !assigned.has(r.id)).map(r => r.id);
  }, [groups, roster]);

  function flattenLeaves(nodes: any[]): Array<{ id: string; done: boolean }> {
    const out: Array<{ id: string; done: boolean }> = [];
    const walk = (arr: any[]) => {
      for (const n of arr || []) {
        if (n.children && n.children.length) walk(n.children);
        else out.push({ id: n.id, done: !!n.done });
      }
    };
    walk(nodes);
    return out;
  }
  function applyDoneOverlay(nodes: any[], map: Record<string, boolean>): any[] {
    const clone = (arr: any[]): any[] => arr.map(n => ({
      ...n,
      done: map[n.id] ?? false,
      children: n.children ? clone(n.children) : undefined,
    }));
    return clone(nodes);
  }

  async function load() {
    const cid = courseId || courseIdParam || '';
    const d = await Services.assignments.getDetail(cid, assignmentId);
    if (!courseId) setCourseId(d?.courseId || courseIdParam);
    setDetail(d);
    try { const c = await Services.courses.getCourse(String(d?.courseId || cid)); setCourse(c || null); } catch {}
    try { const ppl = await Services.people.listCoursePeople(String(d?.courseId || cid)); setRoster(ppl); } catch { setRoster([]); }
    // Load groups (if collection exists)
    let gs: Array<{ id: string; name: string; memberIds: string[] }> = [];
    try { gs = await Services.assignments.listGroups?.(assignmentId) || []; setGroups(gs); } catch { setGroups([]); }
    if ((!sections || sections.length === 0) && d?.sectionsJson) {
      try {
        const parsed = JSON.parse(d.sectionsJson);
        if (Array.isArray(parsed)) {
          const mapped: Section[] = parsed.map((s: any, idx: number) => ({ key: s.id || 'sec-' + idx, title: s.heading || s.title || `Section ${idx+1}`, description: s.description || '', tasks: Array.isArray(s.tasks) ? s.tasks : [], attachments: Array.isArray(s.attachments) ? s.attachments : undefined }));
          setSections(mapped);
        }
      } catch {}
    } else if ((!sections || sections.length === 0) && me?.role === 'teacher' && !d?.sectionsJson) {
      // Seed default sections to match the student assignment mock
      const defaults: Section[] = [
        {
          key: 'intro',
          title: 'Introduction',
          description: '',
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
          description: '',
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
      try {
        setSections(defaults);
        const payload = JSON.stringify(defaults.map(s => ({ id: s.key, heading: s.title, description: s.description || '', tasks: s.tasks })));
        await Services.assignments.update?.(assignmentId, { sectionsJson: payload });
      } catch {}
    }
    // Determine default group selection
    if (!selectedGroupId) {
      if (groupIdParam) setSelectedGroupId(groupIdParam);
      else if (me?.role === 'student') {
        const mine = gs.find(g => (g.memberIds || []).includes(me.id));
        if (mine) setSelectedGroupId(mine.id);
      }
    }
    // For teachers, prefetch progress for all groups
    if (me?.role === 'teacher' && gs.length) {
      const progressEntries: Record<string, Record<string, boolean>> = {};
      for (const g of gs) {
        try {
          const prog = await Services.assignments.getOrCreateProgress?.(assignmentId, g.id);
          if (prog) progressEntries[g.id] = (prog as any).progress || {};
        } catch {}
      }
      setGroupProgressMap(progressEntries);
    }
    // Load progress doc if group selected
    if (selectedGroupId) {
      try {
        const prog = await Services.assignments.getOrCreateProgress?.(assignmentId, selectedGroupId);
        setProgressDoc(prog ? { id: (prog as any).id, progress: (prog as any).progress || {} } : null);
        const overlay = ((prog as any)?.tasksOverlay || {}) as Record<string, any[]>;
        setTasksOverlay(overlay);
        // If overlay has tasks per section, use them; else keep existing
        if (sections && sections.length) {
          setSections(prev => prev.map(sec => {
            const overlayTasks = overlay[sec.key];
            const useTasks = Array.isArray(overlayTasks) ? overlayTasks : sec.tasks;
            return ({ ...sec, tasks: applyDoneOverlay(useTasks, (prog as any).progress || {}) });
          }));
        }
        // Update groupProgressMap for selected group
        if (prog) setGroupProgressMap(prev => ({ ...prev, [selectedGroupId]: (prog as any).progress || {} }));
      } catch {}
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [assignmentId]);

  useEffect(() => { setPersisted(assignmentId, sections); }, [sections, assignmentId, setPersisted]);
  const saveDebounce = useRef<any>(null);
  useEffect(() => {
    if (!assignmentId) return;
    if (saveDebounce.current) clearTimeout(saveDebounce.current);
    saveDebounce.current = setTimeout(async () => {
      try {
        // Teacher: persist section structure and headings
        if (me?.role === 'teacher') {
          const payload = JSON.stringify(sections.map(s => ({ id: s.key, heading: s.title, description: s.description || '', tasks: s.tasks, attachments: s.attachments })));
          await Services.assignments.update?.(assignmentId, { sectionsJson: payload });
        } else if (me?.role === 'student' && selectedGroupId && progressDoc) {
          // Student: persist tasks overlay per section
          const overlay: Record<string, any[]> = {};
          for (const s of sections) overlay[s.key] = s.tasks;
          setTasksOverlay(overlay);
          await Services.assignments.updateProgress?.(progressDoc.id, { tasksOverlay: overlay });
        }
      } catch {}
    }, 500);
    return () => { if (saveDebounce.current) clearTimeout(saveDebounce.current); };
  }, [sections, assignmentId]);

  const onRefresh = async () => { try { setRefreshing(true); await load(); } finally { setRefreshing(false); } };

  const totalTasks = useMemo(() => sections.reduce((acc, s) => acc + countTotals(s.tasks).total, 0), [sections]);
  const completedTasks = useMemo(() => sections.reduce((acc, s) => acc + countTotals(s.tasks).done, 0), [sections]);
  const overallPct = useMemo(() => (totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)), [completedTasks, totalTasks]);
  // Group-specific progress when a group is selected for teachers or students
  const selectedGroupPct = useMemo(() => {
    if (!selectedGroupId) return overallPct;
    const map = groupProgressMap[selectedGroupId] || progressDoc?.progress || {};
    const done = Object.values(map).filter(Boolean).length;
    const totalLeafIds = sections.reduce((acc, s) => acc + countTotals(s.tasks).total, 0);
    return totalLeafIds === 0 ? 0 : Math.round((done / totalLeafIds) * 100);
  }, [selectedGroupId, groupProgressMap, progressDoc, sections, overallPct]);

  const contributionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalDone = 0;
    const groupMembers = (() => {
      if (!selectedGroupId) return roster.filter(r => r.role==='student').map(r=>r.id);
      const g = groups.find(g=>g.id===selectedGroupId);
      return g ? g.memberIds.filter(id => roster.find(r=>r.id===id && r.role==='student')) : [];
    })();
    const includeUser = (id: string) => groupMembers.length === 0 || groupMembers.includes(id);
    const walk = (arr: any[]) => {
      for (const n of arr || []) {
        if (n.children && n.children.length) walk(n.children);
        else {
          if (n.done && (n as any).completedBy && includeUser((n as any).completedBy)) {
            counts[(n as any).completedBy] = (counts[(n as any).completedBy] || 0) + 1;
            totalDone += 1;
          }
        }
      }
    };
    for (const s of sections) walk(s.tasks);
    const pctMap: Record<string, number> = {};
    if (totalDone > 0) {
      for (const [uid, c] of Object.entries(counts)) pctMap[uid] = Math.round((c / totalDone) * 100);
    }
    return { pctMap, totalDone };
  }, [sections, selectedGroupId, groups, roster]);

  const openReplyFor = async (sectionKey: string, sectionTitle: string, taskId: string, taskTitle: string) => {
    const list = await Services.chat.listThreads();
    const courseThread = list.find((t: any) => t.courseId === String(courseId || courseIdParam));
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

  // Render group list only for teachers. Students either auto-enter their group or see a no-group notice.
  const showGroupList = me?.role === 'teacher' && !selectedGroupId;

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-black" onStartShouldSetResponder={() => true} onResponderGrant={closeAnyOpenChecklistRow}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0, transform: [{ translateY: scrollY.interpolate({ inputRange: [0, maxCollapse], outputRange: [0, -maxCollapse], extrapolate: 'clamp' }) }], opacity: scrollY.interpolate({ inputRange: [0, Math.max(0, maxCollapse - 1), maxCollapse], outputRange: [1, 1, 0], extrapolate: 'clamp' }) }}>
        <Animated.View pointerEvents="none" style={{ borderBottomLeftRadius: 20, borderBottomRightRadius: 20, height: overlayHeight, overflow: 'hidden', backgroundColor: bannerBase }}>
          {detail?.bannerUrl ? (
            <>
              <ExpoImage source={{ uri: String(detail.bannerUrl) }} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
            </>
          ) : null}
        </Animated.View>
      </Animated.View>

      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, backgroundColor: bannerBase, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, opacity: scrollY.interpolate({ inputRange: [0, Math.max(0, maxCollapse - 16), maxCollapse], outputRange: [0, 0, 1], extrapolate: 'clamp' }) }}>
        <View onLayout={(e) => setCollapsedHeight(Math.max(56, Math.round(e.nativeEvent.layout.height)))} className="px-4 pt-3 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-black text-white" numberOfLines={1}>{detail?.title ?? 'Assignment'}</Text>
            <Text className="text-white/90">{selectedGroupId ? selectedGroupPct : overallPct}%</Text>
          </View>
          <ProgressBar value={selectedGroupId ? selectedGroupPct : overallPct} variant="onDark" />
        </View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.ScrollView ref={scrollRef} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 48 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }>
          <View onLayout={(e) => { const h = Math.round(e.nativeEvent.layout.height); if (h > 0) { const shouldUpdate = Math.abs(expandedHeight - h) >= 2; if (shouldUpdate) { setExpandedHeight(h); overlayHeight.setValue(h + BANNER_EXTRA); } } }}>
            <View className="px-4 pt-6 pb-6">
              {me?.role === 'teacher' && (
                <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} className="flex-row items-center gap-2">
                  <Pressable accessibilityLabel="Edit assignment" onPress={() => {
                    setPendingTitle(detail?.title || '');
                    setPendingDescription(detail?.description || '');
                    setPendingBannerUri(detail?.bannerUrl || null);
                    try { setPendingDueAt(detail?.dueAt ? new Date(String(detail.dueAt)) : null); } catch { setPendingDueAt(null); }
                    setEditVisible(true);
                  }} hitSlop={8} className="px-2 py-1">
                    <Ionicons name="create-outline" size={20} color="#ffffff" />
                  </Pressable>
                  <Pressable accessibilityLabel="Remove banner image" onPress={async () => {
                    if (!detail?.bannerUrl) return;
                    const go = await new Promise<boolean>((resolve)=>{
                      Alert.alert('Remove banner image?', 'This will clear the assignment banner image (you can set a new one later).', [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Remove', style: 'destructive' as any, onPress: () => resolve(true) },
                      ]);
                    });
                    if (!go) return;
                    try { await Services.assignments.update?.(assignmentId, { bannerUrl: null }); setDetail((prev: any) => prev ? ({ ...prev, bannerUrl: null }) : prev); } catch {}
                  }} hitSlop={8} className="px-2 py-1">
                    <Ionicons name="trash-outline" size={20} color="#ffffff" />
                  </Pressable>
                </View>
              )}
              <Animated.View style={{ opacity: detailsOpacity, transform: [{ translateY: detailsTranslateY }] }}>
                <Text className="text-2xl font-black mb-1 text-white" numberOfLines={2}>{detail?.title ?? 'Assignment'}</Text>
                <View className="mb-4 gap-1">
                  <Text className="text-sm text-white/70">{course?.code ?? String(courseId || courseIdParam)} · {String(assignmentId)}</Text>
                  {(() => { const createdAt = (detail as any)?.createdAt; return createdAt ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="calendar-outline" size={14} color="#e5e7eb" />
                      <Text className="text-sm text-white/80">Created{createdByName ? ` by ${createdByName}` : ''} {new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
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
                      <Pressable onPress={() => setDescExpanded((p) => !p)} accessibilityRole="button" className="rounded-2xl border px-3 py-3 bg-black/10 border-black/20 relative">
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
                                        <Text className="flex-1 text-white">{it}</Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                                case 'ul': return (
                                  <View key={i} className="mb-2 pl-2">
                                    {b.items.map((it: string, j: number) => (
                                      <View key={j} className="flex-row mb-1">
                                        <Text className="text-white mr-2 w-6 text-right">•</Text>
                                        <Text className="flex-1 text-white">{it}</Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                                default: return (<Text key={i} className="text-white leading-6 mb-2">{b.text}</Text>);
                              }
                            })}
                          </View>
                        ) : (
                          <Text className="text-white leading-6 mt-2 pr-6" numberOfLines={3}>{description}</Text>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-8 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold mb-1 text-white">{selectedGroupId ? 'Group Members' : 'All Members'}</Text>
                    {selectedGroupId ? (
                      (() => {
                        const g = groups.find(g => g.id === selectedGroupId);
                        const gm = roster.filter(r => (g?.memberIds || []).includes(r.id) && r.role==='student');
                        return gm.length ? <AvatarGroup people={gm} max={6} size={28} overlap={10} /> : <Text className="text-white/80">—</Text>;
                      })()
                    ) : (
                      members.length > 0 ? (<AvatarGroup people={members} max={5} size={28} overlap={10} />) : (<Text className="text-white/80">—</Text>)
                    )}
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
                    <Text className="font-semibold text-white">{selectedGroupId ? 'Group Progress' : 'Overall Progress'}</Text>
                    <Text className="text-white/90">{selectedGroupId ? selectedGroupPct : overallPct}%</Text>
                  </View>
                  <ProgressBar value={selectedGroupId ? selectedGroupPct : overallPct} variant="onDark" />
                  {contributionStats.totalDone > 0 && (
                    <View className="mt-3">
                      <Text className="text-xs font-semibold text-white/80 mb-2">Contributions</Text>
                      <View className="flex-row flex-wrap gap-3">
                        {roster.filter(r=>r.role==='student' && contributionStats.pctMap[r.id] != null).map(r => (
                          <View key={r.id} className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-black/20">
                            <View className="h-5 w-5 rounded-full overflow-hidden bg-neutral-300">
                              {r.avatarUrl ? <ExpoImage source={{ uri: r.avatarUrl }} style={{ width:'100%', height:'100%' }} contentFit="cover" /> : <Text className="text-[10px] text-neutral-800" style={{ textAlign:'center', lineHeight:20 }}>{r.name.slice(0,1).toUpperCase()}</Text>}
                            </View>
                            <Text className="text-[11px] text-white/90">{contributionStats.pctMap[r.id]}%</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          </View>

          <View style={{ height: 12 }} pointerEvents="none" />
          {showGroupList ? (
            <View className="gap-3 px-4" style={{ marginTop: -12 }}>
              <Text className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">Groups</Text>
              {(groups || []).length === 0 && (
                <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
                  <Text className="text-neutral-600 dark:text-neutral-300">No groups yet.</Text>
                </View>
              )}
              {(groups || []).map(g => {
                // Compute this group's progress using current sections and its progress doc
                const [gPct, gMembers] = (() => {
                  // Note: for accuracy we'd fetch each group's progress; for now, load current selected progress only if matches
                  // Keep it simple: assume zero unless selected has progress loaded
                  let map: Record<string, boolean> = {};
                  // We could prefetch per-group, but keep lightweight for now
                  if (progressDoc && selectedGroupId === g.id) map = progressDoc.progress || {};
                  const done = Object.values(map).filter(Boolean).length;
                  const pct = totalTasks === 0 ? 0 : Math.round((done / totalTasks) * 100);
                  const memberObjs = roster.filter(r => g.memberIds?.includes(r.id));
                  return [pct, memberObjs] as const;
                })();
                return (
                  <Pressable key={g.id} onPress={async () => { setSelectedGroupId(g.id); try { const prog = await Services.assignments.getOrCreateProgress?.(assignmentId, g.id); if (prog) setGroupProgressMap(prev => ({ ...prev, [g.id]: (prog as any).progress || {} })); setProgressDoc(prog ? { id: (prog as any).id, progress: (prog as any).progress || {} } : null); } catch {} }} className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
                    <View className="flex-row items-center gap-3">
                      <View className="flex-1">
                        <Text className="font-semibold" numberOfLines={1}>{g.name}</Text>
                        <View className="mt-1"><AvatarGroup people={(gMembers as any)} max={6} size={22} overlap={8} /></View>
                      </View>
                      <View className="items-center justify-center">
                        <Text className="text-xs text-neutral-600 dark:text-neutral-300">Progress</Text>
                        <Text className="font-semibold">{gPct}%</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </View>
                    {/* Delete action removed to keep UI minimal */}
                  </Pressable>
                );
              })}
              {me?.role === 'teacher' && (
                <View className="mt-1 gap-2">
                  <Pressable onPress={() => {
                    // Open member picker and prevent reusing assigned members
                    const init: Record<string, boolean> = {};
                    for (const id of unassignedStudentIds) init[id] = false;
                    setPickSelected(init);
                    setPickerOpen(true);
                  }} className="rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 items-center justify-center">
                    <Text className="text-orange-600">Add Group (Pick Members)</Text>
                  </Pressable>
                </View>
              )}
              <View className="mt-2" />
              <Pressable onPress={() => router.back()} className="rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 items-center justify-center">
                <Text className="text-neutral-700 dark:text-neutral-200">Close</Text>
              </Pressable>
            </View>
          ) : me?.role === 'student' && !selectedGroupId ? (
            <View className="px-4" style={{ marginTop: -12 }}>
              <View className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4">
                <Text className="text-neutral-700 dark:text-neutral-200 font-semibold mb-1">Group</Text>
                <Text className="text-neutral-600 dark:text-neutral-300">You are not assigned to a group yet. Please wait for your teacher.</Text>
              </View>
              <Pressable onPress={() => router.back()} className="mt-3 rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 items-center justify-center">
                <Text className="text-neutral-700 dark:text-neutral-200">Close</Text>
              </Pressable>
            </View>
          ) : (
          <>
          {/* Teacher-only: Add Section */}
          {me?.role === 'teacher' && (
            <View className="px-4" style={{ marginTop: -12 }}>
              <Pressable onPress={() => {
                const nextIndex = sections.length + 1;
                const key = `sec-${Date.now()}-${nextIndex}`;
                setSections(prev => ([...prev, { key, title: `Section ${nextIndex}`, description: '', tasks: [], attachments: [] }]));
              }} className="mb-3 rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 items-center justify-center">
                <Text className="text-emerald-700 dark:text-emerald-300">Add Section</Text>
              </Pressable>
            </View>
          )}
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
                      {me?.role === 'teacher' ? (
                        <View className="mb-3">
                          <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Section title</Text>
                          <TextInput value={s.title} onChangeText={(txt)=> setSections(prev => prev.map(sec => sec.key === s.key ? ({ ...sec, title: txt }) : sec))} placeholder="Title" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
                          <Text className="text-sm text-neutral-700 dark:text-neutral-200 mt-3 mb-1">Description (optional)</Text>
                          <TextInput value={s.description || ''} onChangeText={(txt)=> setSections(prev => prev.map(sec => sec.key === s.key ? ({ ...sec, description: txt }) : sec))} placeholder="Write a short description for this section" multiline numberOfLines={3} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" style={{ textAlignVertical: 'top', minHeight: 80 }} />
                        </View>
                      ) : (s.description ? (
                        <View className="mb-3">
                          <Text className="text-sm text-neutral-600 dark:text-neutral-300">{s.description}</Text>
                        </View>
                      ) : null)}
                      <View className="mb-3">
                        <Text className="text-sm font-medium mb-2">Tasks</Text>
                         <NestedChecklist
                          ref={checklistRef}
                          nodes={s.tasks}
                          onChange={async (updated) => {
                            // Determine leaf done changes (per-group progress)
                            const beforeLeaves = flattenLeaves(s.tasks);
                            const afterLeaves = flattenLeaves(updated);
                            const changed: Record<string, boolean> = {};
                            for (const leaf of afterLeaves) {
                              const prev = beforeLeaves.find(b => b.id === leaf.id)?.done ?? false;
                              if (prev !== leaf.done) changed[leaf.id] = leaf.done;
                            }
                            // Update local structure regardless (rename/reorder/additions)
                            setSections((prev) => prev.map((sec) => (sec.key === s.key ? { ...sec, tasks: updated } : sec)));
                            // Persist only progress changes to assignment_progress
                            if (selectedGroupId && Object.keys(changed).length > 0) {
                              try {
                                const prog = progressDoc || await Services.assignments.getOrCreateProgress?.(assignmentId, selectedGroupId);
                                const base = (prog as any)?.progress || {} as Record<string, boolean>;
                                const next = { ...base, ...changed };
                                await Services.assignments.updateProgress?.((prog as any).id, { progress: next });
                                setProgressDoc({ id: (prog as any).id, progress: next });
                                // Re-apply overlay to reflect authoritative values
                                setSections(prev => prev.map(sec => ({ ...sec, tasks: applyDoneOverlay(sec.tasks, next) })));
                              } catch {}
                            }
                          }}
                          highlightTaskId={taskIdParam as any}
                          showAddRoot={me?.role === 'student'}
                          readOnly={me?.role !== 'student'}
                          currentUserId={me?.id}
                          roster={roster}
                          onRowLayout={(taskId, y) => { rowPositionsRef.current[taskId] = y; }}
                        />
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>

          <View className="px-4">
            <Pressable onPress={() => router.back()} className="mt-2 rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 items-center justify-center">
              <Text className="text-neutral-700 dark:text-neutral-200">Close</Text>
            </Pressable>
          </View>
          </>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Add Group - Member Picker Modal */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={()=> setPickerOpen(false)}>
          <View className="flex-1 justify-end">
            <View className="rounded-t-2xl bg-white dark:bg-neutral-900 p-4">
              <Text className="text-base font-semibold mb-2 dark:text-white">Pick Group Members</Text>
              <ScrollView style={{ maxHeight: 260 }}>
                {roster.filter(r => r.role==='student').map(s => {
                  const disabled = !unassignedStudentIds.includes(s.id);
                  const checked = !!pickSelected[s.id];
                  return (
                    <Pressable key={s.id} onPress={()=>{ if (!disabled) setPickSelected(prev=>({ ...prev, [s.id]: !prev[s.id] })); }} className="flex-row items-center justify-between py-2">
                      <Text className={disabled? 'text-neutral-400' : 'text-neutral-800 dark:text-neutral-100'}>{s.name}</Text>
                      <View className={`h-5 w-5 rounded border ${checked? 'bg-emerald-500 border-emerald-600' : 'bg-white dark:bg-neutral-800 border-neutral-400'} ${disabled? 'opacity-40' : ''}`} />
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View className="flex-row justify-end gap-3 mt-2">
                <Pressable onPress={()=> setPickerOpen(false)} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Cancel</Text></Pressable>
                <Pressable onPress={async ()=>{
                  const selected = Object.keys(pickSelected).filter(id => pickSelected[id]);
                  if (selected.length === 0) { setPickerOpen(false); return; }
                  // Compute next group number as 1 + max existing numeric suffix
                  const maxNum = groups.reduce((m,g)=>{ const m2 = /Group\s+(\d+)/i.exec(g.name||''); const n = m2? parseInt(m2[1],10):0; return Math.max(m,n);},0);
                  const name = `Group ${maxNum+1}`;
                  try {
                    await Services.assignments.createGroup?.(assignmentId, { name, memberIds: selected });
                    setPickerOpen(false);
                    await load();
                  } catch {}
                }} className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#F97316' }}>
                  <Text className="text-white font-semibold">Create Group</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Bulk create groups modal removed to simplify controls */}

      {/* Edit Assignment modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setEditVisible(false)}>
          <View className="flex-1 justify-end">
            <Pressable onPress={() => {}} className="w-full rounded-t-2xl bg-white dark:bg-neutral-900 p-4" style={{ elevation: 6 }}>
              <Text className="text-base font-semibold mb-3 dark:text-white">Edit assignment</Text>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Title</Text>
                <TextInput value={pendingTitle} onChangeText={setPendingTitle} placeholder="Assignment title" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Due date</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-neutral-800 dark:text-neutral-200">{pendingDueAt ? `${pendingDueAt.toLocaleDateString()} ${pendingDueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not set'}</Text>
                  <View className="flex-row gap-2">
                    <Pressable onPress={async () => {
                      try {
                        const mod = require('@react-native-community/datetimepicker');
                        if (Platform.OS === 'android' && mod?.DateTimePickerAndroid?.open) {
                          mod.DateTimePickerAndroid.open({ value: pendingDueAt || new Date(), mode: 'date', onChange: (_: any, date?: Date) => { if (date) setPendingDueAt(date); } });
                        } else {
                          setShowInlineIOSPicker(true);
                        }
                      } catch {
                        setPendingDueAt(new Date(Date.now()+24*60*60*1000));
                      }
                    }} className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Pick</Text></Pressable>
                    {pendingDueAt && (
                      <Pressable onPress={() => setPendingDueAt(null)} className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Clear</Text></Pressable>
                    )}
                  </View>
                </View>
                {showInlineIOSPicker && (() => {
                  try {
                    const DT = require('@react-native-community/datetimepicker');
                    const C = DT?.default || DT?.DateTimePicker;
                    if (C) return (<C value={pendingDueAt || new Date()} mode="datetime" display="inline" onChange={(_: any, d?: Date)=>{ if (d) setPendingDueAt(d); }} />);
                  } catch {}
                  return null;
                })()}
              </View>
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm text-neutral-700 dark:text-neutral-200">Description</Text>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">{(pendingDescription?.length || 0)}/500</Text>
                </View>
                <TextInput value={pendingDescription} onChangeText={(txt) => setPendingDescription(txt.slice(0,500))} placeholder="Short description (max 500 characters)" multiline numberOfLines={6} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" style={{ minHeight: 120, textAlignVertical: 'top' }} />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Banner image</Text>
                {pendingBannerUri ? (
                  <View className="rounded-xl overflow-hidden mb-2" style={{ height: 120 }}>
                    <ExpoImage source={{ uri: pendingBannerUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                  </View>
                ) : (
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">No image selected</Text>
                )}
                <View className="flex-row gap-3">
                  <Pressable onPress={async () => {
                    try {
                      const res: any = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true, type: 'image/*' });
                      if (res?.assets && res.assets[0]?.uri) setPendingBannerUri(res.assets[0].uri);
                      else if (res?.type === 'success' && res?.uri) setPendingBannerUri(res.uri);
                    } catch {}
                  }} className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800">
                    <Text className="dark:text-white">Choose image</Text>
                  </Pressable>
                  {!!pendingBannerUri && (
                    <Pressable onPress={() => setPendingBannerUri(null)} className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800">
                      <Text className="dark:text-white">Clear</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <View className="flex-row justify-end gap-3">
                <Pressable onPress={() => setEditVisible(false)} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Cancel</Text></Pressable>
                <Pressable onPress={async () => {
                  try {
                    let bannerUrlToSet: string | null | undefined = undefined;
                    if (pendingBannerUri && /^https?:\/\//i.test(pendingBannerUri)) {
                      bannerUrlToSet = pendingBannerUri;
                    } else if (pendingBannerUri) {
                      try {
                        const up = await uploadToBucket({ uri: pendingBannerUri, name: 'banner.jpg', type: 'image/jpeg' });
                        bannerUrlToSet = up.url;
                      } catch {}
                    } else if (pendingBannerUri === null) {
                      bannerUrlToSet = null;
                    }
                    const dueAtStr = pendingDueAt ? pendingDueAt.toISOString() : undefined;
                    await Services.assignments.update?.(assignmentId, { title: pendingTitle, description: pendingDescription, dueAt: dueAtStr, ...(bannerUrlToSet !== undefined ? { bannerUrl: bannerUrlToSet } : {}) });
                    setDetail((prev: any) => prev ? ({ ...prev, title: pendingTitle, description: pendingDescription, dueAt: dueAtStr || (prev as any)?.dueAt, bannerUrl: bannerUrlToSet !== undefined ? bannerUrlToSet : (prev as any).bannerUrl }) : prev);
                    setEditVisible(false);
                  } catch (e) {
                    Alert.alert('Error', String((e as any)?.message || e));
                  }
                }} className="px-4 py-2 rounded-xl" style={{ backgroundColor: accent }}>
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
