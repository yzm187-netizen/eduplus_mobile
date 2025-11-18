// Lists profiles with their names and matches against auth user IDs (Accounts API not directly available via node-appwrite, placeholder for future enhancement)
// Usage: node -r dotenv/config scripts/appwrite/inspect-profiles.js [USER_ID,...]
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_PROFILES = 'profiles';
  const filterIds = process.argv.slice(2).filter(Boolean);
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[inspect-profiles] Missing env vars');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  let cursor; const batch=100; let scanned=0;
  while (true) {
    const res = await db.listDocuments(DB_ID, COL_PROFILES, [sdk.Query.limit(batch), ...(cursor? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of res.documents) {
      scanned++; cursor = doc.$id;
      if (filterIds.length && !filterIds.includes(doc.$id)) continue;
      console.log(JSON.stringify({ id: doc.$id, name: doc.name, preferredName: doc.preferredName, role: doc.role, email: doc.email }, null, 2));
    }
    if (res.documents.length < batch) break;
  }
  console.log('[inspect-profiles] scanned=', scanned);
}

main().catch(e => { console.error(e); process.exit(1); });
