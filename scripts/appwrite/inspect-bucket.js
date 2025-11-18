// Inspect bucket security & sample file permissions
// Usage: node scripts/appwrite/inspect-bucket.js [--limit=25]
// Env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID (for completeness)
// Bucket resolution order: APPWRITE_BUCKET_NOTES, EXPO_PUBLIC_APPWRITE_BUCKET_ID
const fs = require('fs');
const path = require('path');
const sdk = require('node-appwrite');

function loadEnvFallback() {
  if (process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID) return;
  const p = path.resolve(__dirname, '..', '..', '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v.replace(/^"|"$/g, '');
  }
}

function parseArgs() {
  const out = { limit: 15 };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--limit=')) out.limit = parseInt(arg.split('=')[1] || '15', 10);
  }
  return out;
}

async function main() {
  loadEnvFallback();
  const { limit } = parseArgs();
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const bucketId = process.env.APPWRITE_BUCKET_NOTES || process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;
  if (!endpoint || !project || !key || !bucketId) {
    console.error('[inspect-bucket] Missing required env (APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_BUCKET_NOTES/EXPO_PUBLIC_APPWRITE_BUCKET_ID)');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const storage = new sdk.Storage(client);
  console.log('[inspect-bucket] bucketId', bucketId);
  let bucket;
  try { bucket = await storage.getBucket(bucketId); } catch (e) { console.error('[inspect-bucket] getBucket failed', e.message || e); process.exit(1); }
  console.log('[inspect-bucket] fileSecurity:', bucket.fileSecurity, 'permissions:', bucket.$permissions);
  let files;
  try { files = await storage.listFiles(bucketId); } catch (e) { console.error('[inspect-bucket] listFiles failed', e.message || e); return; }
  console.log(`[inspect-bucket] total files: ${files.files.length}`);
  for (const f of files.files.slice(0, limit)) {
    console.log(`[file] ${f.$id} size=${f.sizeOriginal} mime=${f.mimeType} perms=${JSON.stringify(f.$permissions || [])}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
