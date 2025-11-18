// Updates the 'notes' collection permissions to allow creates and reads.
// Usage (Windows bash):
//   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
//   APPWRITE_DATABASE_ID=... \
//   APPWRITE_TEAM_TEACHERS_ID=... ALLOW_CREATE_USERS=1 \
//   node -r dotenv/config eduplus/scripts/appwrite/set-notes-collection-perms.js
//
// Env toggles:
//   APPWRITE_TEAM_TEACHERS_ID (or EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID) -> if present, restrict create/update/delete to teacher team.
//   ALLOW_CREATE_USERS=1  -> additionally allow create("users") so any authenticated user can upload (debug mode).
//   ADD_READ_USERS=1      -> add read("users") so all authenticated users can view notes.
//   ADD_READ_ANY=1        -> add read("any") public (NOT recommended for production).
//
// This only sets collection-level permissions; document-level permissions may still apply if documentSecurity=true.
// If documentSecurity is enabled, new documents must also be given explicit perms. This script ensures base collection perms so create succeeds.

const sdk = require('node-appwrite');

function req(name, val) { if (!val) throw new Error(`Missing env ${name}`); return val; }

async function main() {
  // Lightweight .env parser fallback (avoids needing dotenv dependency)
  function loadEnvFallback() {
      const fs = require('fs');
      const path = require('path');
      const candidates = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), 'eduplus', '.env'),
        path.join(__dirname, '..', '..', '.env'),
      ];
      for (const p of candidates) {
        try {
          if (!fs.existsSync(p)) continue;
          const raw = fs.readFileSync(p, 'utf8');
          raw.split(/\r?\n/).forEach(line => {
            if (!line || /^\s*#/.test(line)) return;
            const m = line.match(/^([^=]+)=(.*)$/);
            if (!m) return;
            const key = m[1].trim();
            let val = m[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = val;
          });
          console.log('[env-fallback] loaded', p);
          break;
        } catch (e) { /* ignore */ }
      }
    }
    loadEnvFallback();

  const endpoint = req('APPWRITE_ENDPOINT', process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
  const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
  const key = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
  const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
  const collectionId = process.env.NOTES_COLLECTION_ID || 'notes';
  const teacherTeam = (process.env.APPWRITE_TEAM_TEACHERS_ID || process.env.EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID || '').trim();
  const allowCreateUsers = String(process.env.ALLOW_CREATE_USERS || '') === '1';
  const addReadUsers = String(process.env.ADD_READ_USERS || '') === '1';
  const addReadAny = String(process.env.ADD_READ_ANY || '') === '1';

  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  const current = await db.getCollection(DB_ID, collectionId);
  const baseName = current.name || collectionId;
  const existing = Array.isArray(current.$permissions) ? current.$permissions : [];

  // Build target permission set
  const target = new Set();
  if (teacherTeam) {
    target.add(`create("team:${teacherTeam}")`);
    target.add(`update("team:${teacherTeam}")`);
    target.add(`delete("team:${teacherTeam}")`);
    // Teachers should at least read their own; add read team
    target.add(`read("team:${teacherTeam}")`);
  } else {
    // No teacher team configured; fallback to users for mutate
    target.add('create("users")');
    target.add('update("users")');
    target.add('delete("users")');
    target.add('read("users")');
  }
  if (allowCreateUsers) target.add('create("users")');
  if (addReadUsers) target.add('read("users")');
  if (addReadAny) target.add('read("any")');

  // Preserve any existing permissions to avoid accidental removal (union strategy)
  for (const p of existing) target.add(p);

  const next = Array.from(target);
  console.log('[set-notes-collection-perms] current documentSecurity=', current.documentSecurity);
  console.log('[set-notes-collection-perms] existing perms count=', existing.length);
  console.log('[set-notes-collection-perms] target perms count=', next.length);
  console.log('[set-notes-collection-perms] target perms=', next);

  if (next.length === existing.length && existing.every(p => target.has(p))) {
    console.log('[set-notes-collection-perms] No changes needed');
    return;
  }

  // updateCollection signature: (databaseId, collectionId, name, permissions, documentSecurity)
  await db.updateCollection(DB_ID, collectionId, baseName, next, current.documentSecurity);
  console.log('[set-notes-collection-perms] Collection updated');
}

main().catch(err => { console.error('[set-notes-collection-perms] error', err?.message || err); process.exit(1); });
