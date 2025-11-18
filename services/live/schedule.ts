import type { ScheduleService } from '@/services/contracts';

export const liveSchedule: ScheduleService = {
  async listCalendarItems() {
    throw new Error('liveSchedule.listCalendarItems not implemented');
  },
  async createLesson(courseId: string, input: { topic?: string; startsAt: string; endsAt: string }) {
    throw new Error('liveSchedule.createLesson not implemented');
  },
};
