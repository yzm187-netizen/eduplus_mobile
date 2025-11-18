/*
 Initialize Appwrite database and collections for EduPlus.
 - Uses Admin API key; intended for local dev only.
 - Idempotent-ish: attempts to create if missing and continues if exists.

 Usage:
   1) Copy .env.example to .env and fill APPWRITE_* values (Admin API key required)
   2) npm run init:schema

 After running, copy the printed collection IDs into app.json -> expo.extra.APPWRITE_COLLECTIONS
*/

require('dotenv').config();
const { Client, Databases, Permission, Role, ID } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
} = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('Missing required env (APPWRITE_ENDPOINT/PROJECT_ID/API_KEY). See .env.example');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function ensureDatabase(databaseId) {
  try {
    const db = await databases.get(databaseId);
    return db;
  } catch (err) {
    try {
      const db = await databases.create(databaseId, 'EduPlus');
      console.log('Created database:', databaseId);
      return db;
    } catch (e) {
      console.error('Failed to get/create database', databaseId, e.message || e);
      process.exit(1);
    }
  }
}

async function ensureCollection(databaseId, collectionId, name, permissions, documentSecurity = true, enabled = true) {
  try {
    const c = await databases.getCollection(databaseId, collectionId);
    return c;
  } catch (err) {
    try {
      const c = await databases.createCollection(databaseId, collectionId, name, permissions, documentSecurity, enabled);
      console.log('Created collection:', name, collectionId);
      return c;
    } catch (e) {
      console.error('Failed to create collection', name, e.message || e);
      throw e;
    }
  }
}

async function ensureStringAttr(databaseId, collectionId, key, size, required = false, defaultValue = undefined, array = false) {
  try {
    await databases.createStringAttribute(databaseId, collectionId, key, size, required, defaultValue, array);
    console.log('  + String attr', key);
  } catch (e) {
    if (String(e).includes('already exists') || String(e).includes('409')) return;
    console.warn('  ! String attr', key, '->', e.message || e);
  }
}

async function ensureEnumAttr(databaseId, collectionId, key, elements, required = false, defaultValue = undefined, array = false) {
  try {
    await databases.createEnumAttribute(databaseId, collectionId, key, elements, required, defaultValue, array);
    console.log('  + Enum attr', key);
  } catch (e) {
    if (String(e).includes('already exists') || String(e).includes('409')) return;
    console.warn('  ! Enum attr', key, '->', e.message || e);
  }
}

async function ensureDatetimeAttr(databaseId, collectionId, key, required = false, defaultValue = undefined, array = false) {
  try {
    await databases.createDatetimeAttribute(databaseId, collectionId, key, required, defaultValue, array);
    console.log('  + Datetime attr', key);
  } catch (e) {
    if (String(e).includes('already exists') || String(e).includes('409')) return;
    console.warn('  ! Datetime attr', key, '->', e.message || e);
  }
}

async function ensureFloatAttr(databaseId, collectionId, key, required = false, min = undefined, max = undefined, defaultValue = undefined, array = false) {
  try {
    await databases.createFloatAttribute(databaseId, collectionId, key, required, min, max, defaultValue, array);
    console.log('  + Float attr', key);
  } catch (e) {
    if (String(e).includes('already exists') || String(e).includes('409')) return;
    console.warn('  ! Float attr', key, '->', e.message || e);
  }
}

async function ensureIndex(databaseId, collectionId, key, type, attributes, orders = []) {
  try {
    await databases.createIndex(databaseId, collectionId, key, type, attributes, orders);
    console.log('  + Index', key);
  } catch (e) {
    if (String(e).includes('already exists') || String(e).includes('409')) return;
    console.warn('  ! Index', key, '->', e.message || e);
  }
}

(async function main() {
  const DB_ID = APPWRITE_DATABASE_ID || 'eduplus';
  await ensureDatabase(DB_ID);

  const permsPublicRead = [Permission.read(Role.any())];
  const permsUsersRead = [Permission.read(Role.users())];

  // 1) profiles (document id = auth user id)
  const PROFILES_ID = process.env.APPWRITE_USERS_COLLECTION_ID || 'profiles';
  await ensureCollection(DB_ID, PROFILES_ID, 'profiles', permsUsersRead, true, true);
  await ensureStringAttr(DB_ID, PROFILES_ID, 'name', 128, true);
  await ensureStringAttr(DB_ID, PROFILES_ID, 'email', 320, true);
  await ensureEnumAttr(DB_ID, PROFILES_ID, 'role', ['student', 'teacher', 'admin'], true, 'student');
  await ensureStringAttr(DB_ID, PROFILES_ID, 'avatarUrl', 1024, false);
  await ensureDatetimeAttr(DB_ID, PROFILES_ID, 'lastLogin', false);
  await ensureIndex(DB_ID, PROFILES_ID, 'email_unique', 'unique', ['email']);

  // 2) courses
  const COURSES_ID = process.env.APPWRITE_COURSES_COLLECTION_ID || 'courses';
  await ensureCollection(DB_ID, COURSES_ID, 'courses', permsUsersRead, true, true);
  await ensureStringAttr(DB_ID, COURSES_ID, 'code', 32, true);
  await ensureStringAttr(DB_ID, COURSES_ID, 'title', 256, true);
  await ensureStringAttr(DB_ID, COURSES_ID, 'teacherId', 64, true);
  // Allow ample room for catalog-style course descriptions
  await ensureStringAttr(DB_ID, COURSES_ID, 'description', 2048, false);
  await ensureIndex(DB_ID, COURSES_ID, 'code_unique', 'unique', ['code']);
  await ensureIndex(DB_ID, COURSES_ID, 'teacherId_idx', 'key', ['teacherId']);

  // 3) assignments
  const ASSIGNMENTS_ID = process.env.APPWRITE_ASSIGNMENTS_COLLECTION_ID || 'assignments';
  await ensureCollection(DB_ID, ASSIGNMENTS_ID, 'assignments', permsUsersRead, true, true);
  await ensureStringAttr(DB_ID, ASSIGNMENTS_ID, 'courseId', 64, true);
  await ensureStringAttr(DB_ID, ASSIGNMENTS_ID, 'title', 256, true);
  await ensureDatetimeAttr(DB_ID, ASSIGNMENTS_ID, 'dueAt', true);
  await ensureIndex(DB_ID, ASSIGNMENTS_ID, 'course_idx', 'key', ['courseId']);
  await ensureIndex(DB_ID, ASSIGNMENTS_ID, 'dueAt_idx', 'key', ['dueAt']);

  // 4) groups
  const GROUPS_ID = process.env.APPWRITE_GROUPS_COLLECTION_ID || 'groups';
  await ensureCollection(DB_ID, GROUPS_ID, 'groups', permsUsersRead, true, true);
  await ensureStringAttr(DB_ID, GROUPS_ID, 'assignmentId', 64, true);
  await ensureStringAttr(DB_ID, GROUPS_ID, 'name', 128, true);
  await ensureIndex(DB_ID, GROUPS_ID, 'assignment_idx', 'key', ['assignmentId']);

  // 5) progressNodes (tree)
  const NODES_ID = process.env.APPWRITE_PROGRESS_NODES_COLLECTION_ID || 'progress_nodes';
  await ensureCollection(DB_ID, NODES_ID, 'progress_nodes', permsUsersRead, true, true);
  await ensureStringAttr(DB_ID, NODES_ID, 'groupId', 64, true);
  await ensureStringAttr(DB_ID, NODES_ID, 'title', 256, true);
  await ensureFloatAttr(DB_ID, NODES_ID, 'percent', true, 0, 100, 0);
  await ensureStringAttr(DB_ID, NODES_ID, 'parentId', 64, false);
  await ensureIndex(DB_ID, NODES_ID, 'group_idx', 'key', ['groupId']);
  await ensureIndex(DB_ID, NODES_ID, 'parent_idx', 'key', ['parentId']);

  // 6) messages
  const MESSAGES_ID = process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
  await ensureCollection(DB_ID, MESSAGES_ID, 'messages', permsUsersRead, true, true);
  await ensureStringAttr(DB_ID, MESSAGES_ID, 'groupId', 64, true);
  await ensureStringAttr(DB_ID, MESSAGES_ID, 'userId', 64, true);
  await ensureStringAttr(DB_ID, MESSAGES_ID, 'text', 16384, true);
  await ensureDatetimeAttr(DB_ID, MESSAGES_ID, 'createdAt', true);
  await ensureIndex(DB_ID, MESSAGES_ID, 'group_created_idx', 'key', ['groupId', 'createdAt'], ['ASC', 'ASC']);

  console.log('\nSchema ready. If you used fallback IDs, the defaults are:');
  console.log({
    database: DB_ID,
    collections: {
      profiles: PROFILES_ID,
      courses: COURSES_ID,
      assignments: ASSIGNMENTS_ID,
      groups: GROUPS_ID,
      progressNodes: NODES_ID,
      messages: MESSAGES_ID,
    },
  });
  console.log('\nCopy these IDs into app.json -> expo.extra.APPWRITE_*');
})();
