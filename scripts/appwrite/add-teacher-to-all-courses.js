// Adds a teacher account to teacherIds for all courses and grants update/delete perms
// Usage: TEACHER_ID=<userId> node -r dotenv/config scripts/appwrite/add-teacher-to-all-courses.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY; // server key
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_COURSES = 'courses';
  const TEACHER_ID = process.env.TEACHER_ID;
  const BATCH = Number(process.env.BATCH || 50);

  if (!endpoint || !project || !key || !DB_ID || !TEACHER_ID) {
    console.error('[add-teacher-to-all-courses] Missing env. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, TEACHER_ID');
    process.exit(1);
  }

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  let cursor = undefined; let scanned = 0; let updated = 0;
  while (true) {
    const res = await db.listDocuments(DB_ID, COL_COURSES, [sdk.Query.limit(BATCH), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of res.documents) {
      scanned++; cursor = doc.$id;
      const teachers = Array.isArray(doc.teacherIds) ? doc.teacherIds : [];
      const have = new Set(Array.isArray(doc.$permissions) ? doc.$permissions : []);
      const wantPerms = [
        `update("user:${TEACHER_ID}")`,
        `delete("user:${TEACHER_ID}")`,
      ];
      let changed = false;
      let nextTeachers = teachers;
      if (!teachers.includes(TEACHER_ID)) {
        nextTeachers = [...teachers, TEACHER_ID];
        changed = true;
      }
      for (const p of wantPerms) {
        if (!have.has(p)) { have.add(p); changed = true; }
      }
      if (!changed) continue;
      const nextPerms = Array.from(have);
      await db.updateDocument(DB_ID, COL_COURSES, doc.$id, { teacherIds: nextTeachers }, nextPerms);
      updated++;
      console.log(`[add-teacher] ${doc.$id} addedTeacher=${!teachers.includes(TEACHER_ID)} addedPerms=${wantPerms.filter(p=>!((doc.$permissions||[]).includes(p))).length}`);
    }
    if (res.documents.length < BATCH) break;
  }
  console.log(`[done] scanned=${scanned} updated=${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); });
