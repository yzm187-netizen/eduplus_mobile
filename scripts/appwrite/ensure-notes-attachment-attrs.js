// Ensure 'notes' collection has attachment attributes used by the app
// Usage: node -r dotenv/config scripts/appwrite/ensure-notes-attachment-attrs.js

const sdk = require('node-appwrite');

function loadEnvFallback() {
  const fs = require('fs');
  const path = require('path');
  const p = path.resolve(__dirname, '..', '..', '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvFallback();
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  if (!endpoint || !project || !key || !DB_ID) {
    console.error('[ensure-notes-attachment-attrs] Missing required envs');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);
  const collectionId = process.env.NOTES_COLLECTION_ID || 'notes';

  const col = await db.getCollection(DB_ID, collectionId);
  const have = new Set(col.attributes.map((a) => a.key));

  const ensureString = async (key, size, required = false) => {
    if (have.has(key)) return false;
    await db.createStringAttribute(DB_ID, collectionId, key, size, required);
    console.log('[ensure-notes-attachment-attrs] created attribute', key);
    return true;
  };

  let changed = false;
  changed = (await ensureString('attachmentId', 64, false)) || changed;
  changed = (await ensureString('attachmentName', 256, false)) || changed;
  changed = (await ensureString('mimeType', 128, false)) || changed;
  changed = (await ensureString('attachmentUrl', 2048, false)) || changed;

  if (!changed) console.log('[ensure-notes-attachment-attrs] No changes needed');
}

main().catch((e) => { console.error('[ensure-notes-attachment-attrs] error', e?.message || e); process.exit(1); });
