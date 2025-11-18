import type { AttendanceService } from '@/services/contracts';

export const liveAttendance: AttendanceService = {
  async mark(sessionId: string, userId: string, status: 'present' | 'late' | 'absent' | 'excused') {
    throw new Error('liveAttendance.mark not implemented');
  },
  async listSessionRoster(courseId: string, sessionId: string) {
    throw new Error('liveAttendance.listSessionRoster not implemented');
  },
  async createToken(lessonId: string) {
    throw new Error('liveAttendance.createToken not implemented');
  },
};
