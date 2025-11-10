import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Services } from '@/services/providers';
import type { Message, Thread, Attachment } from '@/data/chat';
import * as WebBrowser from 'expo-web-browser';
import MessageRow, { type ExpandedPreview } from '@/components/chat/MessageRow';
import { randomImage } from '@/utils/imagePlaceholders';

export default function ThreadScreen() {
  const { threadId, assignmentId, sectionKey, taskId, sectionTitle, taskTitle } = useLocalSearchParams<{
    threadId: string;
    assignmentId?: string;
    sectionKey?: string;
    taskId?: string;
    sectionTitle?: string;
    taskTitle?: string;
  }>();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);
  const [expandedPreview, setExpandedPreview] = useState<ExpandedPreview>(null);
  const [zoomAttachment, setZoomAttachment] = useState<Attachment | null>(null);
  const [currentDayLabel, setCurrentDayLabel] = useState<string>('');
  const [loadingOlder, setLoadingOlder] = useState(false);

  const contextLabel = useMemo(() => {
    if (!assignmentId) return null;
    const idPart = [assignmentId, sectionKey, taskId].filter(Boolean).join(' / ');
    const titlePart = [sectionTitle, taskTitle].filter(Boolean).join(' • ');
    return { idPart, titlePart };
  }, [assignmentId, sectionKey, taskId, sectionTitle, taskTitle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const t = await Services.chat.getThread(String(threadId));
      const msgs = await Services.chat.listMessages(String(threadId));
      if (!mounted) return;
      setThread(t);
      setMessages(msgs);
      setLoading(false);
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
    })();
    return () => { mounted = false; };
  }, [threadId]);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    // Optimistic append
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      threadId: String(threadId),
      authorId: 'u-student-1',
      authorName: 'You',
      text,
      createdAt: new Date().toISOString(),
    };
  setMessages((m) => [...m, optimistic]);
  requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
    try {
      const saved = await Services.chat.sendMessage(String(threadId), text, {
        assignmentId: assignmentId ? String(assignmentId) : undefined,
        sectionKey: sectionKey ? String(sectionKey) : undefined,
        taskId: taskId ? String(taskId) : undefined,
        sectionTitle: sectionTitle ? String(sectionTitle) : undefined,
        taskTitle: taskTitle ? String(taskTitle) : undefined,
      });
      setMessages((m) => m.map((mm) => (mm.id === optimistic.id ? saved : mm)));
    } catch (e) {
      // Rollback on failure
      setMessages((m) => m.filter((mm) => mm.id !== optimistic.id));
      setInput(text);
    }
  };

  const openMessageContext = (m: Message) => {
    if (!m.context?.assignmentId || !thread?.courseId) return;
    const query: string[] = [];
    if (m.context.sectionKey) query.push(`sectionKey=${encodeURIComponent(m.context.sectionKey)}`);
    if (m.context.taskId) query.push(`taskId=${encodeURIComponent(m.context.taskId)}`);
    const qs = query.length ? `?${query.join('&')}` : '';
    const url = `/(student)/course/${encodeURIComponent(thread.courseId)}/assignments/${encodeURIComponent(m.context.assignmentId)}${qs}`;
    router.push(url as any);
  };

  const attachSample = async (kind: 'pdf' | 'image') => {
    const sample: Attachment = kind === 'pdf'
      ? {
          id: `a-${Math.random().toString(36).slice(2, 7)}`,
          name: 'sample.pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          mimeType: 'application/pdf',
        }
      : {
          id: `a-${Math.random().toString(36).slice(2, 7)}`,
          name: 'image.jpg',
          url: randomImage(`thread-${threadId}-${Date.now()}`, 800, 600),
          mimeType: 'image/jpeg',
        };
    // Send as an attachment-only message with a small caption
    const caption = kind === 'pdf' ? 'Attached a PDF' : 'Attached an image';
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      threadId: String(threadId),
      authorId: 'u-student-1',
      authorName: 'You',
      text: caption,
      createdAt: new Date().toISOString(),
      attachments: [sample],
    };
  setMessages((m) => [...m, optimistic]);
  requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
    try {
      const saved = await Services.chat.sendMessage(String(threadId), caption, undefined, [sample]);
      setMessages((m) => m.map((mm) => (mm.id === optimistic.id ? saved : mm)));
    } catch (e) {
      setMessages((m) => m.filter((mm) => mm.id !== optimistic.id));
    }
  };

  const openAttachment = async (a: Attachment) => {
    if (a.mimeType?.startsWith('application/pdf')) {
      // Fallback: open in our PDF viewer route if inline preview isn't enough
      router.push((`/(student)/pdf-viewer?url=${encodeURIComponent(a.url)}` as any));
      return;
    }
    await WebBrowser.openBrowserAsync(a.url);
  };

  // moved type guards into MessageRow

  const loadOlder = async () => {
    if (loadingOlder) return;
    setLoadingOlder(true);
    const tid = String(threadId);
    const oldest = messages[0];
    const base = oldest ? new Date(oldest.createdAt).getTime() : Date.now();
    const count = 5;
    const generated: Message[] = Array.from({ length: count }).map((_, idx) => {
      const t = new Date(base - (idx + 1) * 60_000).toISOString();
      return {
        id: `old-${Date.now()}-${idx}`,
        threadId: tid,
        authorId: idx % 2 === 0 ? 'u-student-2' : 'u-teacher-1',
        authorName: idx % 2 === 0 ? 'Ava' : 'Prof. Lee',
        text: `Earlier message ${idx + 1}`,
        createdAt: t,
      };
    });
    // Prepend in ascending order
    setMessages((prev) => [...generated.reverse(), ...prev]);
    setLoadingOlder(false);
  };

  const formatDay = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="py-2 pr-4"><Text className="text-blue-600">Back</Text></Pressable>
          <Text className="text-lg font-bold flex-1" numberOfLines={1}>{thread?.title ?? 'Thread'}</Text>
          <View style={{ width: 48 }} />
        </View>
        {contextLabel && (
          <View className="mx-4 mb-2 rounded-xl p-3 bg-blue-50 dark:bg-neutral-900 border border-blue-200 dark:border-neutral-800">
            <Text className="text-blue-800 dark:text-neutral-200 text-[11px]">In context</Text>
            {contextLabel.titlePart ? (
              <Text className="text-blue-900 dark:text-neutral-100 font-semibold" numberOfLines={2}>{contextLabel.titlePart}</Text>
            ) : null}
            <Text className="text-blue-700 dark:text-neutral-300 text-xs" numberOfLines={1}>{contextLabel.idPart}</Text>
          </View>
        )}
        {loading ? (
          <View className="flex-1 items-center justify-center"><Text className="text-neutral-500">Loading…</Text></View>
        ) : (
          <FlatList
            ref={listRef}
            className="flex-1 px-4"
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            keyboardDismissMode={Platform.select({ ios: 'interactive', android: 'on-drag' }) as any}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item: m, index }) => {
              const prev = index > 0 ? messages[index - 1] : undefined;
              const showDateHeader = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              return (
                <View>
                  {showDateHeader && (
                    <View className="items-center my-2">
                      <View className="px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <Text className="text-xs text-neutral-700 dark:text-neutral-200">{formatDay(m.createdAt)}</Text>
                      </View>
                    </View>
                  )}
                  <MessageRow
                    message={m}
                    isOwn={m.authorName === 'You'}
                    expandedPreview={expandedPreview}
                    setExpandedPreview={setExpandedPreview}
                    onOpenContext={openMessageContext}
                    onOpenAttachment={openAttachment}
                    onZoomImage={(a) => setZoomAttachment(a)}
                  />
                </View>
              );
            }}
            ListEmptyComponent={<View className="items-center mt-8"><Text className="text-neutral-500">No messages yet.</Text></View>}
            initialNumToRender={12}
            windowSize={7}
            removeClippedSubviews
            onViewableItemsChanged={({ viewableItems }) => {
              // Collapse heavy preview if its message is off-screen
              if (expandedPreview) {
                const visibleIds = new Set(viewableItems.map((vi) => vi.item?.id));
                if (!visibleIds.has(expandedPreview.messageId)) setExpandedPreview(null);
              }
              // Update floating date pill using the most frequent visible day
              const dayCounts: Record<string, number> = {};
              for (const vi of viewableItems) {
                const item = vi.item as Message | undefined;
                if (!item) continue;
                const key = new Date(item.createdAt).toDateString();
                dayCounts[key] = (dayCounts[key] || 0) + 1;
              }
              const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
              if (topDay) setCurrentDayLabel(formatDay(topDay));
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
            onEndReachedThreshold={0.15}
            onEndReached={() => {
              // In inverted list, end reached is the top
              loadOlder();
            }}
            ListFooterComponent={
              // In inverted list, footer appears at top visually
              <View className="py-3 items-center">
                <Pressable onPress={loadOlder} disabled={loadingOlder} className={`px-3 py-2 rounded-full ${loadingOlder ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
                  <Text className="text-neutral-800 dark:text-neutral-100 text-xs">{loadingOlder ? 'Loading…' : 'Load older messages'}</Text>
                </Pressable>
              </View>
            }
          />
        )}
        {currentDayLabel ? (
          <View className="absolute top-2 self-center px-3 py-1 rounded-full bg-black/60">
            <Text className="text-white text-xs">{currentDayLabel}</Text>
          </View>
        ) : null}
        {zoomAttachment && (
          <Pressable onPress={() => setZoomAttachment(null)} className="absolute inset-0 bg-black/90 items-center justify-center">
            <Image source={{ uri: zoomAttachment.url }} style={{ width: '92%', height: '92%' }} resizeMode="contain" />
            <Text className="absolute top-10 right-6 text-white text-sm">Tap to close</Text>
          </Pressable>
        )}
        <View className="px-4 pt-2 flex-row items-center gap-2">
          <Pressable onPress={() => attachSample('pdf')} className="px-3 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
            <Text className="text-neutral-800 dark:text-neutral-100">Attach sample PDF</Text>
          </Pressable>
          <Pressable onPress={() => attachSample('image')} className="px-3 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
            <Text className="text-neutral-800 dark:text-neutral-100">Attach sample image</Text>
          </Pressable>
        </View>
        <View className="px-4 pb-4 pt-2 flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={taskTitle ? `Reply about “${String(taskTitle)}”…` : 'Message…'}
            className="flex-1 rounded-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
          <Pressable onPress={onSend} disabled={!input.trim()} className={`px-4 py-3 rounded-full ${input.trim() ? 'bg-blue-600' : 'bg-neutral-300'}`}>
            <Text className="text-white font-semibold">Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
