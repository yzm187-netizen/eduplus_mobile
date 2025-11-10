// Seed one teacher (Dr. Adrian Tan), one student (Alice Smith), and one course (MATH101 Calculus I)
// - Creates Appwrite auth accounts (email+password)
// - Creates matching profile docs (id = account $id)
// - Creates a course owned by teacher (teacherIds = [aliceId])
// - Enrolls teacher (role=teacher) and student (role=student)
// - Adds a few lessons under the course
//
// Usage: node scripts/appwrite/seed-teacher-course.js
// Required envs: APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Users, Databases, ID } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID);

const COL_PROFILES = 'profiles';
const COL_COURSES = 'courses';
const COL_ENROLLMENTS = 'enrollments';
const COL_LESSONS = 'lessons';

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new Users(client);
const db = new Databases(client);

async function ensureUser({ email, password, name }) {
  // Try create via multiple APIs for compatibility across Appwrite versions
  const userId = ID.unique();
  try {
    if (typeof users.createArgon2User === 'function') {
      return await users.createArgon2User(userId, email, password, name);
    }
  } catch (e) {
    // fallthrough
  }
  try {
    if (typeof users.createEmailUser === 'function') {
      return await users.createEmailUser(userId, email, password, name);
    }
  } catch (e) {
    // fallthrough
  }
  try {
    // Legacy signature: create(userId, email, phone, password, name)
    if (typeof users.create === 'function') {
      return await users.create(userId, email, undefined, password, name);
    }
  } catch (e) {
    // fallthrough
  }
  throw new Error('No compatible Users.create* method found in node-appwrite');
}

async function findUserByEmail(email) {
  try {
    const res = await users.list(undefined, undefined, undefined, undefined, undefined, undefined, undefined, email);
    if (res.total && res.users && res.users.length) return res.users[0];
  } catch {}
  return null;
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
    await db.createDocument(DB_ID, COL_PROFILES, id, data);
  } catch (e) {
    const msg = String(e?.message || e);
    if (!/already exists|409/.test(msg)) throw e;
    await db.updateDocument(DB_ID, COL_PROFILES, id, data);
  }
}

async function main() {
  // Accounts
  const teacher = { name: 'Dr. Adrian Tan', email: 'adrian.tan@newinti.edu.my', password: 'EduPlus!Teacher123' };
  const student = { name: 'Alice Smith', email: 'alice.smith@student.newinti.edu.my', password: 'EduPlus!Alice123' };

  // Create/find teacher
  let t = await findUserByEmail(teacher.email);
  if (!t) t = await ensureUser(teacher);
  // Create/find student
  let s = await findUserByEmail(student.email);
  if (!s) s = await ensureUser(student);

  // Profiles
  await upsertProfile({ id: t.$id, name: teacher.name, email: teacher.email, role: 'teacher' });
  await upsertProfile({ id: s.$id, name: student.name, email: student.email, role: 'student' });

  // Course (owned by teacher)
  const courseCode = 'MATH101';
  const courseName = 'Calculus I';
  let courseDoc;
  try {
    courseDoc = await db.createDocument(DB_ID, COL_COURSES, ID.unique(), {
      code: courseCode,
      name: courseName,
      color: '#2B0D52',
      gradingRule: 'standard',
      teacherIds: [t.$id],
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = String(e?.message || e);
    if (!/already exists|409/.test(msg)) throw e;
    // If unique index on code, fetch existing by code
    const { Query } = require('node-appwrite');
    const existing = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('code', [courseCode])]);
    if (!existing.total) throw new Error('Failed to find existing course by code after conflict');
    courseDoc = existing.documents[0];
  }

  // Enrollments
  const { Query } = require('node-appwrite');
  async function ensureEnrollment(userId, role) {
    const existing = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [
      Query.equal('courseId', [courseDoc.$id]),
      Query.equal('userId', [userId]),
    ]);
    if (existing.total) {
      const doc = existing.documents[0];
      if (doc.status !== 'active' || doc.role !== role) {
        await db.updateDocument(DB_ID, COL_ENROLLMENTS, doc.$id, { status: 'active', role });
      }
      return;
    }
    await db.createDocument(DB_ID, COL_ENROLLMENTS, ID.unique(), {
      courseId: courseDoc.$id,
      userId,
      role,
      status: 'active',
      joinedAt: new Date().toISOString(),
    });
  }
  await ensureEnrollment(t.$id, 'teacher');
  await ensureEnrollment(s.$id, 'student');

  // Lessons (3 sample weeks)
  function isoShift(days, hoursStart, durationHrs) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, hoursStart, 0, 0);
    const e = new Date(d.getTime() + durationHrs * 60 * 60 * 1000);
    return { startsAt: d.toISOString(), endsAt: e.toISOString() };
  }
  const lessons = [
    { topic: 'Limits and Continuity', ...isoShift(2, 9, 2) },
    { topic: 'Derivatives: Rules and Applications', ...isoShift(9, 9, 2) },
    { topic: 'Integrals: Fundamentals', ...isoShift(16, 9, 2) },
  ];
  for (const l of lessons) {
    try {
      await db.createDocument(DB_ID, COL_LESSONS, ID.unique(), { courseId: courseDoc.$id, topic: l.topic, startsAt: l.startsAt, endsAt: l.endsAt });
    } catch {}
  }

  console.log('\nSeeded:');
  console.log('- Teacher:', teacher.email, '(password set)');
  console.log('- Student:', student.email, '(password set)');
  console.log('- Course:', courseCode, courseName, 'id=' + courseDoc.$id);
  console.log('- Enrollments: teacher + student');
  console.log('- Lessons: 3 created');
  console.log('\nYou can now sign in as the student in the app:');
  console.log('  Email:', student.email);
  console.log('  Password:', student.password);
  console.log('Teacher can sign in too:');
  console.log('  Email:', teacher.email);
  console.log('  Password:', teacher.password);
}

main().catch((e) => { console.error('Seed failed:', e.message || e); process.exit(1); });
