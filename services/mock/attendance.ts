import { AttendanceService } from '@/services/contracts';

const roster: Array<{ id: string; name: string }> = [
  { id: 'u-student-1', name: 'You' },
  { id: 'u-student-2', name: 'Ava' },
  { id: 'u-student-3', name: 'Noah' },
];

export const mockAttendance: AttendanceService = {
  async mark(sessionId: string, userId: string, status: 'present' | 'late' | 'absent' | 'excused') {
    // store ephemeral status (in real backend this persists)
    console.log('Marked', sessionId, userId, status);
  },
  async listSessionRoster(courseId: string, sessionId: string) {
    return roster.map(r => ({ ...r, status: undefined }));
  },
  async createToken(lessonId: string) {
    return { code: `QR-${lessonId}-${Date.now()}`, expiresAt: new Date(Date.now() + 5*60*1000).toISOString() };
  }
};
