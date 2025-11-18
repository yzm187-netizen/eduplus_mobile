#!/usr/bin/env node
/**
 * Ensure 'about' string attribute exists on lessons collection.
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
    const hasAbout = coll.attributes.some(a => a.key === 'about');
    if (!hasAbout) {
      console.log('[ensure-lessons-about-attr] creating string attribute about (max 1000)');
      // createStringAttribute(databaseId, collectionId, key, size, required, default, array)
      await databases.createStringAttribute(databaseId, lessonsCollectionId, 'about', 1000, false, null, false);
      console.log('[ensure-lessons-about-attr] about attribute created');
    } else {
      console.log('[ensure-lessons-about-attr] about attribute already exists');
    }
  } catch (e) {
    console.error('Failed retrieving/creating attribute', e.message || e);
    process.exit(1);
  }
  console.log('[ensure-lessons-about-attr] complete');
}

main().catch(err => { console.error(err); process.exit(1); });
