// Time-shifts demo dates for courses (createdAt) and assignments (dueAt, createdAt) by DAYS offset.
// Usage: DAYS= -3 npm run shift:demo-dates  (negative shifts into past)
// Env required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const DAYS = Number(process.env.DAYS || 0);
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[time-shift-demo-dates] Missing env vars');
    process.exit(1);
  }
  if (!DAYS) {
    console.log('[time-shift-demo-dates] DAYS=0 (no-op)');
    return;
  }
  const msShift = DAYS * 24 * 60 * 60 * 1000;
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  async function shiftCollection(col, dateFields) {
    let cursor; let scanned=0, updated=0; const batch=50;
    while (true) {
      const res = await db.listDocuments(DB_ID, col, [sdk.Query.limit(batch), ...(cursor? [sdk.Query.cursorAfter(cursor)] : [])]);
      for (const doc of res.documents) {
        scanned++; cursor = doc.$id;
        const patch = {};
        for (const f of dateFields) {
          const v = doc[f];
          if (typeof v === 'string') {
            const t = new Date(v).getTime();
            if (!isNaN(t)) patch[f] = new Date(t + msShift).toISOString();
          }
        }
        if (Object.keys(patch).length) {
          await db.updateDocument(DB_ID, col, doc.$id, patch);
          updated++; console.log(`[shift] ${col}:${doc.$id} ->`, patch);
        }
      }
      if (res.documents.length < batch) break;
    }
    console.log(`[${col}] scanned=${scanned} updated=${updated}`);
  }

  await shiftCollection('courses', ['createdAt']);
  await shiftCollection('assessments', ['createdAt','dueAt']);
  await shiftCollection('lessons', ['startsAt','endsAt']);
  console.log('[time-shift-demo-dates] complete');
}

main().catch(e => { console.error(e); process.exit(1); });
