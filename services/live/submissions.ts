import type { SubmissionsService } from '@/services/contracts';

export const liveSubmissions: SubmissionsService = {
  async list(assessmentId: string) {
    throw new Error('liveSubmissions.list not implemented');
  },
  async get(submissionId: string) {
    throw new Error('liveSubmissions.get not implemented');
  },
  async grade(submissionId: string, input: { grade: number; feedback?: string }) {
    throw new Error('liveSubmissions.grade not implemented');
  },
  async submit(assessmentId: string, input: { content?: string; attachments?: Array<{ uri: string; name?: string }> }) {
    throw new Error('liveSubmissions.submit not implemented');
  },
};
