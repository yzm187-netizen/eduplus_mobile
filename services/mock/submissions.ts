import { SubmissionsService } from '@/services/contracts';

const subsByAssessment: Record<string, Array<{ id: string; studentName?: string; status: string; grade?: number }>> = {
  'a-lit-review': [ { id: 's-1', studentName: 'You', status: 'submitted' } ],
};

export const mockSubmissions: SubmissionsService = {
  async list(assessmentId: string) {
    return subsByAssessment[assessmentId] || [];
  },
  async get(submissionId: string) {
    for (const aid of Object.keys(subsByAssessment)) {
      const s = subsByAssessment[aid].find(x => x.id === submissionId);
      if (s) return { id: s.id, studentName: s.studentName, status: s.status, grade: s.grade };
    }
    return null;
  },
  async grade(submissionId: string, input: { grade: number; feedback?: string }) {
    for (const aid of Object.keys(subsByAssessment)) {
      const idx = subsByAssessment[aid].findIndex(x => x.id === submissionId);
      if (idx >= 0) {
        subsByAssessment[aid][idx] = { ...subsByAssessment[aid][idx], grade: input.grade, status: 'graded' };
        return;
      }
    }
  },
  async submit(assessmentId: string, input: { content?: string; attachments?: Array<{ uri: string; name?: string }> }) {
    const id = `s-${Date.now()}`;
    const entry = { id, studentName: 'You', status: 'submitted' as const };
    subsByAssessment[assessmentId] = [ ...(subsByAssessment[assessmentId] || []), entry ];
    console.log('Mock submit', assessmentId, input);
    return { id };
  },
};
