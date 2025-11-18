// Upsert teacher enrollments for specific courses
// Run with: node -r dotenv/config scripts/appwrite/add-teacher-enrollments.js

const { Client, Users, Databases, ID, Query } = require('node-appwrite');

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.APPWRITE_PROJECT || process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !project || !apiKey || !DB_ID) {
  console.error('Missing envs APPWRITE_ENDPOINT/PROJECT/API_KEY/DATABASE_ID');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new Users(client);
const db = new Databases(client);

async function findUserIdByEmail(email) {
  // Try Users API
  try {
    const res = await users.list({ search: email });
    const u = res.users?.find((x) => x.email === email);
    if (u) return u.$id;
  } catch {}
  try {
    const res2 = await users.list([], email);
    const u2 = res2.users?.find((x) => x.email === email);
    if (u2) return u2.$id;
  } catch {}
  // Fallback to profiles collection
  try {
    const prof = await db.listDocuments(DB_ID, 'profiles', [Query.equal('email', [email])]);
    if (prof.total) return prof.documents[0].$id;
  } catch {}
  return null;
}

async function ensureUser({ email, password, name }) {
  // Try get first
  const existingId = await findUserIdByEmail(email);
  if (existingId) return existingId;
  // Create new
  const userId = ID.unique();
  try {
    const created = await users.create({ userId, email, password, name });
    return created.$id;
  } catch (e) {
    // Fallback legacy signature
    try {
      const created2 = await users.create(userId, email, undefined, password, name);
      return created2.$id;
    } catch (e2) {
      throw e2;
    }
  }
}

async function upsertProfile({ id, name, email, role }) {
  const data = {
    role,
    name,
    preferredName: name,
    avatarUrl: null,
    email,
    createdAt: new Date().toISOString(),
  };
  try {
    await db.createDocument(DB_ID, 'profiles', id, data);
  } catch (e) {
    if (!/already exists|409/.test(String(e?.message || e))) throw e;
    await db.updateDocument(DB_ID, 'profiles', id, data);
  }
}

async function getCourseIdByCode(code) {
  const res = await db.listDocuments(DB_ID, 'courses', [Query.equal('code', [code])]);
  if (!res.total) throw new Error('Course not found: ' + code);
  return res.documents[0].$id;
}

async function ensureEnrollment(courseId, userId, role) {
  const res = await db.listDocuments(DB_ID, 'enrollments', [
    Query.equal('courseId', [courseId]),
    Query.equal('userId', [userId]),
  ]);
  if (res.total) {
    const doc = res.documents[0];
    if (doc.role !== role || doc.status !== 'active') {
      await db.updateDocument(DB_ID, 'enrollments', doc.$id, { role, status: 'active' });
    }
    return doc.$id;
  }
  const doc = await db.createDocument(DB_ID, 'enrollments', ID.unique(), {
    courseId,
    userId,
    role,
    status: 'active',
    joinedAt: new Date().toISOString(),
  });
  return doc.$id;
}

(async () => {
  const teacherEmail = 'adrian.tan@newinti.edu.my';
  // Create teacher if missing
  const teacherId = await ensureUser({
    email: teacherEmail,
    password: 'EduPlus!Teacher123',
    name: 'Dr. Adrian Tan',
  });
  await upsertProfile({ id: teacherId, name: 'Dr. Adrian Tan', email: teacherEmail, role: 'teacher' });

  const codes = ['MATH101', 'ENG101'];
  for (const code of codes) {
    const courseId = await getCourseIdByCode(code);
    const id = await ensureEnrollment(courseId, teacherId, 'teacher');
    console.log('Upserted teacher enrollment:', { code, courseId, enrollmentId: id });
  }
  console.log('Done.');
})().catch((e) => { console.error(e); process.exit(1); });
