/*
  Dev-only seeder for Appwrite using Admin API Key.
  - Creates 1 teacher and 10 students
  - Seeds 2 courses and a few assignments
  - Creates a profile doc for each user with role

  Usage:
    1) Copy .env.example to .env and fill values.
    2) npm run seed

  NOTE: Keep your API key private; don't ship this file in production builds.
*/

require('dotenv').config();
const { Client, Users, Databases, ID } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  APPWRITE_USERS_COLLECTION_ID,
  APPWRITE_COURSES_COLLECTION_ID,
  APPWRITE_ASSIGNMENTS_COLLECTION_ID,
  APPWRITE_GROUPS_COLLECTION_ID,
  APPWRITE_PROGRESS_NODES_COLLECTION_ID,
  APPWRITE_MESSAGES_COLLECTION_ID,
} = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error('Missing required env. Please fill .env using .env.example');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);

async function createUserIfMissing({ email, password, name, role }) {
  try {
    // Try to find by email (Users API doesn't have query by email directly in all versions)
    // We'll attempt create and if it fails with conflict, fetch list and find.
    const created = await users.create(ID.unique(), email, undefined, password, name);
    console.log('Created user:', created.$id, email);
    await createProfileDoc(created.$id, { name, email, role });
    return created;
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('already exists') || msg.includes('409')) {
      // Fallback: list users and find by email
      const list = await users.list();
      const found = list.users.find((u) => u.email === email);
      if (!found) throw err;
      console.log('User exists:', found.$id, email);
      await createProfileDoc(found.$id, { name, email, role });
      return found;
    }
    console.error('Failed creating user', email, err);
    throw err;
  }
}

async function createProfileDoc(userId, { name, email, role }) {
  if (!APPWRITE_USERS_COLLECTION_ID) return; // skip if not configured
  try {
    await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_USERS_COLLECTION_ID, userId, {
      name,
      email,
      role,
    });
    console.log('Created profile doc for', email);
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('already exists') || msg.includes('409')) {
      console.log('Profile doc exists for', email);
      return;
    }
    console.error('Failed creating profile doc for', email, err);
  }
}

async function createCourseDoc({ code, title, teacherId }) {
  if (!APPWRITE_COURSES_COLLECTION_ID) return null;
  try {
    const doc = await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_COURSES_COLLECTION_ID, ID.unique(), {
      code,
      title,
      teacherId,
    });
    console.log('Created course', title);
    return doc;
  } catch (err) {
    console.error('Failed creating course', title, err);
    return null;
  }
}

async function createAssignmentDoc({ courseId, title, dueAt }) {
  if (!APPWRITE_ASSIGNMENTS_COLLECTION_ID) return null;
  try {
    const doc = await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_ASSIGNMENTS_COLLECTION_ID, ID.unique(), {
      courseId,
      title,
      dueAt,
    });
    console.log('Created assignment', title);
    return doc;
  } catch (err) {
    console.error('Failed creating assignment', title, err);
    return null;
  }
}

async function main() {
  // 1 teacher + 10 students
  const teacher = await createUserIfMissing({
    email: 'teacher1@demo.eduplus.test',
    password: 'Password123!',
    name: 'Teacher One',
    role: 'teacher',
  });

  const students = [];
  for (let i = 1; i <= 10; i++) {
    const email = `student${i}@demo.eduplus.test`;
    const user = await createUserIfMissing({
      email,
      password: 'Password123!',
      name: `Student ${i}`,
      role: 'student',
    });
    students.push(user);
  }

  // Courses
  const c1 = await createCourseDoc({ code: 'CS101', title: 'Intro to CS', teacherId: teacher.$id });
  const c2 = await createCourseDoc({ code: 'ENG201', title: 'Academic Writing', teacherId: teacher.$id });

  // Assignments
  if (c1) {
    await createAssignmentDoc({ courseId: c1.$id, title: 'Project Proposal', dueAt: new Date(Date.now() + 7*24*3600*1000).toISOString() });
    await createAssignmentDoc({ courseId: c1.$id, title: 'Prototype', dueAt: new Date(Date.now() + 14*24*3600*1000).toISOString() });
  }
  if (c2) {
    await createAssignmentDoc({ courseId: c2.$id, title: 'Literature Review', dueAt: new Date(Date.now() + 10*24*3600*1000).toISOString() });
  }

  console.log('Seeding completed. You can now sign in as teacher/student test accounts.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
