import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TaskNode } from '@/types/tasks';

export type SectionState = {
  key: string;
  title: string;
  description?: string; // optional teacher-provided summary for the section
  tasks: TaskNode[];
  // Per-section submission area
  submissionText?: string;
  attachments?: Array<{ uri: string; name?: string; mimeType?: string; size?: number }>;
};

type AssignmentTasksState = {
  byAssignment: Record<string, SectionState[]>;
  getSections: (assignmentId: string) => SectionState[] | undefined;
  setSections: (assignmentId: string, sections: SectionState[]) => void;
  clear: (assignmentId?: string) => void;
};

export const useAssignmentTasksStore = create<AssignmentTasksState>()(
  persist(
    (set, get) => ({
      byAssignment: {},
      getSections: (assignmentId) => get().byAssignment[assignmentId],
      setSections: (assignmentId, sections) =>
        set((state) => ({ byAssignment: { ...state.byAssignment, [assignmentId]: sections } })),
      clear: (assignmentId) =>
        set((state) => {
          if (!assignmentId) return { byAssignment: {} };
          const next = { ...state.byAssignment };
          delete next[assignmentId];
          return { byAssignment: next };
        }),
    }),
    {
      name: 'assignmentTasks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
