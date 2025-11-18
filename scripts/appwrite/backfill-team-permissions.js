// Add team-based permissions to existing lessons and notes
// Usage:
//   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... APPWRITE_DATABASE_ID=...
//   STAFF_TEAM_ID=... MEMBERS_TEAM_ID=...
//   node scripts/appwrite/backfill-team-permissions.js

const sdk = require('node-appwrite');

function req(n, v) { if (!v) throw new Error(`Missing env ${n}`); return v; }

async function backfillCollection(db, DB_ID, collection, staffTeam, membersTeam) {
  let cursor; let processed=0; let updated=0; const batch=100;
  while (true) {
    const res = await db.listDocuments(DB_ID, collection, [sdk.Query.limit(batch), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of res.documents) {
      processed++; cursor = doc.$id;
      const have = Array.isArray(doc.$permissions) ? doc.$permissions : [];
      const want = [
        `read("team:${staffTeam}")`,
        ...(membersTeam ? [`read("team:${membersTeam}")`] : []),
        `update("team:${staffTeam}")`,
        `delete("team:${staffTeam}")`,
      ];
      const next = Array.from(new Set([...have, ...want]));
      if (next.length === have.length) continue;
      await db.updateDocument(DB_ID, collection, doc.$id, {}, next);
      updated++;
      console.log(`[backfill] ${collection}:${doc.$id} +${next.length - have.length}`);
    }
    if (res.documents.length < batch) break;
  }
  console.log(`[${collection}] processed=${processed} updated=${updated}`);
}

async function main() {
  const endpoint = req('APPWRITE_ENDPOINT', process.env.APPWRITE_ENDPOINT);
  const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
  const key = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
  const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
  const staffTeam = req('STAFF_TEAM_ID', process.env.STAFF_TEAM_ID || process.env.APPWRITE_TEAM_TEACHERS_ID || process.env.EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID);
  const membersTeam = (process.env.MEMBERS_TEAM_ID || process.env.APPWRITE_TEAM_STUDENTS_ID || process.env.EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID || '').trim();

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);
  await backfillCollection(db, DB_ID, 'lessons', staffTeam, membersTeam);
  await backfillCollection(db, DB_ID, 'notes', staffTeam, membersTeam);
  console.log('[backfill-team-permissions] done');
}

main().catch(e => { console.error(e); process.exit(1); });
