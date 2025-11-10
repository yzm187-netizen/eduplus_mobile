import type { CourseService } from '@/services/contracts';
import { courses } from '@/data/sample';

export const mockCourses: CourseService = {
  async listMyCourses() {
    return courses;
  },
  async getCourse(courseId: string) {
    return courses.find((c) => c.id === courseId) ?? null;
  },
  async createCourse(input: { name: string; code: string }) {
    const id = `c-${Date.now()}`;
    const newCourse = { id, code: input.code, name: input.name };
    (courses as any).push?.(newCourse);
    return newCourse as any;
  },
  async updateCourse(courseId: string, patch) {
    const idx = (courses as any).findIndex?.((c: any) => c.id === courseId);
    if (idx >= 0) {
      (courses as any)[idx] = { ...(courses as any)[idx], ...patch };
    }
  },
};
