import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, useLocalSearchParams, usePathname, router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { BannerHeader } from '@/components/BannerHeader';
import { normalizeCourseColor, courseAccentColor } from '@/utils/courseColor';
import CourseNav from '@/components/CourseNav';
import { Services } from '@/services/providers';
import { CourseRefreshContext } from '@/contexts/CourseRefreshContext';

function titleCase(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CourseLayout() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId || '');
  const pathname = usePathname();
  const seg = pathname?.split('/')?.pop() || 'overview';
  const active = (['overview','lessons','assignments','exams','people'].includes(seg) ? seg : 'overview') as 'overview' | 'lessons' | 'assignments' | 'exams' | 'people';

  const [course, setCourse] = useState<any>(null);
  const [meta, setMeta] = useState<{ assignments?: number; lessons?: number } | null>(null);
  const [roster, setRoster] = useState<Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; courseId: string; title: string; startsAt: string; endsAt: string }>>([]);
  const [expanded, setExpanded] = useState(false); // revert: start collapsed; user meant gap expansion, not description expansion
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  // Measure entire banner children block to size container dynamically
  const [childrenH, setChildrenH] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [c, lessons, assigns, ppl, cal] = await Promise.all([
          Services.courses.getCourse(id),
          Services.content.listLessons(id).catch(() => []),
          Services.assignments.listByCourse(id).catch(() => []),
          Services.people.listCoursePeople(id).catch(() => []),
          Services.schedule.listCalendarItems().catch(() => []),
        ]);
        if (!cancelled) {
          setCourse(c);
          setMeta({ lessons: lessons.length, assignments: assigns.length });
          setRoster(ppl as any[]);
          const sess = (cal as any[]).filter(it => it.type === 'session' && it.courseId === id).map(s => ({ id: s.id, courseId: s.courseId, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt }));
          setSessions(sess);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const [c, lessons, assigns, ppl, cal] = await Promise.all([
        Services.courses.getCourse(id),
        Services.content.listLessons(id).catch(() => []),
        Services.assignments.listByCourse(id).catch(() => []),
        Services.people.listCoursePeople(id).catch(() => []),
        Services.schedule.listCalendarItems().catch(() => []),
      ]);
      setCourse(c);
      setMeta({ lessons: lessons.length, assignments: assigns.length });
      setRoster(ppl as any[]);
      const sess = (cal as any[]).filter(it => it.type === 'session' && it.courseId === id).map(s => ({ id: s.id, courseId: s.courseId, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt }));
      setSessions(sess);
      setRefreshNonce(n => n + 1);
    } finally {
      setRefreshing(false);
    }
  };

  // Derive semester and next session (overview only)
  const semester = useMemo(() => {
    if (sessions.length) {
      const sorted = [...sessions].sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      return { start: new Date(sorted[0].startsAt), end: new Date(sorted[sorted.length-1].endsAt) };
    }
    return null;
  }, [sessions]);
  const nextSession = useMemo(() => {
    const now = Date.now();
    return sessions
      .map(s => ({ ...s, startMs: new Date(s.startsAt).getTime() }))
      .filter(s => s.startMs >= now)
      .sort((a,b) => a.startMs - b.startMs)[0] || null;
  }, [sessions]);

  const progressPct = useMemo(() => {
    if (!semester) return 0;
    const span = semester.end.getTime() - semester.start.getTime();
    const elapsed = Math.max(0, Math.min(span, Date.now() - semester.start.getTime()));
    return Math.round((elapsed / span) * 100);
  }, [semester]);

  const students = useMemo(() => roster.filter(r => r.role === 'student'), [roster]);
  const teachers = useMemo(() => roster.filter(r => r.role === 'teacher'), [roster]);

  const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // Banner sizing & CourseNav overlap rules
  // - Fixed gap between banner content and CourseNav regardless of content size
  // - CourseNav overlaps only the banner background, not content
  // - Banner container expands to fit content + reserved space (no animation)
  const [fullDescLines, setFullDescLines] = useState<number>(0);
  const [showReadMore, setShowReadMore] = useState(false);
  const [descMeasured, setDescMeasured] = useState(false); // avoid flash by hiding description until we know line count
  const minBannerHeight = 0; // let content fully drive height to avoid large gaps
  const navOverlapPx = 15; // visual overlap amount
  const navGapPx = 50; // add clear breathing room above CourseNav while keeping overlap
  const reservedBottom = navGapPx + navOverlapPx; // paddingBottom inside banner content
  const bannerHeight = Math.max(minBannerHeight, childrenH || 0);

  // If user is a teacher, redirect them to the teacher course route to avoid viewing the student layout.
  const user = useAuthStore.getState().user;
  useEffect(() => {
    if (user?.role === 'teacher') {
      // Replace so back button doesn't bounce between student/teacher variants
      router.replace({ pathname: '/(teacher)/course/[courseId]', params: { courseId: id } } as any);
    }
  }, [user?.role, id]);

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
          <View className="pr-6">
            {(!course) ? (
              // Skeleton banner UI
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
                {/* Roster placeholders */}
                <View className="mt-4 flex-row justify-between">
                  <View className="flex-1 mr-4">
                    <View className="h-3 w-16 rounded bg-white/25 mb-2 animate-pulse" />
                    <View className="flex-row items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <View key={i} style={{ marginLeft: i===0?0:-12 }} className="w-9 h-9 rounded-full bg-white/20 border border-white/30 animate-pulse" />
                      ))}
                    </View>
                    <View className="h-2 w-20 rounded bg-white/20 mt-2 animate-pulse" />
                  </View>
                  <View className="flex-1">
                    <View className="h-3 w-16 rounded bg-white/25 mb-2 animate-pulse" />
                    <View className="flex-row items-center">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={{ marginLeft: i===0?0:-12 }} className="w-9 h-9 rounded-full bg-white/25 border border-white/30 animate-pulse" />
                      ))}
                    </View>
                    <View className="h-2 w-24 rounded bg-white/20 mt-2 animate-pulse" />
                  </View>
                </View>
                {/* Progress bar track only (no fill) */}
                <View className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden" />
              </View>
            ) : (
              // Real banner UI
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
                {/* Always-visible course info across tabs */}
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
                  {/* Description with expand — content below title/meta */}
                  {/* Hidden full-measure to detect true line count without affecting layout */}
                  {/* Hidden measurer to prevent initial flash and determine lines */}
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
                    >
                      {course?.description
                        ? course.description
                        : course?.name && course?.code
                          ? `${course.name} (${course.code}) course description not yet provided.`
                          : 'Course overview unavailable.'}
                    </Text>
                  )}
                  {descMeasured && (
                    <>
                      <Text numberOfLines={expanded ? undefined : 3} className="text-white/90 text-sm leading-5">
                        {course?.description
                          ? course.description
                          : course?.name && course?.code
                            ? `${course.name} (${course.code}) course description not yet provided.`
                            : 'Course overview unavailable.'}
                      </Text>
                      {showReadMore && (
                        <Pressable onPress={() => setExpanded(e => !e)} className="mt-2 self-start px-3 py-1 rounded-full bg-white/15">
                          <Text className="text-xs font-semibold text-white">{expanded ? 'Show less' : 'Read more'}</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                  {/* Roster + progress remain visible regardless of description expansion */}
                  <Pressable accessibilityRole="button" onPress={() => {
                    const { router } = require('expo-router');
                    router.push(`/(student)/course/${id}/people` as any);
                  }} className="mt-3" hitSlop={8}>
                    <View className="flex-row justify-between">
                      <View className="flex-1 mr-4">
                        <Text className="text-xs font-semibold text-white/90 mb-1">Students</Text>
                        <View className="flex-row items-center">
                          {students.slice(0,5).map((p,i) => {
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
                          {students.length > 5 && (
                            <View style={{ marginLeft: -12 }} className="w-9 h-9 rounded-full bg-white/30 items-center justify-center">
                              <Text className="text-[10px] text-white">+{students.length - 5}</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[10px] text-white/60 mt-1">{students.length} enrolled</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-white/90 mb-1">Teachers</Text>
                        <View className="flex-row items-center">
                          {teachers.slice(0,3).map((p,i) => {
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
                          {teachers.length > 3 && (
                            <View style={{ marginLeft: -12 }} className="w-9 h-9 rounded-full bg-white/35 items-center justify-center">
                              <Text className="text-[10px] text-white">+{teachers.length - 3}</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[10px] text-white/60 mt-1">{teachers.length} instructor{teachers.length === 1 ? '' : 's'}</Text>
                      </View>
                    </View>
                    <View className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden">
                      <View style={{ width: `${progressPct}%`, backgroundColor: courseAccentColor(course?.color) }} className="h-full" />
                    </View>
                    <Text className="text-[10px] text-white/60 mt-1">Progress (elapsed in semester window)</Text>
                  </Pressable>
                </View>
                </View>
              </>
            )}
          </View>
        </BannerHeader>
  {/* Overlap the CourseNav slightly into banner background; no extra spacer when floating */}
  <View className="px-4" style={{ marginTop: -navOverlapPx }}>{/* overlap background only; reduced gap */}
          <CourseNav
            courseId={id}
            active={active}
            color={normalizeCourseColor(course?.color)}
            accentColor={courseAccentColor(course?.color)}
          />
          {/* Child screens render below; they should not render their own banner/nav */}
          <View className="mt-4">
            <CourseRefreshContext.Provider value={{ courseId: id, refreshNonce }}>
              <Slot />
            </CourseRefreshContext.Provider>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
