// Grants update/delete permissions on existing courses to their teacherIds
// Usage: set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, DB_ID (or APPWRITE_DATABASE_ID), optionally BATCH=50
// If running via npm script with: node -r dotenv/config scripts/appwrite/grant-course-permissions.js
// ensure .env contains: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY; // Server API key with Documents write permission
  // Accept either DB_ID or APPWRITE_DATABASE_ID for convenience
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_COURSES = 'courses';

  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[grant-course-perms] Missing required env. Received values:');
    console.error('  APPWRITE_ENDPOINT:', endpoint || '<undefined>');
    console.error('  APPWRITE_PROJECT_ID:', project || '<undefined>');
    console.error('  APPWRITE_API_KEY (length):', key ? key.length : '<undefined>');
    console.error('  DB_ID | APPWRITE_DATABASE_ID:', DB_ID || '<undefined>');
    console.error('Expected .env entries: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
    process.exit(1);
  }

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new sdk.Databases(client);

  let cursor = undefined;
  const batch = Number(process.env.BATCH || 50);
  let updated = 0, scanned = 0;

  while (true) {
    const res = await databases.listDocuments(DB_ID, COL_COURSES, [sdk.Query.limit(batch), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of res.documents) {
      scanned++;
      cursor = doc.$id;
      const teachers = Array.isArray(doc.teacherIds) ? doc.teacherIds : [];
      if (!teachers.length) continue;
        const want = [
          ...teachers.map(id => `update("user:${id}")`),
          ...teachers.map(id => `delete("user:${id}")`),
        ];
        const have = Array.isArray(doc.$permissions) ? doc.$permissions : [];
        const nextPerms = Array.from(new Set([...have, ...want]));
        if (nextPerms.length === have.length) continue; // nothing to change

        await databases.updateDocument(DB_ID, COL_COURSES, doc.$id, {}, nextPerms);
  updated++;
      console.log(`[grant] ${doc.$id} addPerms=${nextPerms.length - have.length}`);
    }
    if (res.documents.length < batch) break;
  }
  console.log(`[done] scanned=${scanned} updated=${updated}`);
  if (updated === 0) {
    console.log('[grant-course-perms] No documents updated. Likely all teacherIds already have update/delete permissions or teacherIds arrays are empty.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
