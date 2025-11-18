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
import { databases, storage, account } from '@/lib/appwrite';
import { Query, ID, Permission, Role } from 'react-native-appwrite';
import { CONFIG } from '@/utils/config';
import { mockContent } from '@/services/mock/content';
import { mockSchedule } from './mock/schedule';
import { mockGroups } from './mock/groups';
import { mockSubmissions } from './mock/submissions';
import { mockAttendance } from './mock/attendance';
// Optional: InputFile is not exported in some versions of react-native-appwrite; guard via undefined
const InputFile: any = undefined;

// Live implementations

// replaced with imported liveCourses implementation

const liveAssignments: AssignmentService = {
  async listAll() {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    try {
      const res = await databases.listDocuments(DB_ID, 'assessments', [Query.equal('type', ['assignment'])]);
      return res.documents.map((d: any) => ({
        id: d.$id,
        courseId: d.courseId,
        title: d.title,
        dueAt: d.dueAt,
        description: d.description || null,
        groupType: d.groupType || undefined,
      }));
    } catch (e) {
      if (__DEV__) console.warn('[liveAssignments] listAll failed, falling back to unfiltered list', e);
      try {
        const res = await databases.listDocuments(DB_ID, 'assessments', [Query.limit(200)]);
        return res.documents
          .filter((d: any) => d.type === 'assignment')
          .map((d: any) => ({
            id: d.$id,
            courseId: d.courseId,
            title: d.title,
            dueAt: d.dueAt,
            description: d.description || null,
            groupType: d.groupType || undefined,
          }));
      } catch (e2) {
        if (__DEV__) console.warn('[liveAssignments] fallback listAll failed', e2);
        return [];
      }
    }
  },
  async listByCourse(courseId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    if (!courseId) return [];
    try {
      const res = await databases.listDocuments(DB_ID, 'assessments', [
        Query.equal('courseId', [courseId]),
        Query.equal('type', ['assignment']),
      ]);
      return res.documents.map((d: any) => ({
        id: d.$id,
        courseId: d.courseId,
        title: d.title,
        dueAt: d.dueAt,
        description: d.description || null,
        groupType: d.groupType || undefined,
      }));
    } catch (e) {
      if (__DEV__) console.warn('[liveAssignments] listByCourse failed, falling back to unfiltered list', e);
      try {
        const res = await databases.listDocuments(DB_ID, 'assessments', [Query.limit(200)]);
        return res.documents
          .filter((d: any) => d.type === 'assignment' && d.courseId === courseId)
          .map((d: any) => ({
            id: d.$id,
            courseId: d.courseId,
            title: d.title,
            dueAt: d.dueAt,
            description: d.description || null,
            groupType: d.groupType || undefined,
          }));
      } catch (e2) {
        if (__DEV__) console.warn('[liveAssignments] fallback listByCourse failed', e2);
        return [];
      }
    }
  },
  async getDetail(courseId: string, assignmentId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    try {
      const doc = await databases.getDocument(DB_ID, 'assessments', assignmentId);
      if (doc.courseId !== courseId) return null;
      return {
        id: doc.$id,
        courseId: doc.courseId,
        title: doc.title,
        dueAt: doc.dueAt,
        createdAt: (doc as any).createdAt || (doc as any).$createdAt || null,
        createdBy: (doc as any).createdBy || null,
        description: (doc as any).description || null,
        groupType: (doc as any).groupType || undefined,
        bannerUrl: (doc as any).bannerUrl || null,
        sectionsJson: (doc as any).sectionsJson || null,
        tasksJson: (doc as any).tasksJson || null,
      };
    } catch {
      return null;
    }
  },
  async create(courseId: string, input: { title: string; type: string; dueAt?: string; description?: string; groupType?: 'individual' | 'group' }) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const userStore = require('@/store/useAuthStore');
    const user = userStore.useAuthStore?.getState?.().user || (global as any).authUser || null;
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teacher role can create assignments');
    }
    const dueAt = input.dueAt || new Date(Date.now() + 7*24*60*60*1000).toISOString();
    try {
      const doc = await databases.createDocument(DB_ID, 'assessments', ID.unique(), {
        courseId,
        title: input.title,
        type: 'assignment',
        dueAt,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        description: input.description || '',
        groupType: input.groupType,
      }, [
        Permission.read(Role.users()),
        Permission.update(Role.user(user.id)),
        Permission.delete(Role.user(user.id)),
      ]);
      return {
        id: doc.$id,
        courseId: doc.courseId,
        title: doc.title,
        dueAt: doc.dueAt,
        createdBy: (doc as any).createdBy || user.id,
        groupType: doc.groupType || input.groupType || undefined,
        description: doc.description || input.description || '',
        bannerUrl: (doc as any).bannerUrl || null,
        sectionsJson: (doc as any).sectionsJson || null,
        tasksJson: (doc as any).tasksJson || null,
      } as any;
    } catch (e) {
      throw new Error('Failed to create assignment: ' + (e as any)?.message);
    }
  },
  async update(assignmentId: string, patch: { title?: string; description?: string; bannerUrl?: string; sectionsJson?: string; tasksJson?: string; dueAt?: string }) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const data: any = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.bannerUrl !== undefined) data.bannerUrl = patch.bannerUrl;
    if (patch.sectionsJson !== undefined) data.sectionsJson = patch.sectionsJson;
    if (patch.tasksJson !== undefined) data.tasksJson = patch.tasksJson;
    if (patch.dueAt !== undefined) data.dueAt = patch.dueAt;
    try {
      await databases.updateDocument(DB_ID, 'assessments', assignmentId, data);
    } catch (e: any) {
      const msg = String(e?.message || e).toLowerCase();
      // Fallback: attempt field-by-field in case some attributes not provisioned yet
      if (msg.includes('unknown') || msg.includes('attribute')) {
        for (const [k,v] of Object.entries(data)) {
          try { await databases.updateDocument(DB_ID, 'assessments', assignmentId, { [k]: v }); } catch {}
        }
      } else {
        throw e;
      }
    }
  },
  async listGroups(assignmentId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    try {
      const res = await databases.listDocuments(DB_ID, 'assignment_groups', [Query.equal('assignmentId', [assignmentId]), Query.limit(200)]);
      return res.documents.map((d: any) => ({ id: d.$id, name: d.name, memberIds: Array.isArray(d.memberIds) ? d.memberIds : [] }));
    } catch (e) {
      if (__DEV__) console.warn('[assignments.listGroups] failed', e);
      return [];
    }
  },
  async createGroup(assignmentId: string, input: { name: string; memberIds: string[] }) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const payload: any = { assignmentId, name: input.name, memberIds: input.memberIds || [] };
    const doc = await databases.createDocument(DB_ID, 'assignment_groups', ID.unique(), payload, [Permission.read(Role.users())]);
    return { id: doc.$id, name: doc.name, memberIds: Array.isArray(doc.memberIds) ? doc.memberIds : [] } as any;
  },
  async deleteGroup(assignmentId: string, groupId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    if (!groupId) return;
    try { await databases.deleteDocument(DB_ID, 'assignment_groups', groupId); } catch (e) { if (__DEV__) console.warn('[assignments.deleteGroup] delete group failed', e); }
    // Cleanup progress docs for this group
    try {
      const res = await databases.listDocuments(DB_ID, 'assignment_progress', [Query.equal('assignmentId', [assignmentId]), Query.equal('groupId', [groupId]), Query.limit(100)]);
      for (const d of (res.documents as any[])) {
        try { await databases.deleteDocument(DB_ID, 'assignment_progress', d.$id); } catch {}
      }
    } catch {}
  },
  async getOrCreateProgress(assignmentId: string, groupId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    try {
      const res = await databases.listDocuments(DB_ID, 'assignment_progress', [
        Query.equal('assignmentId', [assignmentId]),
        Query.equal('groupId', [groupId]),
        Query.limit(1),
      ]);
      if (res.total > 0) {
        const d: any = res.documents[0];
        return {
          id: d.$id,
          assignmentId: d.assignmentId,
          groupId: d.groupId,
          progress: d.progressJson ? JSON.parse(d.progressJson) : {},
          sectionsAttachments: d.sectionsAttachmentsJson ? JSON.parse(d.sectionsAttachmentsJson) : undefined,
          tasksOverlay: d.tasksOverlayJson ? JSON.parse(d.tasksOverlayJson) : undefined,
        } as any;
      }
    } catch {}
    // Create new empty progress
    const created = await databases.createDocument(DB_ID, 'assignment_progress', ID.unique(), {
      assignmentId, groupId, progressJson: '{}', sectionsAttachmentsJson: '{}', tasksOverlayJson: '{}',
    }, [Permission.read(Role.users())]);
    return { id: created.$id, assignmentId, groupId, progress: {}, sectionsAttachments: {}, tasksOverlay: {} } as any;
  },
  async updateProgress(progressId: string, patch: { progress?: Record<string, boolean>; sectionsAttachments?: Record<string, any[]>; tasksOverlay?: Record<string, any[]> }) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const data: any = {};
    if (patch.progress !== undefined) data.progressJson = JSON.stringify(patch.progress);
    if (patch.sectionsAttachments !== undefined) data.sectionsAttachmentsJson = JSON.stringify(patch.sectionsAttachments);
    if (patch.tasksOverlay !== undefined) data.tasksOverlayJson = JSON.stringify(patch.tasksOverlay);
    await databases.updateDocument(DB_ID, 'assignment_progress', progressId, data);
  },
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
  async listCoursePeople(courseId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    try {
      const enr = await databases.listDocuments(DB_ID, 'enrollments', [Query.equal('courseId', [courseId])]);
      const userIds: string[] = Array.from(new Set(enr.documents.map((d: any) => d.userId)));
      let profiles: Record<string, any> = {};
      try {
        if (userIds.length) {
          // Prefer querying by document id; some datasets may not have a separate userId field
          const profRes = await databases.listDocuments(DB_ID, 'profiles', [Query.equal('$id', userIds)]);
          for (const p of profRes.documents as any[]) profiles[p.$id] = p;
        }
      } catch {}
      const AVATAR_BUCKET = (process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID || (CONFIG as any).APPWRITE_AVATAR_BUCKET_ID || 'profile_avatars');
      const base = (CONFIG.APPWRITE_ENDPOINT || '').replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
      const project = CONFIG.APPWRITE_PROJECT_ID;
      function buildAvatarUrl(fileId?: string) {
        if (!fileId) return undefined;
        try {
          const direct = (storage as any).getFileView?.(AVATAR_BUCKET, fileId) as any;
          if (typeof direct === 'string' && direct.length > 0) return direct;
        } catch {}
        if (project) return `${base}/storage/buckets/${AVATAR_BUCKET}/files/${fileId}/view?project=${project}`;
        return undefined;
      }
      let roster: Array<{ id: string; name: string; role: 'student' | 'teacher'; avatarUrl?: string }> = enr.documents.map((d: any) => ({
        id: d.userId,
        name: profiles[d.userId]?.name || String(d.userId),
        role: d.role === 'teacher' ? 'teacher' : 'student',
        avatarUrl: buildAvatarUrl((profiles[d.userId] as any)?.avatarFileId) || (profiles[d.userId] as any)?.avatarUrl || undefined,
      }));
      // Ensure teacher presence: if no teachers via enrollments, read course.teacherIds and append
      const hasTeacher = roster.some(r => r.role === 'teacher');
      if (!hasTeacher) {
        try {
          const c = await databases.getDocument(DB_ID, 'courses', courseId);
          const tids: string[] = Array.isArray((c as any).teacherIds) ? (c as any).teacherIds : [];
          if (tids.length) {
            let profById: Record<string, any> = {};
            try {
              const profRes = await databases.listDocuments(DB_ID, 'profiles', [Query.equal('$id', tids)]);
              for (const p of profRes.documents as any[]) profById[p.$id] = p;
            } catch {}
            for (const id of tids) {
              if (!roster.find(r => r.id === id)) {
                roster.push({ id: String(id), name: profById[id]?.name || String(id), role: 'teacher', avatarUrl: buildAvatarUrl(profById[id]?.avatarFileId) || profById[id]?.avatarUrl || undefined });
              }
            }
          }
        } catch {}
      }
      return roster;
    } catch (err) {
      if (__DEV__) console.warn('[livePeople] roster fetch failed', err);
      return [];
    }
  },
};

const liveContent: ContentService = {
  async listLessons(courseId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    if (!courseId) return [];
    try {
      if (__DEV__) console.info('[liveContent] listLessons primary', { DB_ID, courseId });
      // Allow both 'lessons' (sessions) naming; map topic/title -> title
      const res = await databases.listDocuments(DB_ID, 'lessons', [Query.equal('courseId', [courseId])]);
      // Sort by startsAt if present
      const docs = res.documents.slice().sort((a: any, b: any) => {
        // Prefer explicit position attribute if present
        const pa = typeof a.position === 'number' ? a.position : null;
        const pb = typeof b.position === 'number' ? b.position : null;
        if (pa != null && pb != null && pa !== pb) return pa - pb;
        return new Date(a.startsAt||0).getTime() - new Date(b.startsAt||0).getTime();
      });
      return docs.map((d: any, i: number) => ({
        id: d.$id,
        courseId: d.courseId,
        title: d.title || d.topic || `Lesson ${i+1}`,
        order: typeof d.position === 'number' ? d.position : (i+1),
        about: (d.about || undefined),
        coverUrl: (d.coverUrl || d.imageUrl || undefined),
        completed: Boolean((d as any).completed),
      }));
    } catch (e) {
      if (__DEV__) console.warn('[liveContent] listLessons failed, falling back to unfiltered list', e);
      try {
        if (__DEV__) console.info('[liveContent] listLessons fallback unfiltered', { DB_ID, courseId });
        const res = await databases.listDocuments(DB_ID, 'lessons', [Query.limit(200)]);
        const docs = res.documents.filter((d: any) => d.courseId === courseId).sort((a: any, b: any) => {
          const pa = typeof a.position === 'number' ? a.position : null;
          const pb = typeof b.position === 'number' ? b.position : null;
          if (pa != null && pb != null && pa !== pb) return pa - pb;
          return new Date(a.startsAt||0).getTime() - new Date(b.startsAt||0).getTime();
        });
        return docs.map((d: any, i: number) => ({
          id: d.$id,
          courseId: d.courseId,
          title: d.title || d.topic || `Lesson ${i+1}`,
          order: typeof d.position === 'number' ? d.position : (i+1),
          about: (d.about || undefined),
          coverUrl: (d.coverUrl || d.imageUrl || undefined),
          completed: Boolean((d as any).completed),
        }));
      } catch (e2) {
        if (__DEV__) console.warn('[liveContent] fallback listLessons failed', e2);
        return [];
      }
    }
  },
  async createLesson(courseId: string, input: { title: string; about?: string }) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    if (!courseId) throw new Error('courseId required');
    const title = input.title || 'New Lesson';
    const about = input.about || '';
    // Determine ordering reference time: use current timestamp; UI derives order index dynamically.
    const startsAt = new Date().toISOString();
    // Determine next position by counting existing lessons
    let existingCount = 0;
    try {
      const res = await databases.listDocuments(DB_ID, 'lessons', [Query.equal('courseId', [courseId]), Query.limit(200)]);
      existingCount = res.total || res.documents.length;
    } catch {}
    const position = existingCount + 1;
    // Resolve current user to set owner-level permissions (teacher-only edits)
    const userStore = require('@/store/useAuthStore');
    const currentUser = userStore.useAuthStore?.getState?.().user || (global as any).authUser || null;
    let doc: any;
    try {
      const data: any = {
        courseId,
        topic: title, // align with existing schema (title may not exist)
        startsAt,
        endsAt: new Date(Date.now() + 60*60*1000).toISOString(),
        position,
        // Do not include optional fields that may not exist in schema (about/description)
      };
      const perms: any[] = [
        Permission.read(Role.users()),
      ];
      if (currentUser?.id) {
        perms.push(Permission.update(Role.user(currentUser.id)));
        perms.push(Permission.delete(Role.user(currentUser.id)));
      }
      doc = await databases.createDocument(DB_ID, 'lessons', ID.unique(), data, perms);
    } catch (e: any) {
      throw new Error('Failed to create lesson: ' + (e?.message || e));
    }
    // Best-effort: set about after creation if supported by schema
    if (about) {
      try {
        await databases.updateDocument(DB_ID, 'lessons', doc.$id, { about });
      } catch {
        // no about attribute in schema; ignore
      }
    }
    return {
      id: doc.$id,
      courseId: doc.courseId,
      title: doc.topic || title,
      order: typeof doc.position === 'number' ? doc.position : position,
      about: about || undefined,
      coverUrl: doc.coverUrl || undefined,
    } as any;
  },
  async deleteLesson(lessonId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    if (!lessonId) return;
    try { await databases.deleteDocument(DB_ID, 'lessons', lessonId); } catch (e) {
      if (__DEV__) console.warn('[liveContent] deleteLesson failed', e);
    }
    // Reindex remaining lessons positions per course
    try {
      const all = await databases.listDocuments(DB_ID, 'lessons', [Query.limit(500)]);
      const byCourse: Record<string, any[]> = {};
      for (const d of all.documents as any[]) {
        if (d.$id === lessonId) continue;
        byCourse[d.courseId] = byCourse[d.courseId] || [];
        byCourse[d.courseId].push(d);
      }
      for (const courseId of Object.keys(byCourse)) {
        const sorted = byCourse[courseId].sort((a, b) => {
          const pa = typeof a.position === 'number' ? a.position : null;
          const pb = typeof b.position === 'number' ? b.position : null;
          if (pa != null && pb != null && pa !== pb) return pa - pb;
          return new Date(a.startsAt||0).getTime() - new Date(b.startsAt||0).getTime();
        });
        for (let i=0; i<sorted.length; i++) {
          const d = sorted[i];
            try { await databases.updateDocument(DB_ID, 'lessons', d.$id, { position: i+1 }); } catch {}
        }
      }
    } catch {}
  },
  async listNotes(courseId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const BUCKET = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
    if (!courseId) return [];
    try {
      if (__DEV__) console.info('[liveContent] listNotes primary', { DB_ID, courseId });
      const res = await databases.listDocuments(DB_ID, 'notes', [Query.equal('courseId', [courseId])]);
      return res.documents.map((n: any) => {
        const fileId = (n.fileId || n.attachmentId || null);
        let attachmentUrl: string | undefined = undefined;
        try {
          if (fileId) {
            const direct = (storage as any).getFileView?.(BUCKET, fileId) as any;
            if (typeof direct === 'string' && direct.length > 0) attachmentUrl = direct;
            if (!attachmentUrl) {
              const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
              const project = CONFIG.APPWRITE_PROJECT_ID;
              if (project) attachmentUrl = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${project}`;
            }
          }
        } catch {}
        return ({
          id: n.$id,
          courseId: n.courseId,
          lessonId: n.lessonId || '',
          authorId: n.authorId || 'unknown',
          visibility: (n.visibility === 'all' ? 'course' : n.visibility),
          title: n.title,
          content: n.body || '',
          createdAt: n.createdAt || new Date().toISOString(),
          fileId: fileId || undefined,
          attachmentName: (n.attachmentName || n.fileName || undefined),
          attachmentUrl: (n.attachmentUrl || n.fileUrl || attachmentUrl || undefined),
          mimeType: (n.mimeType || n.fileType || undefined),
        });
      });
    } catch (e) {
      if (__DEV__) console.warn('[liveContent] listNotes failed, falling back to unfiltered list', e);
      try {
        if (__DEV__) console.info('[liveContent] listNotes fallback unfiltered', { DB_ID, courseId });
        const res = await databases.listDocuments(DB_ID, 'notes', [Query.limit(200)]);
        return res.documents
          .filter((n: any) => n.courseId === courseId)
          .map((n: any) => {
            const fileId = (n.fileId || n.attachmentId || null);
            let attachmentUrl: string | undefined = undefined;
            try {
              if (fileId) {
                const direct = (storage as any).getFileView?.(BUCKET, fileId) as any;
                if (typeof direct === 'string' && direct.length > 0) attachmentUrl = direct;
                if (!attachmentUrl) {
                  const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
                  const project = CONFIG.APPWRITE_PROJECT_ID;
                  if (project) attachmentUrl = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${project}`;
                }
              }
            } catch {}
            return ({
              id: n.$id,
              courseId: n.courseId,
              lessonId: n.lessonId || '',
              authorId: n.authorId || 'unknown',
              visibility: (n.visibility === 'all' ? 'course' : n.visibility),
              title: n.title,
              content: n.body || '',
              createdAt: n.createdAt || new Date().toISOString(),
              fileId: fileId || undefined,
              attachmentName: (n.attachmentName || n.fileName || undefined),
              attachmentUrl: (n.attachmentUrl || n.fileUrl || attachmentUrl || undefined),
              mimeType: (n.mimeType || n.fileType || undefined),
            });
          });
      } catch (e2) {
        if (__DEV__) console.warn('[liveContent] fallback listNotes failed', e2);
        return [];
      }
    }
  },
  async getNote(noteId: string) { return null; },
  async createNoteWithAttachment(courseId, lessonId, file) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const BUCKET = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
    const TEACHER_TEAM = (process.env.APPWRITE_TEAM_TEACHERS_ID || process.env.EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID || '').trim();
    const STUDENT_TEAM = (process.env.APPWRITE_TEAM_STUDENTS_ID || process.env.EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID || '').trim();
    if (__DEV__) console.info('[upload-note] start', { courseId, lessonId, uri: file?.uri, name: file?.name, type: file?.type });
    let upload: any | undefined;
    try {
      if (__DEV__) console.info('[upload-note] raw file input', file);
      // Prefer direct REST path first to avoid SDK silent failures
      const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
      const project = CONFIG.APPWRITE_PROJECT_ID;
      const url = `${base}/storage/buckets/${BUCKET}/files`;
      const form = new FormData();
      form.append('fileId', 'unique()');
      form.append('file', { uri: file.uri, name: file.name || 'attachment', type: file.type || 'application/pdf' } as any);
      // Ensure uploaded file is viewable: add read("any") permission correctly (avoid escaped quotes)
      try { (form as any).append('permissions[]', 'read("any")'); } catch {}
      // Do NOT send team permissions while bucket fileSecurity might be false; rely on bucket level create(users)
      let jwt: string | undefined;
      try { const j = await (account as any).createJWT?.(); jwt = j?.jwt; } catch {}
      const headers: Record<string, string> = { 'X-Appwrite-Project': project || '' };
      if (jwt) headers['X-Appwrite-JWT'] = jwt;
      if (__DEV__) console.info('[upload-note] REST primary attempt', { hasJWT: !!jwt });
      const res = await fetch(url, { method: 'POST', headers, body: form as any });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        if (__DEV__) console.warn('[upload-note] REST primary failed', { status: res.status, body: txt });
        // Fallback to SDK with public read
        try {
          if (__DEV__) console.info('[upload-note] sdk fallback attempt');
          const input = (InputFile?.fromUri)
            ? InputFile.fromUri(file.uri, file.name || 'attachment')
            : ({ uri: file.uri, name: file.name || 'attachment', type: file.type || 'application/pdf' } as any);
          upload = await (storage as any).createFile(BUCKET, ID.unique(), input, ['read("any")']);
        } catch (e2) {
          if (__DEV__) console.warn('[upload-note] sdk fallback failed', e2);
          throw new Error(`Upload failed both REST and SDK: ${txt}`);
        }
      } else {
        upload = await res.json();
        if (__DEV__) console.info('[upload-note] REST primary success', { fileId: upload?.$id });
      }
    } catch (e) {
      if (__DEV__) console.warn('[upload-note] total failure', e);
      throw e;
    }
    const fileId = upload?.$id;
    if (!fileId) {
      if (__DEV__) console.warn('[upload-note] missing fileId', { upload });
      throw new Error('Upload did not return file id');
    }
    const title = file.name || 'Attachment';
    // Build simplified permissions: team-level perms rejected by current backend (error lists only any/users/user:...)
    // We therefore grant broad read(any) so teacher can immediately view; restrict mutate to owner user if available.
    let currentUser: any = undefined;
    try { currentUser = await (account as any).get?.(); } catch {}
    const userId = currentUser?.$id || currentUser?.id;
    const perms: any[] = [];
    try {
      perms.push(Permission.read(Role.any()));
    } catch {
      // Fallback string if helper not available
      perms.push('read("any")');
    }
    if (userId) {
      perms.push(Permission.update(Role.user(userId)) as any);
      perms.push(Permission.delete(Role.user(userId)) as any);
    }
    if (__DEV__) console.info('[upload-note] perms', perms);
    // Build attachmentUrl BEFORE document creation so we can include it in the doc
    let attachmentUrl: string | undefined = undefined;
    try {
      const direct = (storage as any).getFileView?.(BUCKET, fileId) as any;
      if (typeof direct === 'string' && direct.length > 0) attachmentUrl = direct;
      if (!attachmentUrl) {
        const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
        const project = CONFIG.APPWRITE_PROJECT_ID;
        if (project) attachmentUrl = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${project}`;
      }
    } catch {}
    let createdDoc: any | null = null;
    try {
      createdDoc = await databases.createDocument(DB_ID, 'notes', ID.unique(), {
        courseId,
        lessonId,
        title,
        body: '',
        createdAt: new Date().toISOString(),
        // Backend enum expects one of: all, students, teachers. Use 'all' for broad course visibility.
        visibility: 'all',
        attachmentId: fileId,
        attachmentName: file.name,
        mimeType: file.type,
        attachmentUrl,
      }, perms);
    } catch (err: any) {
      if (__DEV__) console.warn('[upload-note] createDocument unauthorized or failed; returning unsaved note', err?.message || err);
      createdDoc = null;
    }
    return {
      id: createdDoc?.$id || ID.unique(),
      courseId,
      lessonId,
      authorId: 'unknown',
      visibility: 'course',
      title,
      content: '',
      createdAt: (createdDoc?.createdAt) || new Date().toISOString(),
      fileId,
      attachmentName: file.name,
      attachmentUrl,
      mimeType: file.type,
      unsaved: !createdDoc,
    } as any;
  },
  async deleteNote(noteId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    // Attempt to fetch note to discover associated fileId for cleanup
    let fileId: string | undefined;
    try {
      const note: any = await databases.getDocument(DB_ID, 'notes', noteId);
      fileId = note?.fileId;
    } catch {}
    try { await databases.deleteDocument(DB_ID, 'notes', noteId); } catch {}
    // Delete storage file if orphaned
    if (fileId) {
      try { await (storage as any).deleteFile?.(CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c', fileId); } catch {}
    }
  },
  async updateLesson(lessonId: string, patch: { title?: string; about?: string; coverUrl?: string; completed?: boolean }) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const payload: any = {};
    // Write schema-safe fields only: use 'topic' for title
    if (patch.title !== undefined) { payload.topic = patch.title; }
    if (patch.about !== undefined) { payload.about = patch.about; }
    if (patch.coverUrl !== undefined) payload.coverUrl = patch.coverUrl;
    if (patch.completed !== undefined) payload.completed = patch.completed;
    try { await databases.updateDocument(DB_ID, 'lessons', lessonId, payload); } catch (e) {
      const fallbackA: any = {};
      // Fallback: topic only (and other known fields)
      if (payload.topic !== undefined) fallbackA.topic = payload.topic;
      if (payload.coverUrl !== undefined) fallbackA.coverUrl = payload.coverUrl;
      if (payload.completed !== undefined) fallbackA.completed = payload.completed;
      try { await databases.updateDocument(DB_ID, 'lessons', lessonId, fallbackA); } catch {}
    }
  },
  async uploadLessonImage(lessonId: string, file: { uri: string; name?: string; type?: string }) {
    const BUCKET = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c';
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    const TEACHER_TEAM = (process.env.APPWRITE_TEAM_TEACHERS_ID || process.env.EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID || '').trim();
    const STUDENT_TEAM = (process.env.APPWRITE_TEAM_STUDENTS_ID || process.env.EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID || '').trim();
    if (__DEV__) console.info('[upload-cover] start', { lessonId, uri: file?.uri, name: file?.name, type: file?.type });
    let upload: any | undefined;
    try {
      const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
      const project = CONFIG.APPWRITE_PROJECT_ID;
      const url = `${base}/storage/buckets/${BUCKET}/files`;
      const form = new FormData();
      form.append('fileId', 'unique()');
      form.append('file', { uri: file.uri, name: file.name || 'cover.jpg', type: file.type || 'image/jpeg' } as any);
      let jwt: string | undefined;
      try { const j = await (account as any).createJWT?.(); jwt = j?.jwt; } catch {}
      const headers: Record<string, string> = { 'X-Appwrite-Project': project || '' };
      if (jwt) headers['X-Appwrite-JWT'] = jwt;
      if (__DEV__) console.info('[upload-cover] REST primary attempt', { hasJWT: !!jwt });
      const res = await fetch(url, { method: 'POST', headers, body: form as any });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        if (__DEV__) console.warn('[upload-cover] REST primary failed', { status: res.status, body: txt });
        // Fallback to SDK
        try {
          const input = (InputFile?.fromUri)
            ? InputFile.fromUri(file.uri, file.name || 'cover.jpg')
            : ({ uri: file.uri, name: file.name || 'cover.jpg', type: file.type || 'image/jpeg' } as any);
          upload = await (storage as any).createFile(BUCKET, ID.unique(), input, ['read("any")']);
        } catch (e2) {
          if (__DEV__) console.warn('[upload-cover] sdk fallback failed', e2);
          throw new Error(`Upload cover failed both REST and SDK: ${txt}`);
        }
      } else {
        upload = await res.json();
        if (__DEV__) console.info('[upload-cover] REST primary success', { fileId: upload?.$id });
      }
    } catch (e) {
      if (__DEV__) console.warn('[upload-cover] total failure', e);
      throw e;
    }
    const fileId = upload?.$id;
    if (!fileId) {
      if (__DEV__) console.warn('[upload-cover] missing fileId', { upload });
      throw new Error('Upload did not return file id');
    }
    let coverUrl: string | undefined = undefined;
    try {
      const direct = (storage as any).getFileView?.(BUCKET, fileId) as any;
      if (typeof direct === 'string' && direct.length > 0) coverUrl = direct;
      if (!coverUrl) {
        const base = CONFIG.APPWRITE_ENDPOINT?.replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
        const project = CONFIG.APPWRITE_PROJECT_ID;
        if (project) coverUrl = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${project}`;
      }
    } catch {}
    await databases.updateDocument(DB_ID, 'lessons', lessonId, { coverUrl, coverFileId: fileId });
    return coverUrl || '';
  },
  async deleteLessonImage(lessonId: string) {
    const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
    try { await databases.updateDocument(DB_ID, 'lessons', lessonId, { coverUrl: null, coverFileId: null }); } catch {}
  },
  async getRubric(assignmentId: string) { return null; },
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

// Helpful startup log to clarify which adapters are active at runtime
try {
  // Avoid noisy logs in tests by guarding with a simple check
  if (typeof console !== 'undefined') {
    console.info(
      `[Services] API mode: ${mode} (${isMock ? 'mock' : 'live'}), chat: ${chatMode}`
    );
    if (!isMock) {
      const partialMocks = ['groups', 'submissions', 'attendance'];
      console.warn(
        `[Services] Live mode note: using mock adapters for: ${partialMocks.join(', ')} (pending live adapters)`
      );
      const endpoint = CONFIG.APPWRITE_ENDPOINT || 'unset';
      const project = CONFIG.APPWRITE_PROJECT_ID || 'unset';
      const database = CONFIG.APPWRITE_DATABASE_ID || 'unset';
      const bucket = CONFIG.APPWRITE_BUCKET_ID || '691032bc00073d40014c (fallback)';
      console.info('[Services] Appwrite config', { endpoint, project, database, bucket });
    }
  }
} catch {}

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
