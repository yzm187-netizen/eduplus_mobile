// Checks document-level security for specified collections.
// Usage:
//   node scripts/appwrite/check-collection-security.js
//   COLS=notes,courses node scripts/appwrite/check-collection-security.js
// Auto-loads .env if dotenv preload not used.
const fs = require('fs');
const path = require('path');
const sdk = require('node-appwrite');

function loadEnvFallback() {
  if (process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID) return; // already loaded
  const envPath = path.resolve(__dirname, '..', '..', '.env'); // eduplus/.env relative to this script
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const k = line.slice(0, idx).trim();
    if (!k) return;
    const v = line.slice(idx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  });
}

async function main() {
  loadEnvFallback();
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const collections = (process.env.COLS || 'courses,enrollments').split(',');

  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[check-collection-security] Missing env. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
    process.exit(1);
  }

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  for (const col of collections) {
    try {
      const res = await db.getCollection(DB_ID, col);
      console.log(`[${col}] documentSecurity=${res.documentSecurity} permissions=${JSON.stringify(res.$permissions || [])}`);
    } catch (e) {
      console.error(`[${col}] error:`, e?.message || e);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
