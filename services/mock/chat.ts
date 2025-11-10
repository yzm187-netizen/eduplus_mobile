import type { ChatService } from '@/services/contracts';
import { threads as sampleThreads, messages as sampleMessages } from '@/data/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep local, mutable copies so we can reflect runtime changes in mock mode
let messages = [...sampleMessages];
let threads = [...sampleThreads];
let hydrated = false;

const MSG_KEY = 'chat.messages';
const THR_KEY = 'chat.threads';

async function ensureHydrated() {
  if (hydrated) return;
  try {
    const [mStr, tStr] = await Promise.all([
      AsyncStorage.getItem(MSG_KEY),
      AsyncStorage.getItem(THR_KEY),
    ]);
    if (mStr) messages = JSON.parse(mStr);
    if (tStr) threads = JSON.parse(tStr);
  } catch (e) {
    // ignore; fall back to sample data
  } finally {
    hydrated = true;
  }
}

async function persistAll() {
  try {
    await Promise.all([
      AsyncStorage.setItem(MSG_KEY, JSON.stringify(messages)),
      AsyncStorage.setItem(THR_KEY, JSON.stringify(threads)),
    ]);
  } catch {
    // best effort in mock mode
  }
}

export const mockChat: ChatService = {
  async listThreads() {
    await ensureHydrated();
    // Sort by lastMessageAt desc
    return [...threads].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  },
  async getThread(threadId: string) {
    await ensureHydrated();
    return threads.find((t) => t.id === threadId) ?? null;
  },
  async listMessages(threadId: string) {
    await ensureHydrated();
    return messages.filter((m) => m.threadId === threadId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  async sendMessage(
    threadId: string,
    text: string,
    context?: { assignmentId?: string; sectionKey?: string; taskId?: string },
    attachments?: any
  ) {
    await ensureHydrated();
    const msg = {
      id: `m-${Math.random().toString(36).slice(2, 7)}`,
      threadId,
      authorId: 'u-student-1',
      authorName: 'You',
      text,
      createdAt: new Date().toISOString(),
      context,
      attachments,
    };
    messages.push(msg);
    // Update thread lastMessageAt for ordering
    const idx = threads.findIndex((t) => t.id === threadId);
    if (idx !== -1) {
      threads[idx] = { ...threads[idx], lastMessageAt: msg.createdAt };
    }
    await persistAll();
    return msg;
  },
};

// Helper for demo reset flows
export async function resetMockChat() {
  messages = [...sampleMessages];
  threads = [...sampleThreads];
  hydrated = true;
  try {
    await AsyncStorage.multiRemove([MSG_KEY, THR_KEY]);
  } catch {}
}
