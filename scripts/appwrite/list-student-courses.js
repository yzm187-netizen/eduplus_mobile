// List courses for a student by email using Appwrite Admin API
// Usage:
//   node scripts/appwrite/list-student-courses.js --email alice.smith@student.newinti.edu.my
// Env required: APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Databases, Query } = require('node-appwrite');

const args = process.argv.slice(2);
function getArg(flag) { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : undefined; }
const email = getArg('--email');
if (!email) { console.error('Provide --email'); process.exit(1); }

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT || EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT || EXPO_PUBLIC_APPWRITE_PROJECT_ID);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID || EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const COL_PROFILES = 'profiles';
const COL_ENROLLMENTS = 'enrollments';
const COL_COURSES = 'courses';

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const db = new Databases(client);

(async () => {
  const profiles = await db.listDocuments(DB_ID, COL_PROFILES, [Query.equal('email', [email])]);
  if (!profiles.total) throw new Error('No profile for ' + email);
  const userId = profiles.documents[0].$id;
  const enr = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [Query.equal('userId', [userId]), Query.equal('status', ['active'])]);
  if (!enr.total) { console.log('No active enrollments for', email); return; }
  const courseIds = Array.from(new Set(enr.documents.map(d => d.courseId)));
  const res = await db.listDocuments(DB_ID, COL_COURSES, [Query.equal('$id', courseIds)]);
  console.log('Courses for', email);
  for (const c of res.documents) {
    console.log('-', c.code, c.name, `(${c.$id})`);
  }
})().catch(e => { console.error('Error:', e.message || e); process.exit(1); });
