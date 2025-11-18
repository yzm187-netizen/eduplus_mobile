// Seeds demo lessons and two assignments (individual + group) for a specific course.
// Usage: COURSE_ID=<existingCourseId> TEACHER_ID=69149a330014b7376893 STUDENT_ID=6910b5e800174235c732 node -r dotenv/config scripts/appwrite/seed-lessons-assignments.js
// Requires collections: lessons, assessments, enrollments, groups, group_members
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const COURSE_ID = process.env.COURSE_ID;
  const TEACHER_ID = process.env.TEACHER_ID;
  const STUDENT_ID = process.env.STUDENT_ID;
  if (!endpoint || !project || !key || !DB_ID || !COURSE_ID || !TEACHER_ID || !STUDENT_ID) {
    console.error('[seed-lessons-assignments] Missing env vars. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, COURSE_ID, TEACHER_ID, STUDENT_ID');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);

  // Helper to safe-create (skip if existing)
  async function ensure(collection, data, perms) {
    const id = data.$id || sdk.ID.unique();
    if (data.$id) {
      try { await db.getDocument(DB_ID, collection, data.$id); return { skipped: true, id: data.$id }; } catch {}
    }
    const doc = await db.createDocument(DB_ID, collection, id, data, perms || []);
    return { skipped: false, id: doc.$id };
  }

  // Ensure enrollments
  const enrollWant = [
    { userId: TEACHER_ID, role: 'teacher' },
    { userId: STUDENT_ID, role: 'student' },
  ];
  for (const e of enrollWant) {
    const existing = await db.listDocuments(DB_ID, 'enrollments', [
      sdk.Query.equal('courseId', [COURSE_ID]),
      sdk.Query.equal('userId', [e.userId])
    ]);
    if (existing.total === 0) {
      await ensure('enrollments', {
        courseId: COURSE_ID,
        userId: e.userId,
        role: e.role,
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
      console.log('[enrollment] added', e.userId, e.role);
    }
  }

  // Lessons (3 demo)
  const now = Date.now();
  const lessonsData = [
    { topic: 'Introduction & Expectations', startsAt: new Date(now + 1*3600*1000).toISOString(), endsAt: new Date(now + 2*3600*1000).toISOString() },
    { topic: 'Core Concepts Deep Dive', startsAt: new Date(now + 24*3600*1000).toISOString(), endsAt: new Date(now + 25*3600*1000).toISOString() },
    { topic: 'Workshop & Q&A', startsAt: new Date(now + 48*3600*1000).toISOString(), endsAt: new Date(now + 49*3600*1000).toISOString() },
  ];
  for (const l of lessonsData) {
    const dup = await db.listDocuments(DB_ID, 'lessons', [sdk.Query.equal('courseId', [COURSE_ID]), sdk.Query.equal('topic', [l.topic])]);
    if (dup.total === 0) {
      await ensure('lessons', { courseId: COURSE_ID, topic: l.topic, startsAt: l.startsAt, endsAt: l.endsAt }, [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
        sdk.Permission.delete(sdk.Role.user(TEACHER_ID)),
      ]);
      console.log('[lesson] created', l.topic);
    } else {
      console.log('[lesson] skip existing', l.topic);
    }
  }

  // Group (for group assignment)
  const groupName = 'Project Team Alpha';
  let groupId;
  const gDup = await db.listDocuments(DB_ID, 'groups', [sdk.Query.equal('courseId', [COURSE_ID]), sdk.Query.equal('name', [groupName])]);
  if (gDup.total === 0) {
    const g = await ensure('groups', { courseId: COURSE_ID, name: groupName, createdAt: new Date().toISOString() }, [
      sdk.Permission.read(sdk.Role.users()),
      sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
    ]);
    groupId = g.id;
    console.log('[group] created', groupName);
  } else {
    groupId = gDup.documents[0].$id;
    console.log('[group] existing', groupName);
  }
  // group members (teacher lead + student member)
  const members = [
    { userId: TEACHER_ID, role: 'lead' },
    { userId: STUDENT_ID, role: 'member' },
  ];
  for (const m of members) {
    const gmDup = await db.listDocuments(DB_ID, 'group_members', [sdk.Query.equal('groupId', [groupId]), sdk.Query.equal('userId', [m.userId])]);
    if (gmDup.total === 0) {
      await ensure('group_members', { groupId, userId: m.userId, role: m.role, joinedAt: new Date().toISOString() }, [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
      ]);
      console.log('[group_member] added', m.userId);
    }
  }

  // Assignments (individual & group)
  const assignments = [
    { title: 'Reflection Essay', dueOffsetDays: 5, groupType: 'individual' },
    { title: 'Group Prototype Draft', dueOffsetDays: 10, groupType: 'group' },
  ];
  for (const a of assignments) {
    const aDup = await db.listDocuments(DB_ID, 'assessments', [sdk.Query.equal('courseId', [COURSE_ID]), sdk.Query.equal('title', [a.title])]);
    if (aDup.total === 0) {
      await ensure('assessments', {
        courseId: COURSE_ID,
        title: a.title,
        type: 'assignment',
        dueAt: new Date(Date.now() + a.dueOffsetDays*24*60*60*1000).toISOString(),
        createdAt: new Date().toISOString(),
        status: 'open',
        groupType: a.groupType, // custom field for UI differentiation
        description: a.groupType === 'group' ? 'Collaborative prototype deliverable.' : 'Individual reflective writing.',
      }, [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.user(TEACHER_ID)),
        sdk.Permission.delete(sdk.Role.user(TEACHER_ID)),
      ]);
      console.log('[assignment] created', a.title, a.groupType);
    } else {
      console.log('[assignment] skip existing', a.title);
    }
  }

  console.log('[seed-lessons-assignments] done');
}

main().catch(e => { console.error(e); process.exit(1); });
