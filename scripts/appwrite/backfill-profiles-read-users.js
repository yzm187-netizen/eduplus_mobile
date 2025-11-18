// Add broad read(users) permission to existing profile documents if missing.
// Usage:
//  node -r dotenv/config scripts/appwrite/backfill-profiles-read-users.js

const { Client, Databases, Query, Permission, Role } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT || EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT || APPWRITE_PROJECT_ID || EXPO_PUBLIC_APPWRITE_PROJECT_ID);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID || EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const COLLECTION = 'profiles';

(async () => {
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const db = new Databases(client);

  // Fetch first batch (adjust limit if needed)
  const res = await db.listDocuments(DB_ID, COLLECTION, [], 200);
  let updated = 0;
  for (const doc of res.documents) {
    const perms = doc.$permissions || [];
    const hasReadUsers = perms.some(p => /read\("users"\)/.test(p) || /read\('users'\)/.test(p));
    if (!hasReadUsers) {
      // Merge new read(users) permission; other perms remain
      const newPerms = [...perms, Permission.read(Role.users())];
      try {
        await db.updateDocument(DB_ID, COLLECTION, doc.$id, { name: doc.name }, newPerms);
        updated++;
        console.log('Added read(users) to profile', doc.$id);
      } catch (e) {
        console.warn('Failed updating profile permissions', doc.$id, e.message || e);
      }
    }
  }
  console.log('Backfill complete. Updated profiles:', updated);
})();
