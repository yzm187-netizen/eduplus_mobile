// Normalize lessons to keep title/topic in sync and grant teacher update/delete perms
// Env required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
// Run: npm run fix:lessons-title-perms
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const DB_ID = process.env.APPWRITE_DATABASE_ID || process.env.DB_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  const COL_LESSONS = 'lessons';
  const COL_COURSES = 'courses';

  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[backfill-lessons] Missing env. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
    console.error({ endpoint, project, keyLen: key ? key.length : 0, DB_ID });
    process.exit(1);
  }

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new sdk.Databases(client);

  let cursor; const batch = Number(process.env.BATCH || 50);
  let scanned = 0, updated = 0, permUpdated = 0;
  const courseTeachersCache = new Map();

  async function getCourseTeachers(courseId) {
    if (!courseId) return [];
    if (courseTeachersCache.has(courseId)) return courseTeachersCache.get(courseId);
    try {
      const c = await databases.getDocument(DB_ID, COL_COURSES, courseId);
      const teachers = Array.isArray(c.teacherIds) ? c.teacherIds.filter(Boolean).map(String) : [];
      courseTeachersCache.set(courseId, teachers);
      return teachers;
    } catch (e) { return []; }
  }

  while (true) {
    const res = await databases.listDocuments(DB_ID, COL_LESSONS, [sdk.Query.limit(batch), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    if (!res || !Array.isArray(res.documents) || res.documents.length === 0) break;
    for (const doc of res.documents) {
      scanned++; cursor = doc.$id;
      const targetTitle = String(doc.title || doc.topic || `Lesson`).trim();
      const needsTopic = (doc.topic !== targetTitle);
      const needsDesc = (doc.about && !doc.description);
      const data = {};
      // Only write 'topic' to avoid unknown attribute errors for 'title'
      if (needsTopic) { data.topic = targetTitle; }
      if (needsDesc) { data.description = doc.about; }

      // Build next permissions by union-ing teacher update/delete
      const havePerms = Array.isArray(doc.$permissions) ? doc.$permissions.slice() : [];
      const teachers = await getCourseTeachers(doc.courseId);
      const wantPerms = [
        ...teachers.map(id => `update("user:${id}")`),
        ...teachers.map(id => `delete("user:${id}")`),
      ];
      const nextPerms = Array.from(new Set([...havePerms, ...wantPerms]));
      const permsChanged = nextPerms.length !== havePerms.length;

      if (Object.keys(data).length === 0 && !permsChanged) {
        continue;
      }
      try {
        await databases.updateDocument(DB_ID, COL_LESSONS, doc.$id, data, permsChanged ? nextPerms : undefined);
        if (Object.keys(data).length) updated++;
        if (permsChanged) permUpdated++;
        console.log(`[ok] ${doc.$id} data:${Object.keys(data).length ? 'yes' : 'no'} perms:${permsChanged ? 'yes' : 'no'}`);
      } catch (e) {
        console.warn(`[warn] update failed for ${doc.$id}:`, (e && e.message) || e);
      }
    }
    if (res.documents.length < batch) break;
  }

  console.log(`[done] scanned=${scanned} normalized=${updated} permsUpdated=${permUpdated}`);
}

main().catch(err => { console.error(err); process.exit(1); });
