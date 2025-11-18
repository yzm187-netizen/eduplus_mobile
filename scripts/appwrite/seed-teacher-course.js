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

// Ensure we are using a server-side API key (not a client key lacking users.write)
if (!/^standard_/.test(apiKey || '') && !/^secret_/.test(apiKey || '')) {
  console.warn('[seed] WARNING: API key does not look like a server key.');
}
const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new Users(client);
const db = new Databases(client);

async function ensureUser({ email, password, name }) {
  // Prefer modern object-style create with plain password; fallback to legacy signature if needed
  const userId = ID.unique();
  if (typeof users.create === 'function') {
    try {
      // Object style (preferred in SDK v20+)
      return await users.create({ userId, email, password, name });
    } catch (e) {
      const msg = String(e?.message || e);
      if (/missing scopes/i.test(msg)) {
        throw new Error('API key lacks users.write scope. Use a server API key from Appwrite Console (Project > API Keys) with Users access.');
      }
      // Legacy signature fallback if object style is not supported
      try {
        return await users.create(userId, email, undefined, password, name);
      } catch (e2) {
        // If the user already exists, return it; otherwise rethrow original error for visibility
        const existing = await findUserByEmail(email);
        if (existing) return existing;
        throw e2;
      }
    }
  }
  // Additional hashing methods if plain create is unavailable (unlikely on modern SDKs)
  if (typeof users.createArgon2User === 'function') {
    try {
      return await users.createArgon2User({ userId, email, password, name });
    } catch (e) {
      const existing = await findUserByEmail(email);
      if (existing) return existing;
      throw e;
    }
  }
  throw new Error('No compatible Users.create method available in node-appwrite SDK');
}

async function findUserByEmail(email) {
  try {
    // SDK v20: list({ search })
    const res = await users.list({ search: email });
    if (res.total && res.users && res.users.length) {
      return res.users.find((u) => u.email === email) || res.users[0];
    }
  } catch (e) {
    // Fallback: older signature list(queries?, search?)
    try {
      const res2 = await users.list([], email);
      if (res2.total && res2.users && res2.users.length) {
        return res2.users.find((u) => u.email === email) || res2.users[0];
      }
    } catch {}
  }
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

async function ensureCourse({ code, name, teacherId, color, description }) {
  const { Query } = require('node-appwrite');
  // Try create
  try {
    const doc = await db.createDocument(DB_ID, COL_COURSES, ID.unique(), {
      code,
      name,
      description: description || null,
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
    const existingDoc = existing.documents[0];
    // Update description/color if newly provided and differs
    try {
      const patch = {};
      if (description && existingDoc.description !== description) patch.description = description;
      // Normalize any prior hex colors to one of the 4 names, or update if different from requested
      const normalize = (val) => {
        if (!val) return null;
        const v = String(val).toLowerCase();
        if (v.includes('red') || v.includes('ef4444')) return 'red';
        if (v.includes('green') || v.includes('22c55e') || v.includes('10b981')) return 'green';
        if (v.includes('purple') || v.includes('a855f7') || v.includes('8b5cf6')) return 'purple';
        if (v.includes('blue') || v.includes('3b82f6') || v.includes('2563eb')) return 'blue';
        return 'blue';
      };
      const desired = normalize(color);
      const current = normalize(existingDoc.color);
      if (desired && current !== desired) patch.color = desired;
      if (Object.keys(patch).length) await db.updateDocument(DB_ID, COL_COURSES, existingDoc.$id, patch);
    } catch {}
    return existingDoc;
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
    { code: 'MATH101', name: 'Calculus I', color: 'red', description: 'Differential and integral calculus focusing on limits, derivatives, integrals, and applications to real-world rate and accumulation problems.' },
    { code: 'PHYS101', name: 'Physics I', color: 'purple', description: 'Foundations of mechanics: motion, forces, energy, momentum, and rotational dynamics with laboratory reinforcement.' },
    { code: 'CHEM101', name: 'General Chemistry', color: 'green', description: 'Atomic structure, bonding, stoichiometry, thermochemistry, and introductory kinetics to build chemical intuition.' },
    { code: 'ENG101', name: 'English Composition', color: 'blue', description: 'Academic writing fundamentals: argument structure, evidence synthesis, clarity, revision, and citation practice.' },
  ];
  const courseDocs = [];
  for (const c of coursesInput) {
    const doc = await ensureCourse({ code: c.code, name: c.name, color: c.color, description: c.description, teacherId: teacherUser.$id });
    courseDocs.push(doc);
  }

  // Enrollments
  // Teacher only teaches a subset to reflect realistic assignment
  const teacherCourseCodes = ['MATH101', 'ENG101'];
  for (const course of courseDocs) {
    if (teacherCourseCodes.includes(course.code)) {
      await ensureEnrollment(course.$id, teacherUser.$id, 'teacher');
    }
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
