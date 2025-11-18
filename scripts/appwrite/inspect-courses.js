// Lists courses with teacherIds and $permissions for debugging
// Usage: node -r dotenv/config scripts/appwrite/inspect-courses.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_COURSES = 'courses';
  const MAX = Number(process.env.LIMIT || 10);
  const HILITE = process.env.USER_ID; // optional, highlight a user id

  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[inspect-courses] Missing env. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
    process.exit(1);
  }

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  const res = await db.listDocuments(DB_ID, COL_COURSES, [sdk.Query.limit(MAX)]);
  for (const doc of res.documents) {
    const perms = Array.isArray(doc.$permissions) ? doc.$permissions : [];
    const teachers = Array.isArray(doc.teacherIds) ? doc.teacherIds : [];
    const line = {
      id: doc.$id,
      name: doc.name,
      code: doc.code,
      teacherIds: teachers,
      updatePerms: perms.filter(p => p.startsWith('update(')),
      deletePerms: perms.filter(p => p.startsWith('delete(')),
    };
    if (HILITE) {
      const match = perms.some(p => p.includes(`user:${HILITE}`));
      console.log(JSON.stringify({ ...line, hasUserId: match }, null, 2));
    } else {
      console.log(JSON.stringify(line, null, 2));
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
