// Enroll a student into a course (Appwrite)
// Usage examples:
//   node scripts/appwrite/enroll-student.js --student-email alice@example.com --course-code MATH101
//   node scripts/appwrite/enroll-student.js --user-id 676abc... --course-id 65f...
// Required env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Databases, ID, Query } = require('node-appwrite');

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, APPWRITE_DATABASE_ID } = process.env;
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error('Missing env: APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

const studentEmail = getArg('--student-email');
const userIdArg = getArg('--user-id');
const courseCode = getArg('--course-code');
const courseIdArg = getArg('--course-id');

if ((!studentEmail && !userIdArg) || (!courseCode && !courseIdArg)) {
  console.error('Provide either --student-email or --user-id, and either --course-code or --course-id');
  process.exit(1);
}

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT).setKey(APPWRITE_API_KEY);
const db = new Databases(client);

const DB_ID = APPWRITE_DATABASE_ID;
const COL_PROFILES = 'profiles';
const COL_COURSES = 'courses';
const COL_ENROLLMENTS = 'enrollments';

(async () => {
  let userId = userIdArg;
  if (!userId) {
    const res = await db.listDocuments(DB_ID, COL_PROFILES, [Query.equal('email', [studentEmail])]);
    if (!res.total) throw new Error(`No profile found with email ${studentEmail}`);
    if (res.total > 1) console.warn(`Warning: multiple profiles found for ${studentEmail}, using first.`);
    userId = res.documents[0].$id;
  }

  let courseId = courseIdArg;
  if (!courseId) {
    const res = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('code', [courseCode])]);
    if (!res.total) throw new Error(`No course found with code ${courseCode}`);
    if (res.total > 1) console.warn(`Warning: multiple courses found for code ${courseCode}, using first.`);
    courseId = res.documents[0].$id;
  }

  // Check if already enrolled
  const existing = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [
    Query.equal('courseId', [courseId]),
    Query.equal('userId', [userId]),
  ]);
  if (existing.total) {
    const doc = existing.documents[0];
    if (doc.status !== 'active') {
      await db.updateDocument(DB_ID, COL_ENROLLMENTS, doc.$id, { status: 'active' });
      console.log(`Reactivated enrollment for user ${userId} in course ${courseId} (${doc.$id})`);
    } else {
      console.log(`User ${userId} is already enrolled in course ${courseId} (enrollment ${doc.$id})`);
    }
    return;
  }

  const payload = {
    courseId,
    userId,
    role: 'student',
    status: 'active',
    joinedAt: new Date().toISOString(),
  };
  const created = await db.createDocument(DB_ID, COL_ENROLLMENTS, ID.unique(), payload);
  console.log(`Enrolled user ${userId} into course ${courseId} as student. Enrollment id: ${created.$id}`);
})().catch((e) => {
  console.error('Enroll failed:', e.message || e);
  process.exit(1);
});
