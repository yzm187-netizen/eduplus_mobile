import type { CourseService } from '@/services/contracts';
import type { Course } from '@/data/sample';
import { databases, ID } from '@/lib/appwrite';
import { Permission, Role } from 'react-native-appwrite';
import { CONFIG } from '@/utils/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Query } from 'react-native-appwrite';

const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';
const COL_COURSES = 'courses';
const COL_ENROLLMENTS = 'enrollments';

function mapCourse(doc: any): Course {
  const user = useAuthStore.getState().user;
  const perms: string[] = Array.isArray(doc.$permissions) ? doc.$permissions : [];
  const teacherIds = Array.isArray(doc.teacherIds) ? doc.teacherIds : [];
  // Accept multiple string styles for permissions (single or double quotes)
  const updateUserA = !!user && perms.includes(`update("user:${user.id}")`);
  const updateUserB = !!user && perms.includes(`update('user:${user.id}')`);
  // Optional: team-based update permissions (can't verify membership client-side, but Appwrite will enforce on save)
  const updateAnyTeam = perms.some(p => p.startsWith('update("team:') || p.startsWith("update('team:"));
  const canEdit = !!user && (updateUserA || updateUserB || teacherIds.includes(user.id) || updateAnyTeam);
  return {
    id: doc.$id,
    code: doc.code,
    name: doc.name,
    color: doc.color,
    description: doc.description || null,
    teacherIds,
    canEdit,
    createdAt: doc.createdAt || doc.$createdAt || null,
    createdBy: doc.createdBy || (teacherIds.length ? teacherIds[0] : null),
  } as Course;
}

export const liveCourses: CourseService = {
  async listMyCourses() {
    const user = useAuthStore.getState().user;
    if (!user) return [];

    // Student enrollments
    // Appwrite Query.equal expects array values; previously passed raw string which can yield empty results.
    const enr = await databases.listDocuments(DB_ID, COL_ENROLLMENTS, [
      Query.equal('userId', [user.id]),
      Query.equal('status', ['active']),
    ]);
    if (__DEV__) {
      console.info('[liveCourses] enrollments total', enr.total, 'for user', user.id);
    }
    const courseIds: string[] = Array.from(new Set(enr.documents.map((d: any) => d.courseId)));

    // Fetch courses by id in chunks
    const chunkSize = 25;
    const results: any[] = [];
    for (let i = 0; i < courseIds.length; i += chunkSize) {
      const chunk = courseIds.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      const res = await databases.listDocuments(DB_ID, COL_COURSES, [Query.equal('$id', chunk)]);
      results.push(...res.documents);
    }

    // Teacher-owned courses (optional)
    try {
      const tRes = await databases.listDocuments(DB_ID, COL_COURSES, [Query.contains('teacherIds', [user.id])]);
      for (const d of tRes.documents as any[]) {
        if (!results.find((r) => r.$id === d.$id)) results.push(d);
      }
      if (__DEV__) console.info('[liveCourses] teacher-owned extra', tRes.total);
    } catch {
      // contains may not be available in older Appwrite; ignore for now
    }

    if (__DEV__) console.info('[liveCourses] resolved courseIds', courseIds.length, 'final results', results.length);
    return results.map(mapCourse);
  },

  async getCourse(courseId: string) {
    try {
      const doc = await databases.getDocument(DB_ID, COL_COURSES, courseId);
      return mapCourse(doc);
    } catch {
      return null;
    }
  },

  async createCourse(input: { name: string; code: string; description?: string | null; color?: string | null }) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not signed in');
    const doc = await databases.createDocument(
      DB_ID,
      COL_COURSES,
      ID.unique(),
      {
        name: input.name,
        code: input.code,
        color: input.color || null,
        description: input.description || null,
        teacherIds: [user.id],
        createdAt: new Date().toISOString(), // demo-level creation timestamp (editable)
      },
      [
        // Allow any authenticated user to read (needed for enrolled students listing courses)
        Permission.read(Role.users()),
        // Only creator (teacher) can update/delete
        Permission.update(Role.user(user.id)),
        Permission.delete(Role.user(user.id)),
      ]
    );
    return mapCourse(doc);
  },

  async updateCourse(courseId: string, patch: { name?: string; code?: string; description?: string | null; color?: string | null; gradingRule?: string }) {
    const payload: any = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.code !== undefined) payload.code = patch.code;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.color !== undefined) payload.color = patch.color;
    if (patch.gradingRule !== undefined) payload.gradingRule = patch.gradingRule;
    await databases.updateDocument(DB_ID, COL_COURSES, courseId, payload);
  },

  async deleteCourse(courseId: string) {
    await databases.deleteDocument(DB_ID, COL_COURSES, courseId);
  },
};
