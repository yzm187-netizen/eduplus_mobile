// Ensure a student account exists by email, upsert profile, and enroll into courses.
// Usage examples:
//   node scripts/appwrite/ensure-student-enrolled.js --email alice@example.edu --password Abcd1234!
//   node scripts/appwrite/ensure-student-enrolled.js --email alice@example.edu --courses MATH101,PHYS101
// If --password is omitted and user does not exist, a strong password will be generated and printed.
// Env required: APPWRITE_ENDPOINT, APPWRITE_PROJECT (or APPWRITE_PROJECT_ID), APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Users, Databases, ID, Query } = require('node-appwrite');

const args = process.argv.slice(2);
function getArg(flag) { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : undefined; }
const email = getArg('--email');
const passwordArg = getArg('--password');
const coursesCsv = getArg('--courses');
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

function genPassword() {
  // 14 chars: upper, lower, digit, special
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const pool = upper + lower + digits + special;
  let out = pick(upper) + pick(lower) + pick(digits) + pick(special);
  for (let i = 0; i < 10; i++) out += pick(pool);
  return out;
}

async function findUserByEmail(em) {
  // Users.list may not support server-side filtering; list first 100 and search client-side
  const list = await users.list(undefined, 100);
  return list.users.find((u) => (u.email || '').toLowerCase() === em.toLowerCase()) || null;
}

async function ensureProfile(id, name, email, role) {
  const data = { role, name, preferredName: name, email, avatarUrl: null, createdAt: new Date().toISOString() };
  try { await db.createDocument(DB_ID, COL_PROFILES, id, data); }
  catch (e) { const m = String(e?.message || e); if (!/already exists|409/i.test(m)) throw e; await db.updateDocument(DB_ID, COL_PROFILES, id, data); }
}

(async () => {
  console.log('[ensure-student] Target:', { endpoint, project, DB_ID });

  // Ensure user exists
  let user = await findUserByEmail(email);
  let created = false;
  let passwordToOutput = passwordArg;
  if (!user) {
    const pwd = passwordArg || genPassword();
    const uid = ID.unique();
    try {
      if (typeof users.createArgon2User === 'function') {
        user = await users.createArgon2User(uid, email, pwd, email.split('@')[0]);
      } else if (typeof users.createEmailUser === 'function') {
        user = await users.createEmailUser(uid, email, pwd, email.split('@')[0]);
      } else {
        user = await users.create(uid, email, undefined, pwd, email.split('@')[0]);
      }
      created = true;
      passwordToOutput = pwd;
      console.log('Created user:', user.$id, email);
    } catch (e) {
      console.error('Failed to create user:', e.message || e);
      process.exit(1);
    }
  } else {
    console.log('User exists:', user.$id, email);
  }

  await ensureProfile(user.$id, user.name || email.split('@')[0], email, 'student');

  // Determine courses
  let courseDocs = [];
  if (coursesCsv) {
    const codes = coursesCsv.split(',').map((s) => s.trim()).filter(Boolean);
    const res = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('code', codes)]);
    courseDocs = res.documents;
  } else {
    const res = await db.listDocuments(DB_ID, COL_COURSES);
    courseDocs = res.documents;
  }

  // Enroll
  for (const c of courseDocs) {
    const existing = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [
      Query.equal('courseId', [c.$id]),
      Query.equal('userId', [user.$id]),
    ]);
    if (existing.total) {
      const doc = existing.documents[0];
      if (doc.status !== 'active' || doc.role !== 'student') {
        await db.updateDocument(DB_ID, COL_ENROLLMENTS, doc.$id, { status: 'active', role: 'student' });
      }
      continue;
    }
    await db.createDocument(DB_ID, COL_ENROLLMENTS, ID.unique(), {
      courseId: c.$id,
      userId: user.$id,
      role: 'student',
      status: 'active',
      joinedAt: new Date().toISOString(),
    });
  }

  console.log('\nDone. Summary:');
  console.log(' - User:', email, `(${user.$id})`, created ? '(created)' : '(existing)');
  if (created && passwordToOutput) console.log(' - Initial password:', passwordToOutput);
  console.log(' - Enrolled in', courseDocs.length, 'courses');
})();
