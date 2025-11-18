// Backfill note document + file permissions to ensure readable attachments
// Strategy: add read("any") to note documents and attached files if absent.
// Optionally restrict update/delete to owner if authorId attribute exists and owner perms missing.
// Usage:
//   node scripts/appwrite/backfill-note-perms.js [--dry]
// Env:
//   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
//   APPWRITE_BUCKET_NOTES or EXPO_PUBLIC_APPWRITE_BUCKET_ID (bucket containing note attachments)
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
  return { dry: process.argv.includes('--dry') || process.argv.includes('--dry-run') };
}

async function main() {
  loadEnvFallback();
  const { dry } = parseArgs();
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const bucketId = process.env.APPWRITE_BUCKET_NOTES || process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;
  if (!endpoint || !project || !key || !databaseId) {
    console.error('[backfill-note-perms] Missing required env (APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID)');
    process.exit(1);
  }
  if (!bucketId) {
    console.error('[backfill-note-perms] Missing bucket id (APPWRITE_BUCKET_NOTES or EXPO_PUBLIC_APPWRITE_BUCKET_ID)');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);
  const storage = new sdk.Storage(client);

  console.log('[backfill-note-perms] start', { dry, databaseId, bucketId });

  let docs = [];
  try {
    const res = await db.listDocuments(databaseId, 'notes', [sdk.Query.limit(200)]);
    docs = res.documents || [];
  } catch (e) {
    console.error('[backfill-note-perms] listDocuments failed', e.message || e);
    process.exit(1);
  }
  console.log(`[backfill-note-perms] processing ${docs.length} note documents`);

  let updatedDocs = 0;
  let updatedFiles = 0;

  for (const doc of docs) {
    const existing = doc.$permissions || [];
    const hasReadAny = existing.some(p => /read\("any"\)/.test(p));
    let nextPerms = existing.slice();
    if (!hasReadAny) nextPerms.push('read("any")');
    // Add owner update/delete if authorId present and not already granted
    const authorId = doc.authorId || doc.userId || null;
    if (authorId) {
      const hasUpdateOwner = nextPerms.some(p => p.includes(`update("user:${authorId}`));
      if (!hasUpdateOwner) {
        nextPerms.push(`update("user:${authorId}")`);
        nextPerms.push(`delete("user:${authorId}")`);
      }
    }
    if (nextPerms.length !== existing.length || !hasReadAny) {
      console.log('[doc] update', doc.$id, '->', nextPerms);
      if (!dry) {
        try { await db.updateDocument(databaseId, 'notes', doc.$id, { }, nextPerms); updatedDocs++; } catch (e) { console.warn('[doc] update failed', doc.$id, e.message || e); }
      }
    }
    // Attached file
    const fileId = doc.fileId || doc.attachmentId;
    if (fileId) {
      try {
        const f = await storage.getFile(bucketId, fileId);
        const fPerms = f.$permissions || [];
        const fHasReadAny = fPerms.some(p => /read\("any"\)/.test(p));
        let nextFilePerms = fPerms.slice();
        if (!fHasReadAny) nextFilePerms.push('read("any")');
        if (authorId) {
          const fHasUpdateOwner = nextFilePerms.some(p => p.includes(`update("user:${authorId}`));
          if (!fHasUpdateOwner) {
            nextFilePerms.push(`update("user:${authorId}")`);
            nextFilePerms.push(`delete("user:${authorId}")`);
          }
        }
        if (!dry && (nextFilePerms.length !== fPerms.length || !fHasReadAny)) {
          console.log('[file] update', fileId, '->', nextFilePerms);
          try { await storage.updateFile(bucketId, fileId, nextFilePerms); updatedFiles++; } catch (e) { console.warn('[file] update failed', fileId, e.message || e); }
        }
      } catch (e) {
        console.warn('[file] fetch failed', fileId, e.message || e);
      }
    }
  }

  console.log('[backfill-note-perms] complete', { updatedDocs, updatedFiles, dry });
}

main().catch(e => { console.error(e); process.exit(1); });
