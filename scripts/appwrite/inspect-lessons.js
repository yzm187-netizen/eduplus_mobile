// Lists lessons with their permissions for a given course (or all if COURSE_ID not set)
// Usage: TEACHER_ID=<id> COURSE_ID=<optional> node -r dotenv/config scripts/appwrite/inspect-lessons.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[inspect-lessons] Missing env basics');
    process.exit(1);
  }
  const COURSE_ID = process.env.COURSE_ID;
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  const lessons = await db.listDocuments(DB_ID, 'lessons', [sdk.Query.limit(500)]);
  for (const l of lessons.documents) {
    if (COURSE_ID && l.courseId !== COURSE_ID) continue;
    console.log(JSON.stringify({
      id: l.$id,
      courseId: l.courseId,
      topic: l.topic,
      perms: l.$permissions,
    }));
  }
  console.log('[inspect-lessons] total', lessons.total);
}

main().catch(e => { console.error(e); process.exit(1); });
