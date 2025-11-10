import type { ScheduleService } from '@/services/contracts';
import { assignments } from '@/data/sample';
import { exams, sessions } from '@/data/schedule';

export const mockSchedule: ScheduleService = {
  async listCalendarItems() {
    return [
      ...sessions.map((s) => ({ type: 'session' as const, ...s })),
      ...exams.map((e) => ({ type: 'exam' as const, ...e })),
      ...assignments.map((a) => ({ type: 'assignment' as const, ...a })),
    ];
  },
  async createLesson(courseId: string, input: { topic?: string; startsAt: string; endsAt: string }) {
    // naive mock append
    const id = `ls-${Date.now()}`;
    (sessions as any).push?.({ id, courseId, title: input.topic || 'Lesson', startsAt: input.startsAt, endsAt: input.endsAt });
    return { id };
  }
};
