// Lists lesson counts per course
// Usage: node -r dotenv/config scripts/appwrite/list-lessons-by-course.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[list-lessons-by-course] Missing env vars');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  const courses = await db.listDocuments(DB_ID, 'courses', [sdk.Query.limit(200)]);
  for (const c of courses.documents) {
    let count = 0; let cursor; const batch=50;
    while (true) {
      const res = await db.listDocuments(DB_ID, 'lessons', [sdk.Query.equal('courseId',[c.$id]), sdk.Query.limit(batch), ...(cursor? [sdk.Query.cursorAfter(cursor)] : [])]);
      count += res.documents.length;
      if (res.documents.length < batch) break;
      cursor = res.documents[res.documents.length - 1].$id;
    }
    console.log(`[course] ${c.$id} '${c.name}' lessons=${count}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
