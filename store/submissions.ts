import { create } from 'zustand';

export type Attachment = { uri: string; name?: string; mimeType?: string; size?: number };
export type Submission = { id: string; taskId?: string; assignmentId?: string; content: string; attachments: Attachment[]; createdAt: number };

type SubmissionsState = {
  submissionsByTask: Record<string, Submission[]>;
  submissionsByAssignment: Record<string, Submission[]>;
  addTaskSubmission: (taskId: string, sub: Omit<Submission, 'id' | 'createdAt' | 'taskId' | 'assignmentId'>) => Submission;
  addFinalSubmission: (assignmentId: string, sub: Omit<Submission, 'id' | 'createdAt' | 'taskId' | 'assignmentId'>) => Submission;
  getTaskSubmissions: (taskId: string) => Submission[];
  getFinalSubmissions: (assignmentId: string) => Submission[];
};

export const useSubmissionsStore = create<SubmissionsState>((set, get) => ({
  submissionsByTask: {},
  submissionsByAssignment: {},
  addTaskSubmission: (taskId, sub) => {
    const s: Submission = { id: `sub-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, taskId, content: sub.content, attachments: sub.attachments || [], createdAt: Date.now() };
    set((state) => ({
      submissionsByTask: {
        ...state.submissionsByTask,
        [taskId]: [ ...(state.submissionsByTask[taskId] || []), s ],
      },
    }));
    return s;
  },
  addFinalSubmission: (assignmentId, sub) => {
    const s: Submission = { id: `sub-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, assignmentId, content: sub.content, attachments: sub.attachments || [], createdAt: Date.now() };
    set((state) => ({
      submissionsByAssignment: {
        ...state.submissionsByAssignment,
        [assignmentId]: [ ...(state.submissionsByAssignment[assignmentId] || []), s ],
      },
    }));
    return s;
  },
  getTaskSubmissions: (taskId) => get().submissionsByTask[taskId] || [],
  getFinalSubmissions: (assignmentId) => get().submissionsByAssignment[assignmentId] || [],
}));
