// Adds read(users) + update/delete(user:TEACHER_ID) perms to all lessons & notes missing them
// Usage: TEACHER_ID=<id> node -r dotenv/config scripts/appwrite/fix-lesson-perms.js
const sdk = require('node-appwrite');

async function applyForCollection(db, DB_ID, collection, TEACHER_ID) {
  let cursor; let processed=0; let updated=0; const batch=100;
  while (true) {
    const docs = await db.listDocuments(DB_ID, collection, [sdk.Query.limit(batch), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of docs.documents) {
      processed++; cursor = doc.$id;
      const perms = Array.isArray(doc.$permissions) ? doc.$permissions.slice() : [];
      const needRead = !perms.some(p => p.startsWith('read("users")'));
      const needUpdate = !perms.some(p => p.startsWith(`update("user:${TEACHER_ID}`));
      const needDelete = !perms.some(p => p.startsWith(`delete("user:${TEACHER_ID}`));
      if (!needRead && !needUpdate && !needDelete) continue;
      const next = perms.slice();
      if (needRead) next.push(`read("users")`);
      if (needUpdate) next.push(`update("user:${TEACHER_ID}")`);
      if (needDelete) next.push(`delete("user:${TEACHER_ID}")`);
      await db.updateDocument(DB_ID, collection, doc.$id, {}, next);
      updated++;
      console.log(`[fix] ${collection}:${doc.$id} added=${[needRead&&'read(users)',needUpdate&&'update',needDelete&&'delete'].filter(Boolean).join(',')}`);
    }
    if (docs.documents.length < batch) break;
  }
  console.log(`[${collection}] processed=${processed} updated=${updated}`);
}

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const TEACHER_ID = process.env.TEACHER_ID;
  if (!endpoint || !project || !key || !DB_ID || !TEACHER_ID) {
    console.error('[fix-lesson-perms] Missing env vars (need TEACHER_ID + Appwrite basics)');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);
  await applyForCollection(db, DB_ID, 'lessons', TEACHER_ID);
  await applyForCollection(db, DB_ID, 'notes', TEACHER_ID);
  console.log('[fix-lesson-perms] done');
}

main().catch(e => { console.error(e); process.exit(1); });
