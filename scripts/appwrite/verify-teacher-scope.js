// Verify teacher is only enrolled in specific courses
// Run with: node -r dotenv/config scripts/appwrite/verify-teacher-scope.js

const { Client, Users, Databases, Query } = require('node-appwrite');

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
  // Prefer querying profiles (no users.read required)
  try {
    const res = await db.listDocuments(DB_ID, 'profiles', [Query.equal('email', [email])]);
    if (res.total) return res.documents[0].$id;
  } catch {}
  // Fallback to Users API if available
  try {
    const res = await users.list({ search: email });
    const u = res.users?.find((x) => x.email === email);
    return u?.$id || null;
  } catch (e) {
    try {
      const res2 = await users.list([], email);
      const u2 = res2.users?.find((x) => x.email === email);
      return u2?.$id || null;
    } catch {}
  }
  return null;
}

async function main() {
  // Verify by counting teacher-role enrollments (should be 2)
  const enr = await db.listDocuments(DB_ID, 'enrollments', [
    Query.equal('role', ['teacher'])
  ]);
  const ids = enr.documents.map((d) => d.courseId);
  const unique = Array.from(new Set(ids));
  const mapped = [];
  for (const id of unique) {
    try {
      const c = await db.getDocument(DB_ID, 'courses', id);
      mapped.push({ code: c.code, id });
    } catch {
      mapped.push({ code: null, id });
    }
  }
  console.log('Teacher-role enrollments count:', enr.total);
  console.log('Courses with teacher role:', mapped);
}

main().catch((e) => { console.error(e); process.exit(1); });
