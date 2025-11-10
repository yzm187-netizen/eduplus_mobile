import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Services } from '@/services/providers';

export default function NoteViewerScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    (async () => {
      const note = await Services.content.getNote(String(noteId));
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      }
    })();
  }, [noteId]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <ScrollView className="px-4 pt-4" contentContainerStyle={{ paddingBottom: 48 }}>
        <Text className="text-2xl font-extrabold mb-2" numberOfLines={2}>{title || 'Note'}</Text>
        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          {/* Simple preformatted block for markdown/plain text in mock mode. */}
          <Text className="text-neutral-800 dark:text-neutral-100" style={{ lineHeight: 22, fontFamily: 'System' }}>{content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
