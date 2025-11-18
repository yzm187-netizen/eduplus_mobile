// Expands the 'description' attribute size on the 'courses' collection
// Usage: node -r dotenv/config scripts/appwrite/expand-course-description.js 2048

const { Client, Databases } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  APPWRITE_COURSES_COLLECTION_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT || APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
const COL_COURSES = APPWRITE_COURSES_COLLECTION_ID || 'courses';

async function main() {
  const size = Number(process.argv[2] || 2048);
  if (!Number.isFinite(size) || size < 255) throw new Error('Provide a size >= 255');

  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const db = new Databases(client);

  // Appwrite v1.5+: updateStringAttribute(databaseId, collectionId, key, required, default, array, size)
  // We keep required/default/array unchanged; only bump size.
  console.log(`[migrate] Expanding courses.description to size=${size}`);

  try {
    // Fetch current attribute metadata (best-effort)
    const col = await db.getCollection(DB_ID, COL_COURSES);
    const attr = col.attributes.find((a) => a.key === 'description' && a.type === 'string');
    const required = attr?.required ?? false;
    const def = attr?.default ?? undefined;
    const array = attr?.array ?? false;

    await db.updateStringAttribute(DB_ID, COL_COURSES, 'description', required, def, array, size);
    console.log('[migrate] Attribute updated successfully.');
  } catch (e) {
    console.error('[migrate] Failed to update attribute:', e.message || e);
    process.exit(1);
  }
}

main();
