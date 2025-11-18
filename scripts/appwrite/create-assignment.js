// Create an assignment for a course by code, with teacher ownership perms
// Usage:
//   node -r dotenv/config scripts/appwrite/create-assignment.js \
//     --courseCode ENG101 --title "Literature Review Draft" --dueDays 5 \
//     --teacherEmail adrian.tan@newinti.edu.my

const sdk = require('node-appwrite');

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i+1] : undefined; }
function req(name, v) { if (!v) throw new Error(`Missing env ${name}`); return v; }

const endpoint = req('APPWRITE_ENDPOINT', process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT);
const apiKey = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const courseCode = arg('--courseCode');
const title = arg('--title') || 'Assignment';
const dueISO = arg('--dueAt');
const dueDays = Number(arg('--dueDays') || '5');
const teacherEmail = arg('--teacherEmail') || 'adrian.tan@newinti.edu.my';

if (!courseCode) { console.error('Provide --courseCode'); process.exit(1); }

const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new sdk.Users(client);
const db = new sdk.Databases(client);

async function findUserByEmail(em) {
  try { const r = await users.list({ search: em }); if (r.total) return r.users.find(u => (u.email||'').toLowerCase()===em.toLowerCase()) || r.users[0]; } catch {}
  try { const r2 = await users.list([], em); if (r2.total) return r2.users.find(u => (u.email||'').toLowerCase()===em.toLowerCase()) || r2.users[0]; } catch {}
  return null;
}

async function getCourseByCode(code) {
  const res = await db.listDocuments(DB_ID, 'courses', [sdk.Query.equal('code', [code])]);
  if (!res.total) throw new Error('Course not found for code ' + code);
  return res.documents[0];
}

(async () => {
  console.log('[create-assignment] target', { courseCode, title, dueISO, dueDays, teacherEmail });
  const course = await getCourseByCode(courseCode);
  const teacher = await findUserByEmail(teacherEmail);
  if (!teacher) throw new Error('Teacher not found for email ' + teacherEmail);
  const teacherId = teacher.$id || teacher.id;
  const dueAt = dueISO ? new Date(dueISO).toISOString() : new Date(Date.now() + dueDays*24*60*60*1000).toISOString();
  const data = {
    courseId: course.$id,
    title,
    type: 'assignment',
    dueAt,
    createdAt: new Date().toISOString(),
    status: 'open',
    rubricId: null,
  };
  const perms = [
    `read("users")`,
    `update("user:${teacherId}")`,
    `delete("user:${teacherId}")`,
  ];
  const doc = await db.createDocument(DB_ID, 'assessments', sdk.ID.unique(), data, perms);
  console.log('[create-assignment] created', { id: doc.$id, courseId: course.$id, title: doc.title, dueAt: doc.dueAt });
})();
