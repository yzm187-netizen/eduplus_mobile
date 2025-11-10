import type { User } from '@/store/useAuthStore';
import type { Course, AssignmentRef, Notification } from '@/data/sample';
import type { Lesson, Note, Rubric, Person } from '@/data/academics';
import type { CalendarItem } from '@/data/schedule';

export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getSession(): Promise<User | null>;
}

export interface CourseService {
  listMyCourses(): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  createCourse(input: { name: string; code: string }): Promise<Course>;
  updateCourse(courseId: string, patch: Partial<Pick<Course, 'name' | 'code'>> & { gradingRule?: string }): Promise<void>;
}

export interface AssignmentService {
  listAll(): Promise<AssignmentRef[]>;
  listByCourse(courseId: string): Promise<AssignmentRef[]>;
  getDetail(courseId: string, assignmentId: string): Promise<AssignmentRef | null>;
  create(courseId: string, input: { title: string; type: string; dueAt?: string }): Promise<AssignmentRef>;
}

export interface NotificationService {
  list(): Promise<Notification[]>;
}

export interface StatsService {
  getStudentOverview(): Promise<{
    weeklyStudyHours: number;
    assignmentsCompleted: number;
    streakDays: number;
  }>;
}

export interface ChatService {
  listThreads(): Promise<import('@/data/chat').Thread[]>;
  getThread(threadId: string): Promise<import('@/data/chat').Thread | null>;
  listMessages(threadId: string): Promise<import('@/data/chat').Message[]>;
  sendMessage(
    threadId: string,
    text: string,
    context?: { assignmentId?: string; sectionKey?: string; taskId?: string; sectionTitle?: string; taskTitle?: string },
    attachments?: import('@/data/chat').Attachment[]
  ): Promise<import('@/data/chat').Message>;
}

export interface PeopleService {
  listCoursePeople(courseId: string): Promise<Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }>>;
}

export interface ContentService {
  listLessons(courseId: string): Promise<Lesson[]>;
  listNotes(courseId: string): Promise<Note[]>; // already filtered by visibility in mock (assume student view)
  getNote(noteId: string): Promise<Note | null>;
  getRubric(assignmentId: string): Promise<Rubric | null>;
  listPeople(): Promise<Person[]>; // convenience for future use
  getDeck(lessonId: string): Promise<any | null>; // slide deck JSON
}

export interface ScheduleService {
  listCalendarItems(): Promise<CalendarItem[]>; // sessions, exams, assignments combined for convenience
  createLesson(courseId: string, input: { topic?: string; startsAt: string; endsAt: string }): Promise<{ id: string }>;
}

export interface GroupsService {
  list(courseId: string): Promise<Array<{ id: string; name: string; members: number }>>;
  get(groupId: string): Promise<{ id: string; name: string; members: Array<{ id: string; name: string }> } | null>;
}

export interface SubmissionsService {
  list(assessmentId: string): Promise<Array<{ id: string; studentName?: string; status: string; grade?: number }>>;
  get(submissionId: string): Promise<{ id: string; studentName?: string; groupName?: string; status: string; grade?: number } | null>;
  grade(submissionId: string, input: { grade: number; feedback?: string }): Promise<void>;
  submit?(assessmentId: string, input: { content?: string; attachments?: Array<{ uri: string; name?: string }> }): Promise<{ id: string }>;
}

export interface AttendanceService {
  mark(sessionId: string, userId: string, status: 'present' | 'late' | 'absent' | 'excused'): Promise<void>;
  listSessionRoster(courseId: string, sessionId: string): Promise<Array<{ id: string; name: string; status?: string }>>;
  createToken?(lessonId: string): Promise<{ code: string; expiresAt: string }>;
}
