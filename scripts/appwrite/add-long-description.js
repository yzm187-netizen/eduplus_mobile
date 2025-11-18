// Adds a longDescription text attribute to courses collection (if missing) and sets a multi-line long description
// Usage: node -r dotenv/config scripts/appwrite/add-long-description.js MATH101
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

async function ensureLongDescriptionAttribute(db) {
  const collections = await db.listCollections(DB_ID);
  const coursesCol = collections.collections.find(c => c.$id === COL_COURSES);
  if (!coursesCol) throw new Error('Courses collection not found');
  const hasAttr = coursesCol.attributes.some(a => a.key === 'longDescription');
  if (hasAttr) {
    console.log('[longDescription] Attribute already exists');
    return;
  }
  // Fallback: use a large string attribute (size 255) if text attribute API unavailable.
  // If we already hit size limits we may need to shorten description lines.
  console.log('[longDescription] createTextAttribute unavailable; creating large string attribute');
  try {
    await db.createStringAttribute(DB_ID, COL_COURSES, 'longDescription', 255, false);
  } catch (e) {
    const msg = String(e.message || e);
    if (/already exists|409/i.test(msg)) console.log('[longDescription] string attribute already exists');
    else throw e;
  }
  console.log('[longDescription] String attribute ensured');
}

async function updateCourseLongDescription(db, code) {
  const res = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('code', [code])]);
  if (!res.total) throw new Error(`Course code ${code} not found`);
  const course = res.documents[0];
  const lines = [
    'Limits, continuity, differentiation, optimization.',
    'Integrals: Riemann sums, FTC, substitution.',
    'Applications: area, volume, accumulation models.',
    'Practice: weekly sets, peer workshops, reviews.',
    'Support: office hours, enrichment problems.'
  ];
  // Fit within 255 chars hard limit
  let longDesc = lines.join('\n');
  if (longDesc.length > 255) longDesc = longDesc.slice(0, 255);
  const updated = await db.updateDocument(DB_ID, COL_COURSES, course.$id, { longDescription: longDesc });
  console.log(`[update] Set longDescription for ${updated.code} (${updated.$id}) lines=${longDesc.split('\n').length} chars=${longDesc.length}`);
}

async function main() {
  const code = process.argv[2] || 'MATH101';
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const db = new Databases(client);
  await ensureLongDescriptionAttribute(db);
  await updateCourseLongDescription(db, code);
}

main().catch(e => { console.error('add-long-description failed:', e.message || e); process.exit(1); });
