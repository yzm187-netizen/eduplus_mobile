import type { AssignmentService } from '@/services/contracts';
import { assignments } from '@/data/sample';

export const mockAssignments: AssignmentService = {
  async listAll() {
    return assignments;
  },
  async listByCourse(courseId: string) {
    return assignments.filter((a) => a.courseId === courseId);
  },
  async getDetail(courseId: string, assignmentId: string) {
    return assignments.find((a) => a.courseId === courseId && a.id === assignmentId) ?? null;
  },
  async create(courseId: string, input: { title: string; type: string; dueAt?: string }) {
    const id = `a-${Date.now()}`;
    const ref = { id, courseId, title: input.title, dueAt: input.dueAt || new Date().toISOString(), createdAt: new Date().toISOString() } as any;
    (assignments as any).push?.(ref);
    return ref;
  },
};
