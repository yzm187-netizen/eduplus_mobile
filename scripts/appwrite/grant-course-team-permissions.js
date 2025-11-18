// Grants update/delete permissions on all courses to a single Appwrite Team
// Usage: set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID (or DB_ID), TEAM_ID
// Run via: node -r dotenv/config scripts/appwrite/grant-course-team-permissions.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY; // Server API key
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_COURSES = 'courses';
  const TEAM_ID = process.env.TEAM_ID || process.env.APPWRITE_TEAM_TEACHERS_ID || process.env.TEAM_TEACHERS_ID;

  if (!endpoint || !project || !key || !DB_ID || !TEAM_ID) {
    console.error('[grant-course-team-perms] Missing required env. Received values:');
    console.error('  APPWRITE_ENDPOINT:', endpoint || '<undefined>');
    console.error('  APPWRITE_PROJECT_ID:', project || '<undefined>');
    console.error('  APPWRITE_API_KEY (length):', key ? key.length : '<undefined>');
    console.error('  DB_ID | APPWRITE_DATABASE_ID:', DB_ID || '<undefined>');
    console.error('  TEAM_ID | APPWRITE_TEAM_TEACHERS_ID | TEAM_TEACHERS_ID:', TEAM_ID || '<undefined>');
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
      const have = Array.isArray(doc.$permissions) ? doc.$permissions : [];
      const want = [
        `update("team:${TEAM_ID}")`,
        `delete("team:${TEAM_ID}")`,
      ];
      const nextPerms = Array.from(new Set([...have, ...want]));
      if (nextPerms.length === have.length) continue; // nothing to change

      await databases.updateDocument(DB_ID, COL_COURSES, doc.$id, {}, nextPerms);
      updated++;
      console.log(`[grant-team] ${doc.$id} addPerms=${nextPerms.length - have.length}`);
    }
    if (res.documents.length < batch) break;
  }
  console.log(`[done] scanned=${scanned} updated=${updated}`);
  if (updated === 0) {
    console.log('[grant-course-team-perms] No documents updated. Likely team permissions already present.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
