// Update a course description by code for stress-testing banner container
// Usage: node -r dotenv/config scripts/appwrite/update-course-description.js MATH101

const { Client, Databases, Query } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT || APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const COL_COURSES = 'courses';

async function main() {
  const code = process.argv[2] || 'MATH101';
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const db = new Databases(client);

  // Concise academic catalog description (<=255 chars, single paragraph)
  const longDesc = 'Calculus I develops limits, continuity, differentiation, and the Fundamental Theorem of Calculus with emphasis on conceptual insight, graphical and analytic techniques, optimization, related rates, and accumulation models in science applications.';

  console.log(`[update] Looking up course by code: ${code}`);
  const res = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('code', [code])]);
  if (!res.total) {
    console.error(`[update] Course with code ${code} not found.`);
    process.exit(1);
  }
  const course = res.documents[0];
  const updated = await db.updateDocument(DB_ID, COL_COURSES, course.$id, { description: longDesc });
  console.log(`[update] Updated ${updated.code} (${updated.$id}) description length: ${longDesc.length} chars, lines: ${longDesc.split('\n').length}`);
}

main().catch((e) => { console.error('Update failed:', e.message || e); process.exit(1); });
