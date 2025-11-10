import type { ChatService } from '@/services/contracts';
import { api } from '@/lib/http';

// NOTE: This is a scaffold for a real backend.
// Replace endpoint paths with your API and map the response shapes to contract types if needed.

export const liveChat: ChatService = {
  async listThreads() {
    // GET /threads -> Thread[]
    return api.get('/threads');
  },
  async getThread(threadId: string) {
    // GET /threads/:id -> Thread
    return api.get(`/threads/${encodeURIComponent(threadId)}`);
  },
  async listMessages(threadId: string) {
    // GET /threads/:id/messages -> Message[]
    return api.get(`/threads/${encodeURIComponent(threadId)}/messages`);
  },
  async sendMessage(threadId: string, text: string, context?: { assignmentId?: string; sectionKey?: string; taskId?: string; sectionTitle?: string; taskTitle?: string }, attachments?: any) {
    // POST /threads/:id/messages { text, context, attachments } -> Message
    return api.post(`/threads/${encodeURIComponent(threadId)}/messages`, { text, context, attachments });
  },
};
