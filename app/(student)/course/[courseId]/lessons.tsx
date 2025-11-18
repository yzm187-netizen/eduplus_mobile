import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image, Modal, TextInput, Alert, Linking, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
// Use legacy API to keep downloadAsync working on SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Services } from '@/services/providers';
import type { Lesson, Note } from '@/data/academics';
import { formatRelativeShort } from '@/utils/date';
import EmptyState from '@/components/ui/EmptyState';
import { courseAccentColor } from '@/utils/courseColor';
import SwipeableRow, { SwipeableRowHandle } from '@/components/SwipeableRow';
import { ID } from 'react-native-appwrite';
import { CONFIG } from '@/utils/config';
import { CourseRefreshContext } from '@/contexts/CourseRefreshContext';
 

export default function CourseLessonsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const id = String(courseId);
  const router = useRouter();
  const refreshCtx = useContext(CourseRefreshContext);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [accent, setAccent] = useState<string>('#00AFC8');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [canEdit, setCanEdit] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingAbout, setPendingAbout] = useState('');
  const ABOUT_LIMIT = 250;
  const [pendingCoverLocal, setPendingCoverLocal] = useState<string | undefined>(undefined); // optimistic local preview before upload
  const rowRefs = useRef<Record<string, SwipeableRowHandle | null>>({});

  async function load() {
    const [ls, ns] = await Promise.all([
      Services.content.listLessons(id),
      Services.content.listNotes(id),
    ]);
    setLessons(ls);
    // Sync completion map from backend
    setCompleted(() => {
      const map: Record<string, boolean> = {};
      for (const l of ls as any[]) map[l.id] = Boolean((l as any).completed);
      return map;
    });
    setNotes(ns);
    setOpen(prev => {
      const next = { ...prev };
      for (const l of ls) if (next[l.id] === undefined) next[l.id] = false;
      return next;
    });
  }

  useEffect(() => {
    load();
    (async () => {
      try {
        const c = await Services.courses.getCourse(id);
        setAccent(courseAccentColor(c?.color));
        try {
          const user = await Services.auth.getSession();
          const isTeacher = !!user && (user.role === 'teacher' || user.role === 'admin');
          const inCourse = !!user && !!(c?.teacherIds?.includes(user.id));
          setCanEdit(Boolean(c?.canEdit) || (isTeacher && inCourse));
        } catch {}
      } catch {}
    })();
  }, [id]);

  // Reload when screen gains focus to reflect teacher updates
  useFocusEffect(useCallback(() => {
    load();
  }, [id]));

  // Reload when the parent course layout triggers a refresh
  useEffect(() => {
    if (refreshCtx && refreshCtx.courseId === id) {
      load();
    }
  }, [refreshCtx?.refreshNonce]);

  const iconFor = (name: string, mime?: string) => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['pdf'].includes(ext)) return { icon: 'document-text-outline', color: '#dc2626' };
    if (['doc','docx'].includes(ext)) return { icon: 'document-text-outline', color: '#2563eb' };
    if (['ppt','pptx','key'].includes(ext)) return { icon: 'easel-outline', color: '#d97706' };
    if (['xls','xlsx','csv'].includes(ext)) return { icon: 'grid-outline', color: '#059669' };
    if (['mp4','mov','avi','mkv'].includes(ext)) return { icon: 'videocam-outline', color: '#7c3aed' };
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return { icon: 'image-outline', color: '#16a34a' };
    if (['zip','rar','7z'].includes(ext)) return { icon: 'archive-outline', color: '#6b7280' };
    return { icon: 'document-outline', color: '#6b7280' };
  };

  const buildFileViewUrl = (fileId?: string) => {
    if (!fileId) return undefined;
    const base = (CONFIG.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
    const bucket = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
    const project = CONFIG.APPWRITE_PROJECT_ID;
    if (!project) return undefined;
    return `${base}/storage/buckets/${bucket}/files/${fileId}/view?project=${project}`;
  };

  const openAttachment = async (note: Note) => {
    // Browser-first strategy: open remote view URL immediately if available; fallback to local download & cache.
    const fileId = (note as any).fileId;
    // Reuse cached download if present
    const safeName = (note.attachmentName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const localPath = FileSystem.cacheDirectory + `${fileId || 'file'}-${safeName}`;
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        console.info('[openAttachment] using cached file', { path: localPath });
        try {
          const Sharing: any = await import('expo-sharing').catch(() => null);
          if (Sharing && Sharing.isAvailableAsync && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localPath);
            return;
          }
        } catch {}
        try { await Linking.openURL(localPath); return; } catch {}
      }
    } catch {}
    let url = note.attachmentUrl || buildFileViewUrl(fileId);
    // Attempt immediate in-browser open if we have a remote HTTP view URL and no cached local yet
    if (url && /^https?:/i.test(url)) {
      try {
        await WebBrowser.openBrowserAsync(url);
        return; // stop after browser open
      } catch (e) {
        console.warn('[openAttachment] browser open failed, falling back to download', e);
      }
    }
    const isLocal = !!url && (url.startsWith('file:') || url.startsWith('content:'));
    if (!url || isLocal) {
      const remote = buildFileViewUrl(fileId);
      if (remote) url = remote; else {
        console.warn('[openAttachment] no remote URL yet (upload in progress)', { id: note.id });
        return;
      }
    }
    if (/^\//.test(url)) {
      const base = (CONFIG.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
      url = base + url;
    }
    if (!/^https?:/i.test(url)) url = 'https://' + url.replace(/^\/*/, '');
    console.info('[openAttachment] open via local download', { id: note.id, fileId, url });
    try {
      // Prefer the /download endpoint if we know fileId
      const base = (CONFIG.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
      const bucket = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
      const project = CONFIG.APPWRITE_PROJECT_ID;
      const downloadUrl = (project && fileId)
        ? `${base}/storage/buckets/${bucket}/files/${fileId}/download?project=${project}`
        : url;
      // Attempt to include JWT when available (works for private files)
      let jwt: string | undefined;
      try { const j: any = await (Services.auth as any).getSession?.(); jwt = j?.jwt; } catch {}
      if (!jwt) { try { const j2: any = await (Services.auth as any).createJWT?.(); jwt = j2?.jwt; } catch {} }
      const headers: any = project ? { 'X-Appwrite-Project': project } : {};
      if (jwt) headers['X-Appwrite-JWT'] = jwt;
      const dl = await FileSystem.downloadAsync(downloadUrl, localPath, { headers });
      if (dl.status === 200) {
        console.info('[openAttachment] downloaded local file', { path: localPath, size: dl.headers['Content-Length'] || 'unknown' });
        try {
          const Sharing: any = await import('expo-sharing').catch(() => null);
          if (Sharing && Sharing.isAvailableAsync && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localPath);
            return;
          }
        } catch {}
        try { await Linking.openURL(localPath); return; } catch {}
      } else {
        console.warn('[openAttachment] download failed status', dl.status);
      }
    } catch (err) {
      console.warn('[openAttachment] local open error', err);
    }
  };

  const uploadResource = async (lesson: Lesson) => {
    try {
      const result: any = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result || result.canceled) return;
      const fileName = result.assets?.[0]?.name || result.name || 'file';
      const asset = result.assets?.[0] || result;
      // optimistic placeholder
      const tempId = ID.unique();
      const optimistic: Note = {
        id: tempId,
        courseId: id,
        lessonId: lesson.id,
        authorId: 'me',
        visibility: 'course',
        title: fileName,
        content: '',
        createdAt: new Date().toISOString(),
        attachmentName: fileName,
        attachmentUrl: asset.uri,
        mimeType: asset.mimeType,
        uploadFailed: false,
      } as any;
      setNotes(prev => [...prev, optimistic]);
      let created: Note | null = null;
      if (Services.content.createNoteWithAttachment) {
        try {
          created = await Services.content.createNoteWithAttachment(id, lesson.id, { uri: asset.uri, name: fileName, type: asset.mimeType });
        } catch (err) {
          console.warn('remote upload failed, keeping optimistic note', err);
          setNotes(prev => prev.map(n => n.id === tempId ? { ...n, uploadFailed: true, errorMessage: String((err as any)?.message || 'Upload failed') } as any : n));
        }
      } else {
        created = optimistic;
      }
      if (created) {
        setNotes(prev => prev.map(n => n.id === tempId ? created! : n));
      }
    } catch (e) {
      console.warn('uploadResource error', e);
    }
  };

  const retryUpload = async (note: any) => {
    if (!note || !note.uploadFailed) return;
    const { lessonId, attachmentUrl: uri, attachmentName: name, mimeType: type } = note;
    if (!uri) return;
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, uploadFailed: false, errorMessage: undefined } : n));
    try {
      const real = await Services.content.createNoteWithAttachment?.(id, lessonId, { uri, name, type });
      if (real) setNotes(prev => prev.map(n => n.id === note.id ? real as any : n));
    } catch (err: any) {
      console.warn('retryUpload failed', err);
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, uploadFailed: true, errorMessage: String(err?.message || 'Retry failed') } : n));
      if (/unauthorized/i.test(String((err as any)?.message))) {
        Alert.alert('Upload Unauthorized', 'Storage bucket is blocking file create. In Appwrite console, open the bucket and add Create permission for Users (Role.users()). Then retry.');
      }
    }
  };

  const deleteNote = async (note: Note) => {
    // Optimistically remove from UI
    setNotes(prev => prev.filter(n => n.id !== note.id));
    try { await Services.content.deleteNote?.(note.id); } catch {}
  };

  const renameNote = (note: Note) => {
    // Placeholder: no rename UI; retain title.
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="gap-4">
        {canEdit && (
          <Pressable
            onPress={async () => {
              setPendingTitle('New Lesson');
              setPendingAbout('');
              setPendingCoverLocal(undefined);
              try {
                const created = await Services.content.createLesson?.(id, { title: 'New Lesson', about: '' });
                if (created) {
                  setLessons(prev => [...prev, { ...created }]);
                  setEditingLessonId(created.id);
                  setEditVisible(true);
                  setOpen({ [created.id]: true });
                  return;
                }
              } catch (e) {
                console.warn('remote createLesson failed, using local optimistic', e);
              }
              // Fallback optimistic if remote failed
              const tempId = ID.unique();
              const newLesson: any = { id: tempId, courseId: id, title: 'New Lesson', order: lessons.length + 1, about: '', coverUrl: undefined, unsaved: true };
              setLessons(prev => [...prev, newLesson]);
              setEditingLessonId(tempId);
              setEditVisible(true);
              setOpen({ [tempId]: true });
            }}
            className="flex-row items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
          >
            <Ionicons name="add-circle-outline" size={20} color={accent} />
            <Text className="text-sm font-medium" style={{ color: accent }}>Add Lesson</Text>
          </Pressable>
        )}
        {lessons.map(l => {
          const ln = notes.filter(n => n.lessonId === l.id);
          const isOpen = open[l.id];
          return (
            <View key={l.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              <SwipeableRow
                ref={(r) => { rowRefs.current[l.id] = r; }}
                rightButtons={canEdit ? [
                  <TouchableOpacity key="edit" activeOpacity={0.8} onPress={() => { setEditingLessonId(l.id); setPendingTitle(l.title); setPendingAbout(l.about || ''); setPendingCoverLocal(undefined); setEditVisible(true); try { rowRefs.current[l.id]?.recenter(); } catch {} }} style={{ width: 88, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563eb' }}>
                    <Ionicons name="create-outline" size={24} color="#ffffff" />
                  </TouchableOpacity>,
                  <TouchableOpacity key="del" activeOpacity={0.8} onPress={() => {
                    Alert.alert('Delete lesson?', 'This will remove the lesson and reindex remaining lessons.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => {
                        // Remote deletion if available
                        try { await Services.content.deleteLesson?.(l.id); } catch {}
                        setLessons(prev => {
                          const remaining = prev.filter(x => x.id !== l.id);
                          // Reindex order dynamically
                          return remaining.map((x, i) => ({ ...x, order: i + 1 }));
                        });
                      } },
                    ]);
                  }} style={{ width: 88, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#dc2626' }}>
                    <Ionicons name="trash-outline" size={24} color="#ffffff" />
                  </TouchableOpacity>
                ] : undefined}
                rightButtonWidth={88}
                onSwipeStart={() => {
                  // Keep current lesson's open state, close others
                  setOpen(prev => {
                    const next: Record<string, boolean> = {};
                    for (const x of lessons) next[x.id] = (x.id === l.id ? prev[x.id] : false);
                    return next;
                  });
                }}
                useNativeDriver={true}
              >
              <Pressable
                onPress={() => {
                  // Accordion behavior: only one open at a time
                  const nextState = !isOpen;
                  const closed: Record<string, boolean> = {};
                  for (const x of lessons) closed[x.id] = false;
                  if (nextState) closed[l.id] = true;
                  setOpen(closed);
                }}
                onLongPress={() => { if (canEdit) { setEditingLessonId(l.id); setPendingTitle(l.title); setPendingAbout(l.about || ''); setEditVisible(true); } }}
                className="px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-4">
                  {l.coverUrl ? (
                    <Image source={{ uri: l.coverUrl }} style={{ width: 56, height: 40, borderRadius: 8 }} />
                  ) : (
                    <View style={{ width: 56, height: 40, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={24} color={accent} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">Lesson {l.order}</Text>
                    <Text className="text-neutral-800 dark:text-neutral-100 font-medium" numberOfLines={1}>{l.title}</Text>
                    {completed[l.id] && <Text className="text-[11px] text-green-600 mt-0.5">Completed</Text>}
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  {canEdit && (
                    <Pressable onPress={() => {
                      const next = !completed[l.id];
                      setCompleted(prev => ({ ...prev, [l.id]: next }));
                      setLessons(prev => prev.map(x => x.id === l.id ? ({ ...x, completed: next } as any) : x));
                      try { Services.content.updateLesson(l.id, { completed: next }); } catch {}
                    }} hitSlop={8}>
                      <Ionicons name={completed[l.id] ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={completed[l.id] ? '#059669' : '#6b7280'} />
                    </Pressable>
                  )}
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
                </View>
              </Pressable>
              </SwipeableRow>
              {isOpen && (
                <View className="px-4 pb-4 gap-4">
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-semibold">About</Text>
                    </View>
                    <Text className="text-[13px] text-neutral-600 dark:text-neutral-300">{l.about || 'No description yet.'}</Text>
                  </View>
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-semibold">Notes & Resources</Text>
                      {canEdit && (
                        <View className="flex-row items-center gap-3" />
                      )}
                    </View>
                     <View className="gap-2">
                      {ln.filter(n => n.attachmentUrl || n.attachmentName).length > 0 ? ln.filter(n => n.attachmentUrl || n.attachmentName).map(n => {
                        const { icon, color } = iconFor(n.title);
                        const hasLink = Boolean(n.attachmentUrl) || Boolean((n as any).fileId);
                        return (
                          <View key={n.id} className="flex-row items-center gap-3 relative">
                            <Pressable disabled={!hasLink || (n as any).uploadFailed} onPress={() => openAttachment(n)} onLongPress={() => console.info('[attachmentLongPress]', { id: n.id, fileId: (n as any).fileId, url: n.attachmentUrl })} className="flex-row items-center gap-3 flex-1" style={{ opacity: (hasLink && !(n as any).uploadFailed) ? 1 : 0.6 }}>
                              {n.mimeType?.startsWith('image/') && n.attachmentUrl ? (
                                <View>
                                  <Image source={{ uri: n.attachmentUrl }} style={{ width: 52, height: 40, borderRadius: 8 }} />
                                  {canEdit && editVisible && editingLessonId === l.id && (
                                    <Pressable onPress={() => deleteNote(n)} hitSlop={8} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#111827dd', borderRadius: 12 }}>
                                      <Ionicons name="close" size={14} color="#ffffff" />
                                    </Pressable>
                                  )}
                                </View>
                              ) : (
                                <View style={{ width: 52, height: 40, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name={icon as any} size={22} color={color} />
                                  {canEdit && editVisible && editingLessonId === l.id && (
                                    <Pressable onPress={() => deleteNote(n)} hitSlop={8} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#111827dd', borderRadius: 12 }}>
                                      <Ionicons name="close" size={14} color="#ffffff" />
                                    </Pressable>
                                  )}
                                </View>
                              )}
                              <View className="flex-1 ml-2">
                                <Text className="text-[13px]" numberOfLines={1}>{n.title}</Text>
                                { (n as any).uploadFailed ? (
                                  <Pressable onPress={() => retryUpload(n)}>
                                    <Text className="text-[11px] mt-0.5" style={{ color: '#dc2626' }}>{formatRelativeShort(n.createdAt)} • failed – tap to retry</Text>
                                  </Pressable>
                                ) : (
                                  <Text className="text-[11px] text-neutral-500 mt-0.5">{formatRelativeShort(n.createdAt)} • {n.visibility}{!hasLink ? ' • preparing…' : ''}</Text>
                                ) }
                              </View>
                            </Pressable>
                          </View>
                        );
                      }) : (
                        <Text className="text-[12px] text-neutral-500">No resources yet.</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
        {lessons.length === 0 && <EmptyState title="No lessons yet" />}
      </View>

      {/* Edit lesson bottom sheet modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setEditVisible(false)}>
          <View className="flex-1 justify-end">
            <Pressable onPress={() => {}} className="w-full rounded-t-2xl bg-white dark:bg-neutral-900 p-4" style={{ elevation: 6 }}>
              <Text className="text-base font-semibold mb-3 dark:text-white">Edit Lesson {lessons.findIndex(ls => ls.id === editingLessonId) + 1}</Text>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">Title</Text>
                <TextInput value={pendingTitle} onChangeText={setPendingTitle} placeholder="Lesson title" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" />
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-1">About</Text>
                <TextInput value={pendingAbout} onChangeText={(t)=>{ if (t.length<=ABOUT_LIMIT) setPendingAbout(t); }} placeholder="Short description" multiline numberOfLines={6} maxLength={ABOUT_LIMIT} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" style={{ minHeight: 100, textAlignVertical: 'top' }} />
                <Text className="text-[11px] text-neutral-500 mt-1">{pendingAbout.length}/{ABOUT_LIMIT}</Text>
              </View>
              <View className="mb-3">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200 mb-2">Lesson picture</Text>
                {editingLessonId && (
                  <View className="mb-3">
                    {(() => {
                      const current = lessons.find(ls => ls.id === editingLessonId);
                      const preview = pendingCoverLocal || current?.coverUrl;
                      if (!preview) return null;
                      return (
                        <View style={{ width: '100%', position: 'relative' }}>
                          <Image source={{ uri: preview }} style={{ width: '100%', height: 140, borderRadius: 12 }} />
                          <Pressable onPress={() => { setPendingCoverLocal(undefined); setLessons(prev => prev.map(ls => ls.id === editingLessonId ? { ...ls, coverUrl: undefined } : ls)); }} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#111827cc', borderRadius: 16, padding: 6 }} hitSlop={8}>
                            <Ionicons name="close" size={18} color="#ffffff" />
                          </Pressable>
                        </View>
                      );
                    })()}
                  </View>
                )}
                <View className="flex-row items-center gap-3">
                  <Pressable onPress={async () => {
                    try {
                      const img: any = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
                      if (img && !img.canceled) {
                        const asset = img.assets?.[0] || img;
                        setPendingCoverLocal(asset.uri); // optimistic preview
                        if (Services.content.uploadLessonImage && editingLessonId) {
                          try {
                            const url = await Services.content.uploadLessonImage(editingLessonId, { uri: asset.uri, name: asset.name, type: asset.mimeType });
                            setLessons(prev => prev.map(ls => ls.id === editingLessonId ? { ...ls, coverUrl: url } : ls));
                            setPendingCoverLocal(undefined);
                          } catch (err) {
                            console.warn('upload image failed, keeping local preview', err);
                          }
                        } else if (editingLessonId) {
                          setLessons(prev => prev.map(ls => ls.id === editingLessonId ? { ...ls, coverUrl: asset.uri } : ls));
                        }
                      }
                    } catch (e) { console.warn('upload image error', e); }
                  }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Text className="text-sm dark:text-white">Select picture</Text>
                  </Pressable>
                  <Pressable onPress={async () => {
                    if (Services.content.deleteLessonImage && editingLessonId) {
                      try { await Services.content.deleteLessonImage(editingLessonId); } catch {}
                    }
                    setPendingCoverLocal(undefined);
                    setLessons(prev => prev.map(ls => ls.id === editingLessonId ? { ...ls, coverUrl: undefined } : ls));
                  }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Text className="text-sm text-red-600">Remove</Text>
                  </Pressable>
                </View>
              </View>
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-neutral-700 dark:text-neutral-200">Notes & Resources</Text>
                  <Pressable onPress={async () => {
                    const lid = editingLessonId; if (!lid) return;
                    try {
                      const picked: any = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
                      if (picked && !picked.canceled) {
                        const asset = picked.assets?.[0] || picked;
                        const fileName = asset.name || 'Attachment';
                        const tempId = ID.unique();
                        const optimistic: Note = { id: tempId, courseId: id, lessonId: lid, authorId: 'me', visibility: 'course', title: fileName, content: '', createdAt: new Date().toISOString(), attachmentName: fileName, attachmentUrl: asset.uri, mimeType: asset.mimeType, uploadFailed: false } as any;
                        setNotes(prev => [...prev, optimistic]);
                        if (Services.content.createNoteWithAttachment) {
                          try {
                            const real = await Services.content.createNoteWithAttachment(id, lid, { uri: asset.uri, name: fileName, type: asset.mimeType });
                            setNotes(prev => prev.map(n => n.id === tempId ? real : n));
                          } catch (err) {
                            console.warn('upload in modal error', err);
                            setNotes(prev => prev.map(n => n.id === tempId ? { ...n, uploadFailed: true, errorMessage: String((err as any)?.message || 'Upload failed') } : n));
                          }
                        }
                      }
                    } catch (e) { console.warn('upload in modal error', e); }
                  }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Text className="text-sm dark:text-white">Upload</Text>
                  </Pressable>
                </View>
                <View className="gap-2">
                  {(() => { const lid = editingLessonId; const ln = notes.filter(n => n.lessonId === lid); return ln; })()
                    .filter(n => n.attachmentUrl || n.attachmentName).map(n => {
                      const { icon, color } = iconFor(n.title, n.mimeType);
                      return (
                        <View key={n.id} className="flex-row items-center gap-3">
                          <Pressable onPress={() => openAttachment(n)}>
                            {n.mimeType?.startsWith('image/') && n.attachmentUrl ? (
                              <View>
                                <Image source={{ uri: n.attachmentUrl }} style={{ width: 60, height: 46, borderRadius: 10 }} />
                                <Pressable onPress={() => deleteNote(n)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#111827cc', borderRadius: 14, padding: 4 }} hitSlop={8}>
                                  <Ionicons name="close" size={14} color="#ffffff" />
                                </Pressable>
                              </View>
                            ) : (
                              <View style={{ width: 60, height: 46, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name={icon as any} size={24} color={color} />
                                <Pressable onPress={() => deleteNote(n)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#111827cc', borderRadius: 14, padding: 4 }} hitSlop={8}>
                                  <Ionicons name="close" size={14} color="#ffffff" />
                                </Pressable>
                              </View>
                            )}
                          </Pressable>
                          <View className="flex-1">
                            <Text className="text-[13px]" numberOfLines={1}>{n.title}</Text>
                            <Text className="text-[11px] text-neutral-500 mt-0.5">{formatRelativeShort(n.createdAt)} • {n.visibility}</Text>
                          </View>
                        </View>
                      );
                    })}
                  {(() => { const lid = editingLessonId; const ln = notes.filter(n => n.lessonId === lid).filter(n => n.attachmentUrl || n.attachmentName).length; return ln; })() === 0 && (
                    <Text className="text-[12px] text-neutral-500">No resources yet.</Text>
                  )}
                </View>
              </View>
              <View className="flex-row justify-end gap-3">
                <Pressable onPress={() => setEditVisible(false)} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800"><Text className="dark:text-white">Cancel</Text></Pressable>
                <Pressable onPress={async () => {
                  const lid = editingLessonId;
                  if (!lid) return;
                  const current = lessons.find(ls => ls.id === lid);
                  if (current?.unsaved) {
                    // Attempt remote creation
                    try {
                      const created = await Services.content.createLesson?.(id, { title: pendingTitle || 'New Lesson', about: pendingAbout || '' });
                      if (created) {
                        setLessons(prev => prev.map(ls => ls.id === lid ? { ...created, order: prev.findIndex(p => p.id === lid) + 1 } : ls));
                        setEditingLessonId(created.id);
                      }
                    } catch (e) {
                      console.warn('createLesson failed, keeping local', e);
                      // Keep local optimistic entry
                      setLessons(prev => prev.map(ls => ls.id === lid ? { ...ls, title: pendingTitle, about: pendingAbout } : ls));
                    }
                  } else {
                    setLessons(prev => prev.map(ls => ls.id === lid ? { ...ls, title: pendingTitle, about: pendingAbout } : ls));
                    try { if (Services.content.updateLesson) Services.content.updateLesson(lid, { title: pendingTitle, about: pendingAbout }); } catch {}
                  }
                  setEditVisible(false);
                  try { if (lid) rowRefs.current[lid]?.recenter(); } catch {}
                  if (lid) setOpen({ [lid]: true });
                }} className="px-4 py-2 rounded-xl" style={{ backgroundColor: accent }}>
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
