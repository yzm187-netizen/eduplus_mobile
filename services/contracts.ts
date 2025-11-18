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
  createCourse(input: { name: string; code: string; description?: string | null; color?: string | null }): Promise<Course>;
  updateCourse(
    courseId: string,
    patch: Partial<Pick<Course, 'name' | 'code' | 'description' | 'color'>> & { gradingRule?: string }
  ): Promise<void>;
  deleteCourse?(courseId: string): Promise<void>;
}

export interface AssignmentService {
  listAll(): Promise<AssignmentRef[]>;
  listByCourse(courseId: string): Promise<AssignmentRef[]>;
  getDetail(courseId: string, assignmentId: string): Promise<AssignmentRef | null>;
  create(courseId: string, input: { title: string; type: string; dueAt?: string; description?: string; groupType?: 'individual' | 'group' }): Promise<AssignmentRef>;
  update?(assignmentId: string, patch: { title?: string; description?: string; bannerUrl?: string | null; sectionsJson?: string; tasksJson?: string; dueAt?: string }): Promise<void>;
  // Assignment groups and group progress (live only)
  listGroups?(assignmentId: string): Promise<Array<{ id: string; name: string; memberIds: string[] }>>;
  createGroup?(assignmentId: string, input: { name: string; memberIds: string[] }): Promise<{ id: string; name: string; memberIds: string[] }>;
  deleteGroup?(assignmentId: string, groupId: string): Promise<void>;
  getOrCreateProgress?(assignmentId: string, groupId: string): Promise<{ id: string; assignmentId: string; groupId: string; progress: Record<string, boolean>; sectionsAttachments?: Record<string, Array<{ uri: string; name?: string; mimeType?: string; size?: number; fileId?: string }>>; tasksOverlay?: Record<string, any[]> }>;
  updateProgress?(progressId: string, patch: { progress?: Record<string, boolean>; sectionsAttachments?: Record<string, Array<{ uri: string; name?: string; mimeType?: string; size?: number; fileId?: string }>>; tasksOverlay?: Record<string, any[]> }): Promise<void>;
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
  // Optional write capabilities for live mode
  createLesson?(courseId: string, input: { title: string; about?: string }): Promise<Lesson>; // new lesson basic creation
  deleteLesson?(lessonId: string): Promise<void>; // remove lesson
  createNoteWithAttachment?(
    courseId: string,
    lessonId: string,
    file: { uri: string; name?: string; type?: string }
  ): Promise<Note>;
  deleteNote?(noteId: string): Promise<void>;
  updateLesson?(lessonId: string, patch: { title?: string; about?: string; coverUrl?: string; completed?: boolean }): Promise<void>;
  // Allow position updates for ordering
  updateLessonPosition?(lessonId: string, position: number): Promise<void>;
  uploadLessonImage?(
    lessonId: string,
    file: { uri: string; name?: string; type?: string }
  ): Promise<string>; // returns coverUrl
  deleteLessonImage?(lessonId: string): Promise<void>;
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
