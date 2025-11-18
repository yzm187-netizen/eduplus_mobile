#!/usr/bin/env node
/**
 * Ensure 'position' integer attribute exists on lessons collection and backfill sequential positions per course.
 */
const { Client, Databases } = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  if (!project || !key || !databaseId) {
    console.error('Missing APPWRITE env vars (PROJECT_ID, API_KEY, DATABASE_ID).');
    process.exit(1);
  }
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new Databases(client);
  const lessonsCollectionId = 'lessons';

  try {
    const coll = await databases.getCollection(databaseId, lessonsCollectionId);
    const hasPosition = coll.attributes.some(a => a.key === 'position');
    if (!hasPosition) {
      console.log('[ensure-lessons-position-attr] creating integer attribute position');
      // createIntegerAttribute(db, coll, key, required, min, max, default, array)
      await databases.createIntegerAttribute(databaseId, lessonsCollectionId, 'position', false, 0, null, null, false);
    } else {
      console.log('[ensure-lessons-position-attr] position attribute already exists');
    }
  } catch (e) {
    console.error('Failed retrieving/creating attribute', e.message || e);
    process.exit(1);
  }

  // Fetch all lessons (paginate if needed)
  let page = 0; const limit = 200; let allLessons = [];
  while (true) {
    try {
      const res = await databases.listDocuments(databaseId, lessonsCollectionId, [/* no filters */]);
      allLessons = res.documents;
      break; // node-appwrite listDocuments currently returns all unless queries specified
    } catch (e) {
      console.error('Failed listing lessons page', page, e.message || e);
      process.exit(1);
    }
  }
  const byCourse = {};
  for (const d of allLessons) {
    byCourse[d.courseId] = byCourse[d.courseId] || [];
    byCourse[d.courseId].push(d);
  }
  for (const courseId of Object.keys(byCourse)) {
    const arr = byCourse[courseId].sort((a, b) => {
      const pa = typeof a.position === 'number' ? a.position : null;
      const pb = typeof b.position === 'number' ? b.position : null;
      if (pa != null && pb != null && pa !== pb) return pa - pb;
      return new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime();
    });
    console.log(`[ensure-lessons-position-attr] backfill course ${courseId} -> ${arr.length} lessons`);
    for (let i = 0; i < arr.length; i++) {
      const d = arr[i];
      const desired = i + 1;
      if (d.position === desired) continue;
      try {
        await databases.updateDocument(databaseId, lessonsCollectionId, d.$id, { position: desired });
        console.log('  updated', d.$id, 'position', desired);
      } catch (e) {
        console.warn('  failed update position', d.$id, e.message || e);
      }
    }
  }
  console.log('[ensure-lessons-position-attr] complete');
}

main().catch(err => { console.error(err); process.exit(1); });
