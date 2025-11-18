// Seeds structured lessons + notes/resources for every course
// Usage: TEACHER_ID=<id> node -r dotenv/config scripts/appwrite/seed-lessons-with-notes.js
// Requires collections: courses, lessons, notes
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const TEACHER_ID = process.env.TEACHER_ID;
  if (!endpoint || !project || !key || !DB_ID || !TEACHER_ID) {
    console.error('[seed-lessons-with-notes] Missing env vars (need TEACHER_ID + Appwrite basics)');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  const courses = await db.listDocuments(DB_ID, 'courses', [sdk.Query.limit(200)]);
  for (const course of courses.documents) {
    const baseTopics = [
      'Overview & Outcomes',
      'Core Concepts',
      'Applied Workshop',
    ];
    console.log(`[course] ${course.$id} processing lessons`);
    // Create lessons if absent per topic
    for (let i=0;i<baseTopics.length;i++) {
      const topic = baseTopics[i];
      const dup = await db.listDocuments(DB_ID, 'lessons', [sdk.Query.equal('courseId',[course.$id]), sdk.Query.equal('topic',[topic])]);
      if (dup.total === 0) {
        const starts = new Date(Date.now() + (i+1)*24*3600*1000).toISOString();
        const ends = new Date(Date.now() + (i+1)*24*3600*1000 + 3600*1000).toISOString();
        await db.createDocument(DB_ID, 'lessons', sdk.ID.unique(), {
          courseId: course.$id,
          topic,
          startsAt: starts,
          endsAt: ends,
        }, [
          sdk.Permission.read(sdk.Role.users()),
          sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
          sdk.Permission.delete(sdk.Role.user(TEACHER_ID))
        ]);
        console.log('[lesson] created', topic);
      } else {
        console.log('[lesson] exists', topic);
      }
    }

    // Create one note per lesson if none exists
    for (const lesson of (await db.listDocuments(DB_ID,'lessons',[sdk.Query.equal('courseId',[course.$id]), sdk.Query.limit(50)])).documents) {
      const existingNotes = await db.listDocuments(DB_ID,'notes',[sdk.Query.equal('lessonId',[lesson.$id])]);
      if (existingNotes.total === 0) {
        await db.createDocument(DB_ID, 'notes', sdk.ID.unique(), {
          courseId: course.$id,
          lessonId: lesson.$id,
          title: `${lesson.topic} Notes`,
          body: `PDF placeholder link for '${lesson.topic}'. Additional resources forthcoming.`,
          visibility: 'all',
          createdAt: new Date().toISOString(),
        }, [
          sdk.Permission.read(sdk.Role.users()),
          sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
          sdk.Permission.delete(sdk.Role.user(TEACHER_ID))
        ]);
        console.log('[note] created for lesson', lesson.topic);
      }
    }
  }
  console.log('[seed-lessons-with-notes] complete');
}

main().catch(e => { console.error(e); process.exit(1); });
