import type { AssignmentService } from '@/services/contracts';

export const liveAssignments: AssignmentService = {
  async listAll() {
    throw new Error('liveAssignments.listAll not implemented');
  },
  async listByCourse(courseId: string) {
    throw new Error('liveAssignments.listByCourse not implemented');
  },
  async getDetail(courseId: string, assignmentId: string) {
    throw new Error('liveAssignments.getDetail not implemented');
  },
  async create(courseId: string, input: { title: string; type: string; dueAt?: string }) {
    throw new Error('liveAssignments.create not implemented');
  },
};
