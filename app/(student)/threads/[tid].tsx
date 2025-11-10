import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Services } from '@/services/providers';
import type { Message, Thread } from '@/data/chat';

export default function ThreadDetailScreen() {
  const { tid } = useLocalSearchParams<{ tid: string }>();
  const id = String(tid);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    (async () => {
      const t = await Services.chat.getThread(id);
      setThread(t);
      const m = await Services.chat.listMessages(id);
      setMessages(m);
    })();
  }, [id]);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    const msg = await Services.chat.sendMessage(id, text);
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="px-4 pt-4">
          <Text className="text-2xl font-extrabold mb-2">{thread?.title ?? 'Thread'}</Text>
        </View>
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 16 }}>
          {messages.map((m) => (
            <View key={m.id} className={`mb-2 self-${m.authorName === 'You' ? 'end' : 'start'}`}>
              <View className={`max-w-[80%] rounded-2xl p-3 ${m.authorName === 'You' ? 'bg-[#00AFC8]' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'}`}>
                <Text className={m.authorName === 'You' ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}>{m.text}</Text>
              </View>
              <Text className="text-xs text-neutral-500 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="px-4 pb-4">
          <View className="flex-row items-center gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message"
              placeholderTextColor="#9CA3AF"
              className="flex-1 rounded-2xl px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            />
            <Pressable onPress={onSend} className="px-4 py-2 rounded-2xl bg-[#00AFC8]">
              <Text className="text-white font-semibold">Send</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
