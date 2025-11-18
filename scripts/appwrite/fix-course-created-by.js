// Backfills createdBy for existing courses using first teacherId or provided TEACHER_ID
// Usage: TEACHER_ID=69149a330014b7376893 node -r dotenv/config scripts/appwrite/fix-course-created-by.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_COURSES = 'courses';
  const TEACHER_ID = process.env.TEACHER_ID;
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[fix-course-created-by] Missing env vars');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);
  let cursor; let scanned=0, updated=0;
  const batch = 50;
  while (true) {
    const res = await db.listDocuments(DB_ID, COL_COURSES, [sdk.Query.limit(batch), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of res.documents) {
      scanned++; cursor = doc.$id;
      const createdBy = doc.createdBy || (TEACHER_ID || (Array.isArray(doc.teacherIds) ? doc.teacherIds[0] : null));
      if (!doc.createdBy && createdBy) {
        await db.updateDocument(DB_ID, COL_COURSES, doc.$id, { createdBy });
        updated++; console.log('[fix] set createdBy', doc.$id, '->', createdBy);
      }
    }
    if (res.documents.length < batch) break;
  }
  console.log(`[done] scanned=${scanned} updated=${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); });
