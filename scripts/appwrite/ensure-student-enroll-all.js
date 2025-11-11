// Ensure a student exists and enroll them into all existing courses
// Usage:
//   node scripts/appwrite/ensure-student-enroll-all.js --email alice.smith@student.edu.my --name "Alice Smith" --password "EduPlus!Alice123"
// Env required: APPWRITE_ENDPOINT, APPWRITE_PROJECT (or APPWRITE_PROJECT_ID), APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Users, Databases, ID, Query } = require('node-appwrite');

const args = process.argv.slice(2);
function getArg(flag, def) { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : def; }
const email = getArg('--email');
const name = getArg('--name', email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Student');
const password = getArg('--password', 'EduPlus!Student123');
if (!email) { console.error('Provide --email'); process.exit(1); }

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

const COL_PROFILES = 'profiles';
const COL_COURSES = 'courses';
const COL_ENROLLMENTS = 'enrollments';

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new Users(client);
const db = new Databases(client);

async function ensureUser({ email, password, name }) {
  const userId = ID.unique();
  try { if (typeof users.createArgon2User === 'function') return await users.createArgon2User(userId, email, password, name); } catch {}
  try { if (typeof users.createEmailUser === 'function') return await users.createEmailUser(userId, email, password, name); } catch {}
  try { if (typeof users.create === 'function') return await users.create(userId, email, undefined, password, name); } catch {}
  throw new Error('No compatible Users.create* method found');
}

async function findUserByEmail(email) {
  try {
    const res = await users.list();
    const found = res.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    return found || null;
  } catch { return null; }
}

async function upsertProfile({ id, name, email, role }) {
  const data = { role, name, preferredName: name, avatarUrl: null, email, createdAt: new Date().toISOString() };
  try { await db.createDocument(DB_ID, COL_PROFILES, id, data); }
  catch (e) {
    const msg = String(e?.message || e);
    if (!/already exists|409/.test(msg)) throw e;
    await db.updateDocument(DB_ID, COL_PROFILES, id, data);
  }
}

async function ensureEnrollment(courseId, userId) {
  const existing = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [
    Query.equal('courseId', [courseId]),
    Query.equal('userId', [userId]),
  ]);
  if (existing.total) {
    const doc = existing.documents[0];
    if (doc.status !== 'active' || doc.role !== 'student') {
      await db.updateDocument(DB_ID, COL_ENROLLMENTS, doc.$id, { status: 'active', role: 'student' });
    }
    return doc.$id;
  }
  const created = await db.createDocument(DB_ID, COL_ENROLLMENTS, ID.unique(), {
    courseId,
    userId,
    role: 'student',
    status: 'active',
    joinedAt: new Date().toISOString(),
  });
  return created.$id;
}

(async () => {
  console.log('[ensure-student] Target:', { endpoint, project, DB_ID });
  let u = await findUserByEmail(email);
  if (!u) {
    console.log('[ensure-student] Creating user for', email);
    u = await ensureUser({ email, password, name });
  } else {
    console.log('[ensure-student] User exists', u.$id);
  }
  await upsertProfile({ id: u.$id, name, email, role: 'student' });

  const courses = await db.listDocuments(DB_ID, COL_COURSES, []);
  if (!courses.total) { console.log('No courses found to enroll.'); return; }
  console.log('Found courses:', courses.total);
  for (const c of courses.documents) {
    const enId = await ensureEnrollment(c.$id, u.$id);
    console.log(' - enrolled in', c.code, c.name, 'enrollment', enId);
  }
  console.log('\nDone. Credentials for this student:');
  console.log(' Email:', email);
  console.log(' Password:', password);
})();
