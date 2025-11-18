// Replaces mistaken student ID in teacherIds with correct teacher ID; adjusts update/delete permissions.
// Usage: TEACHER_ID=69149a330014b7376893 STUDENT_ID=6910b5e800174235c732 node -r dotenv/config scripts/appwrite/fix-course-teachers.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COL_COURSES = 'courses';
  const TEACHER_ID = process.env.TEACHER_ID;
  const STUDENT_ID = process.env.STUDENT_ID;
  if (!endpoint || !project || !key || !DB_ID || !TEACHER_ID || !STUDENT_ID) {
    console.error('[fix-course-teachers] Missing required env vars. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, TEACHER_ID, STUDENT_ID');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  let cursor; let scanned=0, updated=0;
  const batch = Number(process.env.BATCH || 50);
  while (true) {
    const res = await db.listDocuments(DB_ID, COL_COURSES, [sdk.Query.limit(batch), ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])]);
    for (const doc of res.documents) {
      scanned++; cursor = doc.$id;
      const teachers = Array.isArray(doc.teacherIds) ? doc.teacherIds.slice() : [];
      const perms = Array.isArray(doc.$permissions) ? doc.$permissions.slice() : [];
      let changed=false;
      // Remove mistaken student id from teacherIds
      if (teachers.includes(STUDENT_ID)) {
        const idx = teachers.indexOf(STUDENT_ID); teachers.splice(idx,1); changed=true;
      }
      // Ensure teacher id present
      if (!teachers.includes(TEACHER_ID)) { teachers.push(TEACHER_ID); changed=true; }
      // Permission adjustments
      const wanted = [
        `update("user:${TEACHER_ID}")`,
        `delete("user:${TEACHER_ID}")`,
      ];
      // Remove mistaken student's update/delete perms
      const permsFiltered = perms.filter(p => !p.includes(`user:${STUDENT_ID}`));
      const nextPerms = Array.from(new Set([...permsFiltered, ...wanted]));
      if (nextPerms.length !== perms.length) changed = true; // changed permissions
      if (!changed) continue;
      await db.updateDocument(DB_ID, COL_COURSES, doc.$id, { teacherIds: teachers }, nextPerms);
      updated++;
      console.log(`[fix] ${doc.$id} teacherIds=${teachers.join(',')} permsAdded=${nextPerms.length - perms.length}`);
    }
    if (res.documents.length < batch) break;
  }
  console.log(`[done] scanned=${scanned} updated=${updated}`);
  if (updated===0) console.log('[fix-course-teachers] No changes applied (already consistent).');
}

main().catch(e=>{ console.error(e); process.exit(1); });
