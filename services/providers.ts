import type { AssignmentService, AuthService, CourseService, NotificationService, StatsService, ChatService, PeopleService, ContentService, ScheduleService, GroupsService, SubmissionsService, AttendanceService } from '@/services/contracts';
import { mockAssignments } from '@/services/mock/assignments';
import { mockAuth } from '@/services/mock/auth';
import { mockCourses } from '@/services/mock/courses';
import { liveCourses } from '@/services/live/courses';
import { mockNotifications } from '@/services/mock/notifications';
import { mockStats } from '@/services/mock/stats';
import { mockChat } from '@/services/mock/chat';
import { liveChat as liveChatImpl } from '@/services/live/chat';
import { liveAuth as liveAuthImpl } from '@/services/live/auth';
import { mockPeople } from '@/services/mock/people';
import { mockContent } from '@/services/mock/content';
import { mockSchedule } from './mock/schedule';
import { mockGroups } from './mock/groups';
import { mockSubmissions } from './mock/submissions';
import { mockAttendance } from './mock/attendance';

// Live implementations

// replaced with imported liveCourses implementation

const liveAssignments: AssignmentService = {
  async listAll() {
    return [];
  },
  async listByCourse() {
    return [];
  },
  async getDetail() {
    return null;
  },
  async create() { throw new Error('live create assignment not implemented'); },
};

const liveNotifications: NotificationService = {
  async list() {
    return [];
  },
};

const liveStats: StatsService = {
  async getStudentOverview() {
    return { weeklyStudyHours: 0, assignmentsCompleted: 0, streakDays: 0 };
  },
};

const liveChat: ChatService = {
  async listThreads() { return []; },
  async getThread() { return null; },
  async listMessages() { return []; },
  async sendMessage() { throw new Error('Chat live adapter not configured'); },
};

const livePeople: PeopleService = {
  async listCoursePeople() { return []; },
};

const liveContent: ContentService = {
  async listLessons() { return []; },
  async listNotes() { return []; },
  async getNote() { return null; },
  async getRubric() { return null; },
  async listPeople() { return []; },
  async getDeck() { return null; },
};

const liveSchedule: ScheduleService = {
  async listCalendarItems() { return []; },
  async createLesson() { throw new Error('live createLesson not implemented'); },
};

import Constants from 'expo-constants';
const extra = (Constants.expoConfig?.extra || {}) as any;
const mode = ((process.env.EXPO_PUBLIC_API_MODE) || extra.EXPO_PUBLIC_API_MODE || 'mock').toLowerCase();
const chatMode = ((process.env.EXPO_PUBLIC_CHAT_MODE) || extra.EXPO_PUBLIC_CHAT_MODE || mode).toLowerCase();
const isMock = mode !== 'live';
const isChatLive = chatMode === 'live';

export const Services: {
  auth: AuthService;
  courses: CourseService;
  assignments: AssignmentService;
  notifications: NotificationService;
  stats: StatsService;
  chat: ChatService;
  people: PeopleService;
  content: ContentService;
  schedule: ScheduleService;
  groups: GroupsService;
  submissions: SubmissionsService;
  attendance: AttendanceService;
} = isMock
  ? { auth: mockAuth, courses: mockCourses, assignments: mockAssignments, notifications: mockNotifications, stats: mockStats, chat: isChatLive ? liveChatImpl : mockChat, people: mockPeople, content: mockContent, schedule: mockSchedule, groups: mockGroups, submissions: mockSubmissions, attendance: mockAttendance }
  : { auth: liveAuthImpl, courses: liveCourses, assignments: liveAssignments, notifications: liveNotifications, stats: liveStats, chat: liveChatImpl, people: livePeople, content: liveContent, schedule: liveSchedule, groups: mockGroups, submissions: mockSubmissions, attendance: mockAttendance }; // fallback mock for now
