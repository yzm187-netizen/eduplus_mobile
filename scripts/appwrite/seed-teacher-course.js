// Academic demo seeder (idempotent)
// Expands original single-course seed to multiple courses and multiple students.
// Data seeded:
//   Teacher: Dr. Adrian Tan (adrian.tan@newinti.edu.my)
//   Students: Alice Smith, Bob Lee, Carol Tan, David Wong
//   Courses: MATH101 (Calculus I), PHYS101 (Physics I), CHEM101 (General Chemistry), ENG101 (English Composition)
//   Enrollments: All students enrolled in all courses; teacher enrolled as teacher in all courses
//   Lessons: 2 sample lessons per course (scheduled into the future)
// Behavior:
//   - Idempotent: Re-runs won't duplicate users, courses, enrollments, lessons (conflicts are handled, existing looked up by code/email)
//   - Profiles upserted (role kept in sync)
// Usage: node scripts/appwrite/seed-teacher-course.js
//
// Required envs: APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Users, Databases, ID } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_PROJECT_ID, // alternative name
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT || APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

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

async function ensureCourse({ code, name, teacherId, color }) {
  const { Query } = require('node-appwrite');
  // Try create
  try {
    const doc = await db.createDocument(DB_ID, COL_COURSES, ID.unique(), {
      code,
      name,
      color: color || null,
      gradingRule: 'standard',
      teacherIds: [teacherId],
      createdAt: new Date().toISOString(),
    });
    return doc;
  } catch (e) {
    const msg = String(e?.message || e);
    if (!/already exists|409/.test(msg)) throw e;
    const existing = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('code', [code])]);
    if (!existing.total) throw new Error('Failed to find existing course by code after conflict');
    return existing.documents[0];
  }
}

async function ensureEnrollment(courseId, userId, role) {
  const { Query } = require('node-appwrite');
  const existing = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [
    Query.equal('courseId', [courseId]),
    Query.equal('userId', [userId]),
  ]);
  if (existing.total) {
    const doc = existing.documents[0];
    if (doc.status !== 'active' || doc.role !== role) {
      await db.updateDocument(DB_ID, COL_ENROLLMENTS, doc.$id, { status: 'active', role });
    }
    return doc;
  }
  return await db.createDocument(DB_ID, COL_ENROLLMENTS, ID.unique(), {
    courseId,
    userId,
    role,
    status: 'active',
    joinedAt: new Date().toISOString(),
  });
}

function makeLessonTimes(offsetDays, hourStart, durationHrs) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hourStart, 0, 0);
  const end = new Date(start.getTime() + durationHrs * 60 * 60 * 1000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

async function ensureLessons(courseId, topics) {
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    try {
      await db.createDocument(DB_ID, COL_LESSONS, ID.unique(), {
        courseId,
        topic: t.topic,
        startsAt: t.startsAt,
        endsAt: t.endsAt,
      });
    } catch (e) {
      // Ignore duplicates
    }
  }
}

async function main() {
  console.log('[seed] Target:', { endpoint, project, DB_ID });
  // Accounts (teacher + students)
  const teacher = { name: 'Dr. Adrian Tan', email: 'adrian.tan@newinti.edu.my', password: 'EduPlus!Teacher123' };
  const students = [
    { name: 'Alice Smith', email: 'alice.smith@student.newinti.edu.my', password: 'EduPlus!Alice123' },
    { name: 'Bob Lee', email: 'bob.lee@student.newinti.edu.my', password: 'EduPlus!Bob123' },
    { name: 'Carol Tan', email: 'carol.tan@student.newinti.edu.my', password: 'EduPlus!Carol123' },
    { name: 'David Wong', email: 'david.wong@student.newinti.edu.my', password: 'EduPlus!David123' },
  ];

  // Ensure teacher
  let teacherUser = await findUserByEmail(teacher.email);
  if (!teacherUser) teacherUser = await ensureUser(teacher);
  await upsertProfile({ id: teacherUser.$id, name: teacher.name, email: teacher.email, role: 'teacher' });

  // Ensure students
  const studentUsers = [];
  for (const s of students) {
    let u = await findUserByEmail(s.email);
    if (!u) u = await ensureUser(s);
    await upsertProfile({ id: u.$id, name: s.name, email: s.email, role: 'student' });
    studentUsers.push(u);
  }

  // Courses list
  const coursesInput = [
    { code: 'MATH101', name: 'Calculus I', color: '#2B0D52' },
    { code: 'PHYS101', name: 'Physics I', color: '#0D3B52' },
    { code: 'CHEM101', name: 'General Chemistry', color: '#523B0D' },
    { code: 'ENG101', name: 'English Composition', color: '#0D5240' },
  ];
  const courseDocs = [];
  for (const c of coursesInput) {
    const doc = await ensureCourse({ code: c.code, name: c.name, color: c.color, teacherId: teacherUser.$id });
    courseDocs.push(doc);
  }

  // Enrollments (teacher + all students for every course)
  for (const course of courseDocs) {
    await ensureEnrollment(course.$id, teacherUser.$id, 'teacher');
    for (const stu of studentUsers) {
      await ensureEnrollment(course.$id, stu.$id, 'student');
    }
  }

  // Lessons per course (2 sample lessons staggered)
  for (const course of courseDocs) {
    const topics = [
      { topic: `${course.code} Intro & Overview`, ...makeLessonTimes(2, 9, 2) },
      { topic: `${course.code} Deep Dive`, ...makeLessonTimes(7, 9, 2) },
    ];
    await ensureLessons(course.$id, topics);
  }

  // Output summary
  console.log('\nSeeded Academic Demo Summary');
  console.log('Teacher:', teacher.email);
  console.log('Students:');
  for (const s of students) console.log(' -', s.email);
  console.log('\nCourses:');
  for (const c of courseDocs) console.log(' -', c.code, c.name, 'id=' + c.$id);
  console.log('\nEnrollments: teacher +', students.length, 'students in each course');
  console.log('Lessons: 2 per course (ignored duplicates if re-run)');
  console.log('\nLogin credentials (demo):');
  console.log(' Teacher:', teacher.email, teacher.password);
  for (const s of students) console.log(' Student:', s.email, s.password);
  console.log('\nRe-run safe: existing entities reused, roles synced.');
}

main().catch((e) => { console.error('Seed failed:', e.message || e); process.exit(1); });
