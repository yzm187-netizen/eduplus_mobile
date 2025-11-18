// Enables document-level security for specified collections and preserves existing permissions
// Usage: COLS=lessons,notes TEACHER_ID=<id> node -r dotenv/config scripts/appwrite/enable-doc-security.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const cols = (process.env.COLS || 'lessons,notes').split(',').map(s=>s.trim()).filter(Boolean);
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[enable-doc-security] Missing env vars');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  for (const col of cols) {
    try {
      const current = await db.getCollection(DB_ID, col);
      if (current.documentSecurity) {
        console.log(`[${col}] already has documentSecurity=true`);
        continue;
      }
      const name = current.name || col;
      const permissions = current.$permissions || [];
      await db.updateCollection(DB_ID, col, name, permissions, true);
      console.log(`[${col}] documentSecurity enabled`);
    } catch (e) {
      console.error(`[${col}] error`, e?.message || e);
    }
  }
  console.log('[enable-doc-security] done');
}

main().catch(e=>{ console.error(e); process.exit(1); });
