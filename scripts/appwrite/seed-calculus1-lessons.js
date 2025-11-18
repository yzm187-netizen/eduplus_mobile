// Seed three non-repetitive Calculus I lessons with short descriptions
// Usage: TEACHER_ID=<id> node -r dotenv/config scripts/appwrite/seed-calculus1-lessons.js
// Requires collections: courses, lessons, notes
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const TEACHER_ID = process.env.TEACHER_ID;
  const TARGET_NAME = (process.env.CALC_NAME || 'Calculus I').toLowerCase();
  if (!endpoint || !project || !key || !DB_ID || !TEACHER_ID) {
    console.error('[seed-calculus1-lessons] Missing env vars (need TEACHER_ID + Appwrite basics)');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  const courses = await db.listDocuments(DB_ID, 'courses', [sdk.Query.limit(200)]);
  const calc = courses.documents.find((c) => String(c.name || '').toLowerCase().includes(TARGET_NAME) || String(c.code || '').toLowerCase().includes('math 101'));
  if (!calc) {
    console.error('[seed-calculus1-lessons] No course matching Calculus I (name contains "Calculus I" or code contains "MATH 101").');
    process.exit(2);
  }
  console.log(`[course] ${calc.$id} ${calc.code || ''} ${calc.name || ''}`);

  const topics = [
    { topic: 'Limits & Continuity', about: 'Foundations of limits, continuity, and basic epsilon–delta intuition.' },
    { topic: 'Derivatives', about: 'Definition via limits, rules (product, quotient, chain), and practice.' },
    { topic: 'Applications of Derivatives', about: 'Optimization, related rates, and curve sketching using derivatives.' },
  ];

  const existing = await db.listDocuments(DB_ID, 'lessons', [sdk.Query.equal('courseId', [calc.$id]), sdk.Query.limit(100)]);
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const dup = existing.documents.find((l) => String(l.topic || l.title || '').toLowerCase() === t.topic.toLowerCase());
    if (!dup) {
      const starts = new Date(Date.now() + (i + 1) * 24 * 3600 * 1000).toISOString();
      const ends = new Date(Date.now() + (i + 1) * 24 * 3600 * 1000 + 3600 * 1000).toISOString();
      const lesson = await db.createDocument(DB_ID, 'lessons', sdk.ID.unique(), {
        courseId: calc.$id,
        topic: t.topic,
        about: t.about,
        startsAt: starts,
        endsAt: ends,
      }, [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
        sdk.Permission.delete(sdk.Role.user(TEACHER_ID))
      ]);
      console.log('[lesson] created', t.topic);
      // Create a placeholder notes doc (no attachment yet); will not show in UI until upload adds attachment
      await db.createDocument(DB_ID, 'notes', sdk.ID.unique(), {
        courseId: calc.$id,
        lessonId: lesson.$id,
        title: `${t.topic} Main Notes`,
        body: 'Main notes to be uploaded as attachment (PDF/PPT).',
        visibility: 'all',
        createdAt: new Date().toISOString(),
      }, [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
        sdk.Permission.delete(sdk.Role.user(TEACHER_ID))
      ]);
      console.log('[note] placeholder created for', t.topic);
    } else {
      // Update about if missing
      if (!dup.about) {
        await db.updateDocument(DB_ID, 'lessons', dup.$id, { about: t.about });
        console.log('[lesson] updated about', t.topic);
      } else {
        console.log('[lesson] exists', t.topic);
      }
    }
  }
  console.log('[seed-calculus1-lessons] complete');
}

main().catch((e) => { console.error(e); process.exit(1); });
