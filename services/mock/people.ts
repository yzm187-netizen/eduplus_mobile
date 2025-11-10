import type { PeopleService } from '@/services/contracts';
import { avatarUrl } from '@/utils/imagePlaceholders';

const rosterByCourse: Record<string, Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }>> = {
  'c-eng201': [
    { id: 'u-teacher-1', name: 'Prof. Lee', role: 'teacher', avatarUrl: avatarUrl('u-teacher-1') },
    { id: 'u-student-1', name: 'You', role: 'student', avatarUrl: avatarUrl('u-student-1') },
    { id: 'u-student-2', name: 'Ava', role: 'student', avatarUrl: avatarUrl('u-student-2') },
  ],
  'c-cs305': [
    { id: 'u-teacher-2', name: 'Dr. Kim', role: 'teacher', avatarUrl: avatarUrl('u-teacher-2') },
    { id: 'u-student-1', name: 'You', role: 'student', avatarUrl: avatarUrl('u-student-1') },
    { id: 'u-student-3', name: 'Noah', role: 'student', avatarUrl: avatarUrl('u-student-3') },
  ],
};

export const mockPeople: PeopleService = {
  async listCoursePeople(courseId: string) {
    return rosterByCourse[courseId] ?? [];
  },
};
