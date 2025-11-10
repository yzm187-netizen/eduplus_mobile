import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Message, Attachment } from '@/data/chat';

export type ExpandedPreview = { attachmentId: string; messageId: string } | null;

type Props = {
  message: Message;
  isOwn: boolean;
  expandedPreview: ExpandedPreview;
  setExpandedPreview: (v: ExpandedPreview) => void;
  onOpenContext: (m: Message) => void;
  onOpenAttachment: (a: Attachment) => void;
  onZoomImage: (a: Attachment) => void;
};

const isImage = (a: Attachment) => a.mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(a.name);
const isPdf = (a: Attachment) => a.mimeType === 'application/pdf' || /\.pdf$/i.test(a.name);
const extOf = (name?: string) => (name?.split('.').pop() || '').toUpperCase();
const thumbFor = (a: Attachment) => {
  const ext = extOf(a.name || 'FILE');
  // Neutral background, readable text; keep small for chat bubble
  return `https://placehold.co/80x60/e5e7eb/111111?text=${encodeURIComponent(ext)}`;
};

function MessageRowImpl({ message: m, isOwn, expandedPreview, setExpandedPreview, onOpenContext, onOpenAttachment, onZoomImage }: Props) {
  return (
    <View className={`my-1 max-w-[80%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
      <View className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-blue-600' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'}`}>
        <Text className={`text-xs mb-1 ${isOwn ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'}`}>{m.authorName}</Text>
        <Text className={`${isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{m.text}</Text>

        {m.context?.assignmentId && (
          <View className={`mt-2 self-stretch rounded-2xl ${isOwn ? 'bg-blue-500' : 'bg-neutral-100 dark:bg-neutral-800'} border ${isOwn ? 'border-blue-400' : 'border-neutral-200 dark:border-neutral-700'}`}>
            <View className="px-3 py-2">
              <Text className={`${isOwn ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'} text-[11px]`}>Replying to</Text>
              {m.context.taskTitle || m.context.sectionTitle ? (
                <Text className={`${isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'} font-semibold`} numberOfLines={2}>
                  {[m.context.sectionTitle, m.context.taskTitle].filter(Boolean).join(' • ')}
                </Text>
              ) : null}
              <Text className={`${isOwn ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-300'} text-xs`} numberOfLines={1}>
                {m.context.assignmentId}{m.context.sectionKey ? ` • ${m.context.sectionKey}` : ''}{m.context.taskId ? ` • task ${m.context.taskId}` : ''}
              </Text>
              <View className="flex-row gap-3 mt-2">
                <Pressable onPress={() => onOpenContext(m)} className={`${isOwn ? 'bg-blue-600' : 'bg-white dark:bg-neutral-900'} px-3 py-1 rounded-full`}>
                  <Text className={`${isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'} text-xs font-semibold`}>Open</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {m.attachments && m.attachments.length > 0 && (
          <View className={`mt-2 gap-2`}>
            {m.attachments.map((a) => {
              const expanded = expandedPreview?.attachmentId === a.id && expandedPreview.messageId === m.id;
              if (isImage(a)) {
                return (
                  <View key={a.id} className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                    <Pressable onPress={() => onZoomImage(a)}>
                      <Image source={{ uri: a.url }} style={{ width: 240, height: 160 }} resizeMode="cover" />
                    </Pressable>
                    <View className="flex-row items-center justify-between px-3 py-2">
                      <Text className={`${isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>📎 {a.name}</Text>
                      <Pressable onPress={() => onOpenAttachment(a)}>
                        <Text className={`text-xs ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}>Open</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              }
              if (isPdf(a)) {
                return (
                  <View key={a.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                    <View className="flex-row items-center justify-between px-3 py-2">
                      <Text className={`${isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>📄 {a.name}</Text>
                      <View className="flex-row gap-3">
                        <Pressable onPress={() => setExpandedPreview(expanded ? null : { attachmentId: a.id, messageId: m.id })}>
                          <Text className={`text-xs ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}>{expanded ? 'Hide preview' : 'Preview'}</Text>
                        </Pressable>
                        <Pressable onPress={() => onOpenAttachment(a)}>
                          <Text className={`text-xs ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}>Open</Text>
                        </Pressable>
                      </View>
                    </View>
                    {expanded && (
                      <View style={{ height: 220 }} className="bg-white dark:bg-black">
                        <WebView source={{ uri: a.url }} style={{ flex: 1 }} />
                      </View>
                    )}
                  </View>
                );
              }
              return (
                <Pressable key={a.id} onPress={() => onOpenAttachment(a)} className={`rounded-2xl ${isOwn ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                  <View className="flex-row items-center p-2 gap-3">
                    <Image source={{ uri: thumbFor(a) }} style={{ width: 68, height: 52, borderRadius: 10 }} />
                    <View className="flex-1 pr-2">
                      <Text className={`${isOwn ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`} numberOfLines={1}>📎 {a.name}</Text>
                      <Text className={`text-xs ${isOwn ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-300'}`}>Tap to open</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <Text className="text-[10px] text-neutral-400 mt-1">{new Date(m.createdAt).toLocaleString()}</Text>
    </View>
  );
}

export default React.memo(MessageRowImpl);
