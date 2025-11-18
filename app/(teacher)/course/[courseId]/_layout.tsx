import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Modal, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, useLocalSearchParams, usePathname, router } from 'expo-router';
import { BannerHeader } from '@/components/BannerHeader';
import { normalizeCourseColor, courseAccentColor } from '@/utils/courseColor';
import CourseNav from '@/components/CourseNav';
import { Services } from '@/services/providers';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { CourseRefreshContext } from '@/contexts/CourseRefreshContext';

export default function TeacherCourseLayout() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId || '');
  const pathname = usePathname();
  const seg = pathname?.split('/')?.pop() || 'overview';
  let active: 'overview' | 'lessons' | 'assignments' | 'exams' | 'people' = 'overview';
  if (['overview','lessons','assignments','exams','people'].includes(seg)) {
    active = seg as any;
  } else if (pathname?.includes('/assessment/')) {
    // When viewing a specific assessment, highlight Assignments tab
    active = 'assignments';
  }

  const [course, setCourse] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [fullDescLines, setFullDescLines] = useState(0);
  const [showReadMore, setShowReadMore] = useState(false);
  const [descMeasured, setDescMeasured] = useState(false);
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; courseId: string; title: string; startsAt: string; endsAt: string }>>([]);
  const [childrenH, setChildrenH] = useState(0);
  const minBannerHeight = 0;
  const navOverlapPx = 15;
  const navGapPx = 50;
  const reservedBottom = navGapPx + navOverlapPx;
  const bannerHeight = Math.max(minBannerHeight, childrenH || 0);
  const accent = courseAccentColor(course?.color);
  const [editVisible, setEditVisible] = useState(false);
  const user = useAuthStore.getState().user;
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string>('');
  const [pendingCode, setPendingCode] = useState<string>('');
  const [pendingDescription, setPendingDescription] = useState<string>('');

  useEffect(() => { (async () => {
    const c = await Services.courses.getCourse(id);
    setCourse(c);
    if (__DEV__) {
      try {
        // Lightweight debug to verify permission signals
        console.info('[teacher/_layout] course perms debug', {
          id: c?.id,
          canEdit: c?.canEdit,
          teacherIds: c?.teacherIds,
        });
      } catch {}
    }
    try {
      const ppl = await Services.people.listCoursePeople(id);
      setRoster(ppl as any[]);
    } catch {}
    try {
      const cal = await Services.schedule.listCalendarItems();
      const sess = (cal as any[]).filter(it => it.type === 'session' && it.courseId === id).map(s => ({ id: s.id, courseId: s.courseId, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt }));
      setSessions(sess);
    } catch {}
  })(); }, [id]);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [c, ppl, cal] = await Promise.all([
        Services.courses.getCourse(id),
        Services.people.listCoursePeople(id).catch(() => []),
        Services.schedule.listCalendarItems().catch(() => []),
      ]);
      setCourse(c);
      setRoster(ppl as any[]);
      const sess = (cal as any[]).filter((it: any) => it.type === 'session' && it.courseId === id).map((s: any) => ({ id: s.id, courseId: s.courseId, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt }));
      setSessions(sess);
      setRefreshNonce(n => n + 1);
    } finally {
      setRefreshing(false);
    }
  };

  // Semester + progress mirrors student calculation
  const semester = useMemo(() => {
    if (sessions.length) {
      const sorted = [...sessions].sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      return { start: new Date(sorted[0].startsAt), end: new Date(sorted[sorted.length-1].endsAt) };
    }
    return null;
  }, [sessions]);
  const progressPct = useMemo(() => {
    if (!semester) return 0;
    const span = semester.end.getTime() - semester.start.getTime();
    const elapsed = Math.max(0, Math.min(span, Date.now() - semester.start.getTime()));
    return Math.round((elapsed / span) * 100);
  }, [semester]);
  const nextSession = useMemo(() => {
    const now = Date.now();
    return sessions
      .map(s => ({ ...s, startMs: new Date(s.startsAt).getTime() }))
      .filter(s => s.startMs >= now)
      .sort((a,b) => a.startMs - b.startMs)[0] || null;
  }, [sessions]);
  const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black" edges={['left','right','bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <BannerHeader
          height={bannerHeight}
          backgroundMode="cover"
          backgroundAnchorY="top"
          showText={false}
          floating
          absoluteChildren={false}
          paddingVertical={16}
          colorName={normalizeCourseColor(course?.color)}
        >
          {/* Top-right action icons absolutely aligned in banner */}
          <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} className="flex-row items-center gap-2">
            <Pressable
              disabled={!course || (user?.role !== 'teacher' && !(course.canEdit || course.teacherIds?.includes(user?.id || '')))}
              accessibilityLabel="Edit course"
              onPress={() => {
              setPendingName(course?.name || '');
              setPendingCode(course?.code || '');
              setPendingDescription(course?.description || '');
              setPendingColor(normalizeCourseColor(course?.color));
              setEditVisible(true);
            }} hitSlop={8} className="px-2 py-1 opacity-100">
              <Ionicons name="create-outline" size={20} color={course && (user?.role === 'teacher' || course.canEdit || course.teacherIds?.includes(user?.id || '')) ? '#ffffff' : '#ffffff55'} />
            </Pressable>
            <Pressable
              disabled={!course || (user?.role !== 'teacher' && !(course.canEdit || course.teacherIds?.includes(user?.id || '')))}
              accessibilityLabel="Delete course"
              onPress={() => {
              Alert.alert('Delete course?', 'Deletion is disabled in this build.', [{ text: 'OK' }]);
            }} hitSlop={8} className="px-2 py-1">
              <Ionicons name="trash-outline" size={20} color={course && (user?.role === 'teacher' || course.canEdit || course.teacherIds?.includes(user?.id || '')) ? '#ffffff' : '#ffffff55'} />
            </Pressable>
          </View>

          <View className="pr-6">
            {/* Banner content mirrors student */}
            {(!course) ? (
              <View className="pb-10" onLayout={(e)=>{
                const h = e.nativeEvent.layout.height;
                if (h && Math.abs(h - childrenH) > 1) setChildrenH(Math.ceil(h));
              }}>
                <View className="h-6 w-3/5 rounded bg-white/25 animate-pulse" />
                <View className="mt-4 gap-2">
                  <View className="h-3 w-11/12 rounded bg-white/15 animate-pulse" />
                  <View className="h-3 w-10/12 rounded bg-white/15 animate-pulse" />
                  <View className="h-3 w-8/12 rounded bg-white/15 animate-pulse" />
                </View>
                <View className="mt-3 h-2 rounded-full bg-white/25" />
              </View>
            ) : (
              <>
                <View onLayout={(e)=>{
                  const h = e.nativeEvent.layout.height;
                  if (h && Math.abs(h - childrenH) > 1) setChildrenH(Math.ceil(h));
                }}>
                  <Text className="text-2xl font-extrabold text-white" numberOfLines={1}>{course.name}</Text>
                  <View className="mt-1 flex-row flex-wrap items-center gap-2">
                    <Text className="text-white/80 text-sm" numberOfLines={1}>{course.code || id}</Text>
                    {course.createdBy && course.createdAt && (
                      <Text className="text-white/60 text-xs" numberOfLines={1}>
                        • Created by {(roster.find(r => r.id === course.createdBy)?.name) || course.createdBy} {new Date(course.createdAt).toLocaleDateString(undefined,{ month:'short', day:'numeric', year:'numeric' })}
                      </Text>
                    )}
                  </View>
                  <View className="mt-3" style={{ paddingBottom: reservedBottom }}>
                    {semester && (
                      <View className="flex-row flex-wrap gap-x-4 gap-y-2 mb-2">
                        <Text className="text-white/70 text-xs">Start: {formatDate(semester.start)}</Text>
                        <Text className="text-white/70 text-xs">End: {formatDate(semester.end)}</Text>
                        <Text className="text-white/70 text-xs">Progress: {progressPct}%</Text>
                        {nextSession && (
                          <Text className="text-white/70 text-xs">Next: {formatDate(new Date(nextSession.startsAt))} {new Date(nextSession.startsAt).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</Text>
                        )}
                      </View>
                    )}
                    {!descMeasured && (
                      <Text
                        className="text-sm leading-5"
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' } as any}
                        onTextLayout={(e)=>{
                          if (!descMeasured) {
                            const lines = e.nativeEvent.lines?.length || 0;
                            setFullDescLines(lines);
                            if (lines > 3) setShowReadMore(true);
                            setDescMeasured(true);
                          }
                        }}
                      >{course?.description || `${course.name} (${course.code}) course description not yet provided.`}</Text>
                    )}
                    {descMeasured && (
                      <>
                        <Text numberOfLines={expanded ? undefined : 3} className="text-white/90 text-sm leading-5">
                          {course?.description || `${course.name} (${course.code}) course description not yet provided.`}
                        </Text>
                        {showReadMore && (
                          <Pressable onPress={() => setExpanded(e => !e)} className="mt-2 self-start px-3 py-1 rounded-full bg-white/15">
                            <Text className="text-xs font-semibold text-white">{expanded ? 'Show less' : 'Read more'}</Text>
                          </Pressable>
                        )}
                      </>
                    )}
                    {/* Roster + progress */}
                    <Pressable accessibilityRole="button" onPress={() => router.push((`/(teacher)/course/${id}/people` as any))} className="mt-3" hitSlop={8}>
                      <View className="flex-row justify-between">
                        <View className="flex-1 mr-4">
                          <Text className="text-xs font-semibold text-white/90 mb-1">Students</Text>
                          <View className="flex-row items-center">
                            {roster.filter(r=>r.role==='student').slice(0,5).map((p,i) => {
                              const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                              return (
                                <View key={p.id} style={{ marginLeft: i===0?0:-12 }} className="w-9 h-9 rounded-full bg-white/20 overflow-hidden border border-white/30">
                                  {p.avatarUrl ? (
                                    <ExpoImage source={{ uri: p.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                  ) : (
                                    <View className="flex-1 items-center justify-center"><Text className="text-[10px] text-white font-semibold">{initials}</Text></View>
                                  )}
                                </View>
                              );
                            })}
                            {roster.filter(r=>r.role==='student').length > 5 && (
                              <View style={{ marginLeft: -12 }} className="w-9 h-9 rounded-full bg-white/30 items-center justify-center">
                                <Text className="text-[10px] text-white">+{roster.filter(r=>r.role==='student').length - 5}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[10px] text-white/60 mt-1">{roster.filter(r=>r.role==='student').length} enrolled</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-white/90 mb-1">Teachers</Text>
                          <View className="flex-row items-center">
                            {roster.filter(r=>r.role==='teacher').slice(0,3).map((p,i) => {
                              const initials = p.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                              return (
                                <View key={p.id} style={{ marginLeft: i===0?0:-12 }} className="w-9 h-9 rounded-full bg-white/25 overflow-hidden border border-white/30">
                                  {p.avatarUrl ? (
                                    <ExpoImage source={{ uri: p.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                  ) : (
                                    <View className="flex-1 items-center justify-center"><Text className="text-[10px] text-white font-semibold">{initials}</Text></View>
                                  )}
                                </View>
                              );
                            })}
                            {roster.filter(r=>r.role==='teacher').length > 3 && (
                              <View style={{ marginLeft: -12 }} className="w-9 h-9 rounded-full bg-white/35 items-center justify-center">
                                <Text className="text-[10px] text-white">+{roster.filter(r=>r.role==='teacher').length - 3}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[10px] text-white/60 mt-1">{roster.filter(r=>r.role==='teacher').length} instructor{roster.filter(r=>r.role==='teacher').length === 1 ? '' : 's'}</Text>
                        </View>
                      </View>
                      <View className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden">
                        <View style={{ width: `${progressPct}%`, backgroundColor: accent }} className="h-full" />
                      </View>
                      <Text className="text-[10px] text-white/60 mt-1">Progress (elapsed in semester window)</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </BannerHeader>
        {/* CourseNav fixed; overlap background only */}
        <View className="px-4" style={{ marginTop: -navOverlapPx }}>
          <CourseNav
            courseId={id}
            active={active}
            color={normalizeCourseColor(course?.color)}
            accentColor={accent}
            baseGroup="(teacher)"
          />
          <View className="mt-4">
            <CourseRefreshContext.Provider value={{ courseId: id, refreshNonce }}>
              <Slot />
            </CourseRefreshContext.Provider>
          </View>
        </View>
      </ScrollView>

      {/* Edit course bottom sheet modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setEditVisible(false)}>
          <View className="flex-1 justify-end">
            <Pressable onPress={() => {}} className="w-full rounded-t-2xl bg-white dark:bg-neutral-900 p-4" style={{ elevation: 6 }}>
              <Text className="text-base font-semibold mb-3 dark:text-white">Edit course</Text>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Title</Text>
                <TextInput value={pendingName} onChangeText={setPendingName} placeholder="Course title" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Code</Text>
                <TextInput value={pendingCode} onChangeText={setPendingCode} placeholder="Course code" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm text-neutral-700 dark:text-neutral-200">Description</Text>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">{(pendingDescription?.length || 0)}/{500}</Text>
                </View>
                <TextInput
                  value={pendingDescription}
                  onChangeText={(txt)=>{
                    if (txt.length <= 500) setPendingDescription(txt);
                    else setPendingDescription(txt.slice(0,500));
                  }}
                  placeholder="Short description (max 500 characters)"
                  multiline
                  numberOfLines={8}
                  className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  style={{ minHeight: 140, textAlignVertical: 'top' }}
                />
              </View>
              <Text className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">Theme</Text>
              <View className="flex-row justify-between mb-4">
                {(['blue','green','purple','red'] as const).map((c) => (
                  <Pressable key={c} onPress={() => setPendingColor(c)} className="items-center">
                    <View className="w-12 h-8 rounded" style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'green' ? '#22c55e' : c === 'purple' ? '#8b5cf6' : '#ef4444', opacity: pendingColor === c ? 1 : 0.8, borderWidth: pendingColor === c ? 2 : 0, borderColor: '#111827' }} />
                    <Text className="text-xs mt-1 capitalize dark:text-white">{c}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row justify-end gap-3">
                <Pressable onPress={() => setEditVisible(false)} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Cancel</Text></Pressable>
                <Pressable onPress={async () => {
                  try {
                    const newColor = pendingColor || normalizeCourseColor(course?.color);
                    await Services.courses.updateCourse(id, { color: newColor as any, name: pendingName, code: pendingCode, description: pendingDescription });
                    setCourse((prev: any) => ({ ...prev, color: newColor, name: pendingName, code: pendingCode, description: pendingDescription }));
                    setEditVisible(false);
                  } catch (e) {
                    const msg = String((e as any)?.message || e);
                    if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('permission')) {
                      Alert.alert('Not authorized', 'Your account lacks update permission on this course. Run: npm run grant:course-perms (with server API key in .env) to grant update/delete permissions to teacherIds.');
                    } else {
                      Alert.alert('Error', msg);
                    }
                  }
                }} className="px-4 py-2 rounded-xl" style={{ backgroundColor: accent }}>
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
